// Section identity across edits — the part of the markdown control that makes it storage-aware.
//
// The document the user edits is a PROJECTION: N separately stored Section rows concatenated into one string. An
// edit anywhere in it has to be written back to the right rows, keeping each row's id, order and content hash
// stable — those hashes drive retrieval indexing, so churning them is not cosmetic.
//
// The editor carries each Section.Id on its own nodes and sends the whole document back as an ordered block list
// with the ids attached, so the SERVER never has to guess. All this module does is answer "which section is this
// block?" after an arbitrary edit. It does so in four tiers, and none of them is a similarity score:
//
//   1. POSITION      — ProseMirror's own position mapping, the exact answer for an in-place edit.
//   2. CONTENT       — exact equality against the editor's last-known text, which recovers a moved section.
//   3. SUSPECT POS   — a position the mapping called "deleted" but which still holds a heading (a relevel).
//   4. SEQUENCE      — an LCS alignment, for a whole-document replacement (the raw-mode toggle).
//
// Ordering is itself load-bearing: tier 3 runs after tier 2 so a genuinely deleted section's id cannot land on the
// heading that followed it. Each tier exists because a specific edit defeats the ones above it; see the notes.

import type { Node as PMNode } from '@milkdown/kit/prose/model';
import type { Transaction } from '@milkdown/kit/prose/state';

/** A block of the document as the editor holds it — a heading and everything under it, or the level-0 preamble. */
export interface Block {
  /** the Section.Id this block belongs to, or null when the editor created it */
  id: string | null;
  level: number;
  /** heading MARKDOWN SOURCE (marks intact) — the store keeps the source, so stripping here would lose it */
  heading: string;
  body: string;
  /** heading text with marks flattened, for display only */
  headingPlain: string;
  /** the heading node's position in the doc; -1 for the preamble */
  pos: number;
}

export type PriorContent = Map<string, { heading: string; body: string }>;

export class SectionIdTracker {
  /** ids whose heading position survived every edit intact — the trustworthy tier */
  private posById = new Map<string, number>();
  /**
   * ids the mapping reported as deleted, with the position it still resolved to.
   *
   * "Deleted" is weaker than it sounds. A relevel is expressed as setNodeMarkup, which REPLACES the heading node,
   * so ProseMirror reports the old position deleted even though a heading is still sitting exactly there.
   * Discarding these outright loses identity for any relevel that arrives with a content change in the same save.
   */
  private suspect = new Map<string, number>();
  /** the level-0 preamble has no heading node to pin to; there is at most one and it is always first */
  private preambleId: string | null = null;

  init(doc: PMNode, headingIdsInOrder: string[], preambleId: string | null) {
    this.posById.clear();
    this.suspect.clear();
    this.preambleId = preambleId;
    let i = 0;
    doc.forEach((node, offset) => {
      if (node.type.name === 'heading' && i < headingIdsInOrder.length) {
        this.posById.set(headingIdsInOrder[i], offset);
        i++;
      }
    });
  }

  /**
   * Remap every tracked position through a transaction.
   *
   * The association bias is +1 (to the right) and that is not incidental: an insertion made exactly AT a heading's
   * position is the user adding a new section ABOVE this one. Biasing left leaves the tracked position pinned to
   * the newly inserted heading, which hands the existing section's id to brand-new content and marks the original
   * as created — silent identity churn that looks like it worked.
   */
  apply(tr: Transaction) {
    if (!tr.docChanged) return;
    // Existing suspects are remapped first, so an id demoted by THIS transaction is not mapped twice.
    for (const [id, pos] of [...this.suspect]) this.suspect.set(id, tr.mapping.map(pos, 1));
    for (const [id, pos] of [...this.posById]) {
      const r = tr.mapping.mapResult(pos, 1);
      if (r.deleted) {
        this.posById.delete(id);
        this.suspect.set(id, r.pos);
      } else {
        this.posById.set(id, r.pos);
      }
    }
  }

  idAtPos(pos: number): string | null {
    for (const [id, p] of this.posById) if (p === pos) return id;
    return null;
  }

  suspectIdAtPos(pos: number): string | null {
    for (const [id, p] of this.suspect) if (p === pos) return id;
    return null;
  }

  preamble() {
    return this.preambleId;
  }
  dropped() {
    return [...this.suspect.keys()];
  }
  relink(id: string, pos: number) {
    this.suspect.delete(id);
    this.posById.set(id, pos);
  }
}

export interface SerializeDeps {
  schema: { topNodeType: { create(attrs: null, content: PMNode[]): PMNode } };
  serialize(node: PMNode): string;
}

/**
 * Split the doc into blocks at heading boundaries.
 *
 * Headings are always top level in the markdown schema, so sections are a flat ordered list — the same shape the
 * store already uses. Bodies are serialized per block rather than by slicing one big markdown string, so a `#`
 * inside a fenced code block can never be mistaken for a section boundary.
 */
export function extractBlocks(doc: PMNode, deps: SerializeDeps, tracker: SectionIdTracker): Block[] {
  const out: Block[] = [];
  let cur: { level: number; heading: string; headingPlain: string; pos: number; body: PMNode[] } | null = null;

  const flush = () => {
    if (!cur) return;
    const body = cur.body.length ? deps.serialize(deps.schema.topNodeType.create(null, cur.body)).trimEnd() : '';
    out.push({
      id: cur.pos === -1 ? tracker.preamble() : tracker.idAtPos(cur.pos),
      level: cur.level,
      heading: cur.heading,
      headingPlain: cur.headingPlain,
      body,
      pos: cur.pos,
    });
    cur = null;
  };

  doc.forEach((node, offset) => {
    if (node.type.name === 'heading') {
      flush();
      cur = {
        level: node.attrs.level as number,
        heading: headingSource(node, deps),
        headingPlain: node.textContent,
        pos: offset,
        body: [],
      };
    } else {
      if (!cur) cur = { level: 0, heading: '', headingPlain: '', pos: -1, body: [] };
      cur.body.push(node);
    }
  });
  flush();
  return out;
}

/** The heading's markdown source: serialize the heading alone, then drop the ATX prefix. */
function headingSource(node: PMNode, deps: SerializeDeps): string {
  const rendered = deps.serialize(deps.schema.topNodeType.create(null, [node])).trimEnd();
  return rendered.replace(/^#{1,6}\s*/, '');
}

/**
 * Tier 2 — match unclaimed blocks to dropped ids by exact content.
 *
 * A move performed as cut+paste deletes the heading at the old position and inserts it at the new one, so tier 1
 * legitimately loses it; the content is unchanged, so comparing content recovers it exactly.
 *
 * `prior` must be the editor's LAST-KNOWN content, not what the server last stored. Comparing against the store
 * strands every section with unsaved edits: after a raw-mode round trip such a section matches neither a position
 * nor the stored text, and would be deleted and recreated under a new id.
 */
export function relinkByContent(blocks: Block[], tracker: SectionIdTracker, prior: PriorContent) {
  const dropped = tracker.dropped();
  if (!dropped.length) return;
  const unclaimed = blocks.filter((b) => b.id == null);
  if (!unclaimed.length) return;

  const byContent = new Map<string, string[]>();
  for (const id of dropped) {
    const p = prior.get(id);
    if (!p) continue;
    const key = `${p.heading}\u0000${p.body}`;
    const list = byContent.get(key) ?? [];
    list.push(id);
    byContent.set(key, list);
  }

  for (const b of unclaimed) {
    const list = byContent.get(`${b.heading}\u0000${b.body}`);
    if (list?.length) {
      const id = list.shift()!;
      b.id = id;
      if (b.pos >= 0) tracker.relink(id, b.pos);
    }
  }
}

/**
 * Tier 3 — an unclaimed block whose position matches a suspect id claims it.
 *
 * Runs after tier 2 on purpose. A genuine section deletion also leaves a suspect id, and its mapped position often
 * lands on the FOLLOWING heading — but that heading was already claimed on tier 1, so it is not unclaimed and the
 * dead id cannot leak onto it. The ordering is what makes this tier safe.
 */
export function relinkBySuspectPosition(blocks: Block[], tracker: SectionIdTracker) {
  for (const b of blocks) {
    if (b.id != null || b.pos < 0) continue;
    const id = tracker.suspectIdAtPos(b.pos);
    if (id != null) {
      b.id = id;
      tracker.relink(id, b.pos);
    }
  }
}

/**
 * Tier 4 — sequence alignment, for a whole-document replacement.
 *
 * Switching to raw markdown and back replaces every node at once, so tier 1 has nothing left and tier 2 only saves
 * sections whose text is byte-identical. A section RETITLED in raw mode matches neither and would come back as a
 * delete plus a create.
 *
 * So: run an LCS over the block sequence to find the unchanged anchors, then treat an unmatched run between two
 * anchors as MODIFICATIONS and pair it in order. That is the same call an ordinary text diff makes when it reports
 * a change rather than a removal followed by an addition — deterministic, not a similarity score. It only ever
 * looks at blocks the earlier tiers left unclaimed.
 */
export function alignBySequence(blocks: Block[], prev: { id: string | null; heading: string; body: string }[], tracker: SectionIdTracker) {
  if (blocks.every((b) => b.id != null)) return;

  const key = (b: { heading: string; body: string }) => `${b.heading}\u0000${b.body}`;
  const a = prev.map(key);
  const c = blocks.map(key);
  const m = a.length, n = c.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === c[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);

  const pairs: [number, number][] = [];
  let runPrev: number[] = [], runNext: number[] = [];
  const flushRun = () => {
    for (let k = 0; k < Math.min(runPrev.length, runNext.length); k++) pairs.push([runPrev[k], runNext[k]]);
    runPrev = []; runNext = [];
  };
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === c[j]) { flushRun(); pairs.push([i, j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) runPrev.push(i++);
    else runNext.push(j++);
  }
  while (i < m) runPrev.push(i++);
  while (j < n) runNext.push(j++);
  flushRun();

  const taken = new Set(blocks.map((b) => b.id).filter(Boolean) as string[]);
  for (const [pi, bi] of pairs) {
    const id = prev[pi].id;
    const block = blocks[bi];
    if (id == null || block.id != null || taken.has(id)) continue;
    block.id = id;
    taken.add(id);
    if (block.pos >= 0) tracker.relink(id, block.pos);
  }
}
