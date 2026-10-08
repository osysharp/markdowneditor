// The markdown control — a foreign-control shim (mount/update/destroy) over a headless Milkdown editor for the
// rendered view and CodeMirror 6 for the raw source view, fused to the platform's SECTIONED markdown storage.
//
// What makes this different from dropping in an editor: the document is stored as N Section rows, and the string
// being edited is their concatenation. Every save has to land on the right rows with their ids, order and content
// hashes intact. The editor carries each Section.Id on its own nodes and sends the document back as an ordered
// GUID-tagged block list; the server reconciles it exactly, with no matching heuristics. section-map.ts holds the
// four tiers that keep those ids attached across arbitrary edits, including structural ones.
//
// The document is NOT passed as props. Sections are a document's worth of text that the editor rewrites on every
// keystroke, so the app hands over the document's ADDRESS (ownerType / ownerId / property) and the control reads
// and writes it through `host.data` — the session's own credentialed channel. Everything visual resolves through
// `host.tokens` / `var(--…)`, so the control has no theme of its own.
//
// Type-check it with `npm run typecheck`. esbuild only STRIPS types — it never checks them — so the bundle builds
// happily against a contract this shim disagrees with. The check is what makes the generated ABI load-bearing: it
// catches an `emit` with the wrong arity and an event name the control never declared, two drifts that are otherwise
// silent at every layer.
//
// The control's declaration — props, events, commands, slots, chunks and probe — is `markdown.osy`, beside this file.

import {
  Editor, rootCtx, defaultValueCtx, schemaCtx, serializerCtx, parserCtx,
  editorViewCtx, editorViewOptionsCtx, remarkStringifyOptionsCtx,
} from '@milkdown/kit/core';
import { commonmark, listItemSchema, bulletListSchema, orderedListSchema } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';
import { block, BlockProvider } from '@milkdown/kit/plugin/block';
import { cursor } from '@milkdown/kit/plugin/cursor';
import { slashFactory, SlashProvider } from '@milkdown/kit/plugin/slash';
import { tooltipFactory, TooltipProvider } from '@milkdown/kit/plugin/tooltip';
import {
  wrapInHeadingCommand, turnIntoTextCommand, wrapInBulletListCommand, wrapInOrderedListCommand,
  wrapInBlockquoteCommand, createCodeBlockCommand, insertHrCommand, liftListItemCommand, insertImageCommand,
  toggleStrongCommand, toggleEmphasisCommand, toggleInlineCodeCommand,
  toggleLinkCommand, updateLinkCommand,
} from '@milkdown/kit/preset/commonmark';
import {
  insertTableCommand, addRowBeforeCommand, addRowAfterCommand, addColBeforeCommand, addColAfterCommand,
  deleteSelectedCellsCommand, selectRowCommand, selectColCommand, setAlignCommand,
  toggleStrikethroughCommand,
} from '@milkdown/kit/preset/gfm';
import { callCommand } from '@milkdown/kit/utils';
import { lift } from '@milkdown/kit/prose/commands';
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { TextSelection } from '@milkdown/kit/prose/state';
import { math } from './math';
import { DiagramView, isMermaid } from './diagrams';
import { EditorState } from '@codemirror/state';
import { EditorView as CMView, keymap, highlightActiveLine, drawSelection } from '@codemirror/view';
import { markdown as cmMarkdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history as cmHistory, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags as t, tagHighlighter, highlightTree } from '@lezer/highlight';
import { javascriptLanguage, typescriptLanguage, jsxLanguage, tsxLanguage } from '@codemirror/lang-javascript';
import { cssLanguage } from '@codemirror/lang-css';
import { htmlLanguage } from '@codemirror/lang-html';
import { markdownLanguage } from '@codemirror/lang-markdown';

import {
  SectionIdTracker, extractBlocks, relinkByContent, relinkBySuspectPosition, alignBySequence,
  type Block, type PriorContent,
} from './section-map';
// A REAL stylesheet, inlined as text by `osy control build` (esbuild `--loader:.css=text`). Keeping the CSS in its own
// file rather than in a template literal means a backtick in it — even inside a CSS comment — cannot end the string
// and silently rewrite the stylesheet.
import EDITOR_CSS from './markdown-theme.css';

// THE CONTRACT, not a copy of it. `osy control build` generates markdown.control.d.ts from the `control
// MarkdownEditor { … }` declaration in markdown.osy, so importing it is what makes a disagreement between the shim
// and the declaration a type error instead of a browser mystery. Hand-written copies of these interfaces could drift
// from the declaration without anything noticing.
import type { MarkdownEditorHandle, MarkdownEditorHost, MarkdownEditorProps } from './markdown.control';

type Host = MarkdownEditorHost;
// The platform sends every declared prop, but it sends the DEFAULTS for ones the call site omitted — so the shim
// still reads them defensively where a missing value is meaningful (an owner address that is not there yet).
type Props = Partial<MarkdownEditorProps>;

interface ServerSection { id: string; level: number; heading: string; slug: string; contentHash: string }
interface ReadResponse { documentId: string; markdown: string; sections: ServerSection[] }
interface SaveResponse { updated: string[]; created: string[]; deleted: string[]; unchanged: string[]; order: string[] }
interface ConflictResponse { error: string; conflicts: { id: string; level: number; heading: string; body: string }[] }

const AUTOSAVE_MS = 1200;
const FACES = ['editorial', 'sans', 'serif'];

/** The stylesheet is injected once per document, not once per control — two editors on a page share it. */
function ensureStyles(doc: Document) {
  if (doc.getElementById('osy-md-styles')) return;
  const style = doc.createElement('style');
  style.id = 'osy-md-styles';
  style.textContent = EDITOR_CSS;
  doc.head.appendChild(style);
}

const cmHighlight = HighlightStyle.define([
  { tag: t.heading1, fontWeight: '700', fontSize: '1.2em', color: 'var(--colors-onbg)' },
  { tag: t.heading2, fontWeight: '680', fontSize: '1.1em', color: 'var(--colors-onbg)' },
  { tag: [t.heading3, t.heading4, t.heading5, t.heading6], fontWeight: '650', color: 'var(--colors-onbg)' },
  { tag: t.strong, fontWeight: '680', color: 'var(--colors-onbg)' },
  { tag: t.emphasis, fontStyle: 'italic' },
  { tag: t.link, color: 'var(--colors-primary)', textDecoration: 'underline' },
  { tag: t.url, color: 'color-mix(in oklch, var(--colors-onsurface) 55%, transparent)' },
  { tag: t.monospace, color: 'color-mix(in oklch, var(--colors-onsurface) 92%, var(--colors-primary))' },
  { tag: t.quote, color: 'color-mix(in oklch, var(--colors-onsurface) 78%, transparent)', fontStyle: 'italic' },
  // ATX hashes, list bullets, quote markers and fence ticks all arrive as processingInstruction. Dimming them keeps
  // the prose dominant, which is what separates a source view you can read from one you merely tolerate.
  { tag: t.processingInstruction, color: 'color-mix(in oklch, var(--colors-onsurface) 40%, transparent)' },
]);

/**
 * A selected RUN of sibling blocks — what makes "move the whole list in one operation" possible.
 *
 * ProseMirror's own NodeSelection holds exactly ONE node, so a multi-block selection needs a concept of its own. It
 * lives in plugin state (not in the shim) so that decorations recompute through the normal state pipeline rather
 * than by poking at the DOM, and so any edit can clear it declaratively.
 *
 * The run is stored as an absolute [from, to) span plus the DEPTH its members sit at — depth is what keeps the
 * decoration on the blocks you picked instead of also painting their children.
 */
interface BlockRange { from: number; to: number; depth: number }
const blockRangeKey = new PluginKey<BlockRange | null>('osy-md-block-range');

const blockRangePlugin = $prose(() => new Plugin<BlockRange | null>({
  key: blockRangeKey,
  state: {
    init: () => null,
    apply(tr, value) {
      const meta = tr.getMeta(blockRangeKey);
      if (meta !== undefined) return meta as BlockRange | null;

      // SELECTING TEXT ACROSS BLOCKS IS A BLOCK SELECTION. Sweeping the mouse down the page is how people select
      // several things; requiring them to find and shift-click handles instead is the editor asking them to learn
      // its mechanism. When a text selection spans more than one sibling block, that IS the run.
      if (tr.selectionSet && tr.selection instanceof TextSelection) {
        const { $from, $to } = tr.selection;
        const nr = $from.blockRange($to);
        if (nr && nr.endIndex - nr.startIndex >= 2)
          return { from: nr.start, to: nr.end, depth: nr.depth };
        // Collapsing back into a single block is a return to writing — the run goes with it.
        return null;
      }
      // A NodeSelection is what clicking a handle produces; it must not clobber a run that was just built.
      // Any edit invalidates the run: the positions it holds describe a document that no longer exists. Clearing is
      // the honest response — mapping them forward would silently keep a selection the user can no longer see.
      if (tr.docChanged) return null;
      return value;
    },
  },
  props: {
    decorations(state) {
      const r = blockRangeKey.getState(state);
      if (!r) return null;
      const decos: Decoration[] = [];
      state.doc.nodesBetween(r.from, r.to, (node, pos) => {
        if (pos < r.from || pos + node.nodeSize > r.to) return true;
        if (state.doc.resolve(pos).depth !== r.depth) return true;
        decos.push(Decoration.node(pos, pos + node.nodeSize, { class: 'osy-md__block-selected' }));
        return false;   // do not descend — the children are not separately selected
      });
      return DecorationSet.create(state.doc, decos);
    },
  },
}));

// ── Code-block syntax highlighting ──────────────────────────────────────────────────────────────────────────────
//
// No new dependency: the Lezer grammars are ALREADY in this bundle for the source view, and `highlightTree` walks a
// parse tree handing back token ranges. What it hands back is up to us — `tagHighlighter` maps Lezer's tags to OUR
// OWN class names, which is the whole reason not to reach for Shiki here: Shiki inlines colours, and an inlined
// colour cannot follow the app's theme. Classes styled from tokens can, so a code block matches the app in light
// and dark without the control knowing what either looks like.
const CODE_PARSERS: Record<string, any> = {
  js: javascriptLanguage.parser, javascript: javascriptLanguage.parser, mjs: javascriptLanguage.parser,
  jsx: jsxLanguage.parser,
  ts: typescriptLanguage.parser, typescript: typescriptLanguage.parser,
  tsx: tsxLanguage.parser,
  json: javascriptLanguage.parser,          // a JSON document is a valid JS expression for highlighting purposes
  css: cssLanguage.parser,
  html: htmlLanguage.parser, xml: htmlLanguage.parser,
  md: markdownLanguage.parser, markdown: markdownLanguage.parser,
};
/**
 * C# and Osy#, which no Lezer grammar covers. Osy# is C#-shaped by design, so ONE tokenizer serves both — the only
 * difference is the keyword set, and Osy#'s is a superset for these purposes.
 *
 * The Osy# keywords follow the Osy# VS Code extension's TextMate grammar rather than being invented here, so a code
 * block and the code editor agree about what a keyword is. Keep the two lists in step.
 */
const OSY_KEYWORDS = new Set(('action after all any app as async await base break case catch class client completion ' +
  'component continue control default deposit do drain else enter entity enum event events exit false finally for ' +
  'foreach if in interface is meta method nameof new null of on out page params policy raise ref render return ' +
  'route sizeof slot state store struct subscribe switch target terminal theme this throw tracks true try typeof ' +
  'using variants wait while workflow yield').split(' '));
const CSHARP_EXTRA = new Set(('abstract bool byte char checked const decimal delegate double explicit extern fixed ' +
  'float get global goto implicit int internal lock long namespace object operator override partial private ' +
  'protected public readonly record sbyte sealed set short sizeof stackalloc static string uint ulong unchecked ' +
  'unsafe ushort value virtual void volatile where with required init').split(' '));

/** A small hand-written tokenizer for the C#-family. Emits the same class names the Lezer path does. */
function tokenizeCSharpFamily(src: string): { from: number; to: number; cls: string }[] {
  const out: { from: number; to: number; cls: string }[] = [];
  // Order matters: comments and strings first, so a `//` inside neither is mistaken for an operator and a keyword
  // inside a string is never painted as a keyword.
  const re = new RegExp([
    String.raw`(?<com>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    String.raw`(?<str>@"(?:[^"]|"")*"|\$?"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')`,
    String.raw`(?<attr>\[[A-Z][A-Za-z0-9_]*(?:\([^)]*\))?\])`,
    String.raw`(?<num>\b\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?[mMdDfFlLuU]*\b)`,
    String.raw`(?<word>[A-Za-z_][A-Za-z0-9_]*)`,
    String.raw`(?<punc>[{}()\[\].,;:?!<>=+\-*/%&|^~]+)`,
  ].join('|'), 'g');

  for (let m = re.exec(src); m; m = re.exec(src)) {
    const g = m.groups!;
    const from = m.index, to = from + m[0].length;
    if (g.com) { out.push({ from, to, cls: 'osy-tok-com' }); continue; }
    if (g.str) { out.push({ from, to, cls: 'osy-tok-str' }); continue; }
    if (g.attr) { out.push({ from, to, cls: 'osy-tok-type' }); continue; }
    if (g.num) { out.push({ from, to, cls: 'osy-tok-num' }); continue; }
    if (g.punc) { out.push({ from, to, cls: 'osy-tok-punc' }); continue; }
    const w = g.word!;
    if (OSY_KEYWORDS.has(w) || CSHARP_EXTRA.has(w)) { out.push({ from, to, cls: 'osy-tok-kw' }); continue; }
    // A call is a name followed by `(`; a type is PascalCase. Neither is exact without a parser, and both are the
    // conventions these languages actually follow — a wrong guess here costs a colour, not correctness.
    if (/^\s*\(/.test(src.slice(to))) { out.push({ from, to, cls: 'osy-tok-fn' }); continue; }
    if (/^[A-Z]/.test(w)) { out.push({ from, to, cls: 'osy-tok-type' }); continue; }
    out.push({ from, to, cls: 'osy-tok-var' });
  }
  return out;
}

const CSHARP_FAMILY = new Set(['cs', 'csharp', 'c#', 'osy', 'osysharp', 'osy#']);

/** The languages offered in the picker — exactly those we can actually colour, so the list never over-promises. */
const CODE_LANGUAGES = ['', 'osy', 'cs', 'ts', 'tsx', 'js', 'jsx', 'json', 'css', 'html', 'md'];

const codeTags = tagHighlighter([
  { tag: t.keyword, class: 'osy-tok-kw' },
  { tag: [t.controlKeyword, t.moduleKeyword, t.definitionKeyword, t.operatorKeyword], class: 'osy-tok-kw' },
  { tag: [t.string, t.special(t.string), t.regexp], class: 'osy-tok-str' },
  { tag: [t.number, t.bool, t.null, t.atom], class: 'osy-tok-num' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.docComment], class: 'osy-tok-com' },
  { tag: [t.typeName, t.className, t.namespace], class: 'osy-tok-type' },
  { tag: [t.function(t.variableName), t.function(t.propertyName)], class: 'osy-tok-fn' },
  { tag: [t.propertyName, t.attributeName], class: 'osy-tok-prop' },
  { tag: [t.tagName, t.angleBracket], class: 'osy-tok-tag' },
  { tag: [t.operator, t.punctuation, t.separator, t.bracket], class: 'osy-tok-punc' },
  { tag: [t.variableName, t.definition(t.variableName)], class: 'osy-tok-var' },
  { tag: [t.heading, t.strong], class: 'osy-tok-kw' },
  { tag: [t.link, t.url], class: 'osy-tok-str' },
]);

/** Parsed decorations per code-block NODE. Nodes are persistent, so an untouched block is never re-parsed. */
const codeDecoCache = new WeakMap<any, any[]>();

const codeHighlightKey = new PluginKey('osy-md-code-highlight');
const codeHighlightPlugin = $prose(() => new Plugin({
  key: codeHighlightKey,
  props: {
    decorations(state: any) {
      const out: any[] = [];
      state.doc.descendants((node: any, pos: number) => {
        if (node.type.name !== 'code_block') return true;
        // The language label rides on the node itself, so an UNSUPPORTED language still gets its badge — telling
        // you what the fence says is useful even when we cannot colour it.
        const raw = String(node.attrs?.language ?? '').trim();
        out.push(Decoration.node(pos, pos + node.nodeSize, { 'data-language': raw || 'text' }));

        const lang = raw.toLowerCase();
        const parser = CODE_PARSERS[lang];
        const family = CSHARP_FAMILY.has(lang);
        if (!parser && !family) return false;
        let decos = codeDecoCache.get(node);
        if (!decos) {
          decos = [];
          try {
            if (family) decos = tokenizeCSharpFamily(node.textContent);
            else highlightTree(parser.parse(node.textContent), codeTags, (from: number, to: number, cls: string) => {
              decos!.push({ from, to, cls });
            });
          } catch { decos = []; }        // an unparseable fragment is plain text, never a broken editor
          codeDecoCache.set(node, decos);
        }
        for (const d of decos) out.push(Decoration.inline(pos + 1 + d.from, pos + 1 + d.to, { class: d.cls }));
        return false;
      });
      return DecorationSet.create(state.doc, out);
    },
  },
}));

/**
 * The slash menu. Typing `/` at the start of an empty-ish paragraph offers the block types, filtered as you
 * keep typing — the fastest way to change what a block IS without leaving the keyboard.
 *
 * Every entry runs one of the PRESET's own commands rather than a hand-rolled transaction. Wrapping a paragraph in a
 * list is not a one-liner (it has to lift, wrap and re-join around the selection), and re-implementing it here would
 * mean this menu and the editor's own keybindings could disagree about what "bullet list" does.
 */
const slash = slashFactory('osy-md-slash');

/**
 * `taskify` is passed in rather than reached for: turning list items into task items needs the live view, and a
 * module-level handle to it would be shared by every editor on the page.
 */
interface SlashApi { taskify(): void }
interface SlashItem { label: string; hint: string; keys: string[]; run: (ctx: any, api: SlashApi) => void }

const SLASH_ITEMS: SlashItem[] = [
  { label: 'Heading 1', hint: 'Large section title', keys: ['h1', 'heading', 'title'], run: (c) => callCommand(wrapInHeadingCommand.key, 1)(c) },
  { label: 'Heading 2', hint: 'Section title',       keys: ['h2', 'heading'],          run: (c) => callCommand(wrapInHeadingCommand.key, 2)(c) },
  { label: 'Heading 3', hint: 'Sub-section title',   keys: ['h3', 'heading'],          run: (c) => callCommand(wrapInHeadingCommand.key, 3)(c) },
  { label: 'Text',      hint: 'Plain paragraph',     keys: ['text', 'paragraph', 'p'], run: (c) => callCommand(turnIntoTextCommand.key)(c) },
  { label: 'Bullet list',   hint: 'An unordered list', keys: ['bullet', 'list', 'ul'],   run: (c) => callCommand(wrapInBulletListCommand.key)(c) },
  { label: 'Numbered list', hint: 'An ordered list',   keys: ['number', 'ordered', 'ol'], run: (c) => callCommand(wrapInOrderedListCommand.key)(c) },
  // GFM models a task item as an ATTRIBUTE on an ordinary list item and ships no command for it — only the
  // `[ ] ` input rule — so this one is assembled here: wrap in a bullet list, then set the attribute.
  { label: 'Task list',     hint: 'A checklist',       keys: ['task', 'todo', 'check', 'checkbox'], run: (c, api) => { callCommand(wrapInBulletListCommand.key)(c); api.taskify(); } },
  { label: 'Quote',     hint: 'A block quotation',  keys: ['quote', 'blockquote'],    run: (c) => callCommand(wrapInBlockquoteCommand.key)(c) },
  { label: 'Code',      hint: 'A fenced code block', keys: ['code', 'fence', 'pre'],  run: (c) => callCommand(createCodeBlockCommand.key)(c) },
  { label: 'Table',     hint: 'A 3x3 table',        keys: ['table', 'grid'],          run: (c) => callCommand(insertTableCommand.key)(c) },
  { label: 'Divider',   hint: 'A horizontal rule',  keys: ['divider', 'rule', 'hr'],  run: (c) => callCommand(insertHrCommand.key)(c) },
];

/**
 * Match `/query` immediately before the cursor — the trigger plus whatever has been typed to filter it.
 *
 * The leading boundary is load-bearing: without it "and/or", a URL or a date pops the menu open mid-word, which is
 * the single most irritating way a slash menu can behave. The trigger only counts at the start of a block or after
 * whitespace, which is where someone reaching for a NEW block would be.
 */
const SLASH_RE = /(?:^|\s)\/([a-zA-Z0-9]*)$/;

/** The block menu's "Turn into" group — every entry that changes what a block IS, rather than where it sits. */
const TURN_INTO = new Set(['h1', 'h2', 'h3', 'text', 'bullet', 'ordered', 'task', 'quote', 'code']);

/**
 * The protocols a click is allowed to navigate to.
 *
 * This list is the load-bearing part of making links clickable. A document can be written by someone else — an
 * agent, another user, an import — and a `javascript:` or `data:` href would turn one click on a nice blue word into
 * running their code in this session. A click is not consent to that, so anything outside this set is simply not
 * opened. (The renderer already sanitises the href it puts in the DOM; this is the same rule at the other end, on
 * the value we act on, because that is the one an attacker would have to get past.)
 */
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:', 'ftp:']);

/**
 * Where a pasted or dropped image is uploaded, and what the control will not even try to send.
 *
 * The upload creates a file asset rather than a world-readable public file. A file asset carries its own read
 * permissions, and the sign endpoint that makes it displayable authorizes by READING the asset — so an id the reader
 * cannot read is an id they cannot sign. That is permission scoping, not merely "must be logged in".
 *
 * **THE LIMITS BELOW ARE NOT THE ENFORCEMENT.** The server checks the type and the size on the way in and refuses
 * with a 400 whatever this control sends — nothing here can widen them. They are duplicated only so that dropping a
 * 40 MB photo says so immediately instead of uploading 40 MB to be refused. Keep them equal to the server's, and if
 * they ever drift, the SERVER is right.
 */
const UPLOAD_PATH = '/api/files/upload';
/** The stable reference a DOCUMENT holds. A real URL that answers 404 without a signature — the access control
 *  working — and that means the same thing to every other reader of the document (an export, an agent, another
 *  renderer). */
const assetUrl = (id: string) => `/api/files/${id}`;
/** Does this src name a FileAsset we can sign? Deliberately strict: a bare `/api/files/<uuid>` with NO query. A src
 *  that already carries `?sig=` is one we (or something else) put there and must not be re-signed into a loop. */
const ASSET_SRC = /^\/api\/files\/([0-9a-fA-F-]{36})$/;
const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;   // mirrors the server's upload limit, which is the real check

/* ── MATH. Temml, loaded from a control CHUNK the first time a document actually contains any. ───────────────────
 *
 *  228 KB that a document of prose never downloads. The load is triggered by a math NODE being constructed, not by
 *  scanning the text: the parser has already decided what is math by then, so this cannot fire on "$5 and $10".
 *
 *  Temml renders to MathML — the browser lays it out — which is why this needs no webfont hosting. The one font in
 *  MathCss (`\mathscr` capitals, 9 KB) is inlined as a data: URI by scripts/build-chunks.mjs, so the stylesheet
 *  has no URL to resolve; a chunk is served content-addressed with no directory to resolve one against. */
let temmlChunk: Promise<{ render(tex: string, el: HTMLElement, opts?: unknown): void }> | null = null;

function loadTemml(host: Host): Promise<{ render(tex: string, el: HTMLElement, opts?: unknown): void }> {
  if (temmlChunk) return temmlChunk;
  // The stylesheet goes in ONCE, alongside the first module request, so the formula is never painted unstyled.
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = host.chunkUrl('MathCss');
  document.head.appendChild(link);
  temmlChunk = import(/* @vite-ignore */ host.chunkUrl('Math')).then((m: any) => m.default ?? m);
  return temmlChunk;
}

/** A rendered formula. The node's `value` is the LaTeX verbatim; this only decides how it is DRAWN. */
class MathView {
  readonly dom: HTMLElement;
  private value: string;
  private disposed = false;

  constructor(node: { attrs: Record<string, unknown> },
              private readonly inline: boolean,
              private readonly host: Host) {
    this.value = String(node.attrs.value ?? '');
    this.dom = document.createElement(inline ? 'span' : 'div');
    this.dom.setAttribute(inline ? 'data-math-inline' : 'data-math-block', '');
    this.dom.setAttribute('data-value', this.value);
    // The SOURCE is the fallback, and it is deliberate: before the chunk resolves — and forever, if it fails — the
    // reader sees `\frac{1}{2}` rather than an empty box. A formula that renders as nothing is indistinguishable
    // from a document that lost it.
    this.dom.textContent = this.value;
    void this.draw();
  }

  private async draw(): Promise<void> {
    const tex = this.value;
    try {
      const temml = await loadTemml(this.host);
      if (this.disposed || this.value !== tex) return;   // destroyed, or edited while the chunk was in flight
      this.dom.textContent = '';
      temml.render(tex, this.dom, { displayMode: !this.inline, throwOnError: false });
    } catch {
      // Leave the source text showing. `data-math-error` is for the probe and for anyone debugging a chunk that
      // did not arrive; the READER still sees the formula's source, which is the honest degradation.
      this.dom.setAttribute('data-math-error', '');
      this.dom.textContent = tex;
    }
  }

  update(node: { type: { name: string }; attrs: Record<string, unknown> }): boolean {
    if (node.type.name !== (this.inline ? 'math_inline' : 'math_block')) return false;
    const next = String(node.attrs.value ?? '');
    if (next === this.value) return true;
    this.value = next;
    this.dom.setAttribute('data-value', next);
    this.dom.textContent = next;
    void this.draw();
    return true;
  }

  // Temml writes a MathML subtree INTO our element. Without this, ProseMirror sees those mutations as an edit to
  // the document, re-parses the node from its rendered DOM and loses the LaTeX. The node's content lives in `value`,
  // never in the DOM.
  ignoreMutation(): boolean { return true; }
  // An atom: clicks select it, they do not enter it.
  stopEvent(): boolean { return false; }
  destroy(): void { this.disposed = true; }
}

/** Render a private image by SIGNING it at display time.
 *
 *  The one genuinely delicate rule: **the signed URL must never enter the document.** A signature is a short-lived
 *  bearer capability, so writing one into the text would rot it AND bake a capability into content that gets
 *  copied, exported and read by agents. So this is a NODE VIEW: it puts the signed src on the `<img>` element and
 *  dispatches no transaction, ever. The node keeps `/api/files/<id>`.
 *
 *  It also re-signs while the document stays open — an editor left up for an hour outlives its signature, and an
 *  image that silently turns into a broken icon is worse than one that never loaded. */
class SignedImageView {
  readonly dom: HTMLImageElement;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(node: { attrs: Record<string, unknown> },
              private readonly sign: (assetId: string) => Promise<{ url: string; expiresAt: string } | null>) {
    const img = document.createElement('img');
    const src = String(node.attrs.src ?? '');
    img.alt = String(node.attrs.alt ?? '');
    if (node.attrs.title) img.title = String(node.attrs.title);
    this.dom = img;

    const asset = ASSET_SRC.exec(src);
    // Not one of ours (an absolute https:// image, a legacy `public/` one) — render it exactly as written. This
    // control does not decide what any other URL means.
    if (!asset) { img.src = src; return; }
    void this.refresh(asset[1]);
  }

  private async refresh(assetId: string): Promise<void> {
    if (this.disposed) return;
    const signed = await this.sign(assetId);
    if (this.disposed) return;
    if (!signed) {
      // Not authorized, or the sign call failed. Say so ON the image rather than leaving a broken-icon mystery:
      // "you cannot see this" and "this is broken" are different facts and the reader deserves the right one.
      this.dom.removeAttribute('src');
      this.dom.dataset.osyDenied = 'true';
      this.dom.alt = this.dom.alt ? `${this.dom.alt} (not available to you)` : 'image not available to you';
      return;
    }
    this.dom.src = signed.url;
    // Re-sign a minute before expiry, with a floor so a pathologically short TTL cannot spin.
    const ms = Math.max(30_000, new Date(signed.expiresAt).getTime() - Date.now() - 60_000);
    this.timer = setTimeout(() => void this.refresh(assetId), ms);
  }

  /** The node's own attrs never change here (we write no transactions), so any update is someone else's edit to the
   *  same node — let ProseMirror rebuild rather than reconcile a src we are mid-flight on. */
  update(): boolean { return false; }

  destroy(): void {
    this.disposed = true;
    if (this.timer) clearTimeout(this.timer);
  }
}

function isSafeLinkHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed) return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(trimmed)?.[1];
  if (!scheme) return true;   // relative — it resolves against this app's own origin, with no scheme to abuse
  return SAFE_LINK_PROTOCOLS.has(`${scheme.toLowerCase()}:`);
}

/**
 * The selection toolbar. Select text and the inline formatting appears where you are looking, rather than at the
 * top of a chrome bar you have to travel to.
 *
 * INLINE MARKS ONLY, deliberately. Block transforms already have two homes — the slash menu for a block you are
 * typing, the block menu for one that exists — and a third copy of them here would grow the control's own chrome
 * until it competes with the app's.
 *
 * Every entry runs the PRESET's command, which is also what the Mod-b / Mod-i / Mod-e keymaps run, so the button and
 * the shortcut cannot drift apart.
 */
const selTooltip = tooltipFactory('osy-md-seltool');

interface SelMark {
  /** The mark's name in the schema — how the button's ACTIVE state is read back out of the document. */
  mark: string;
  label: string;
  title: string;
  run: (ctx: any) => void;
}

const SEL_MARKS: SelMark[] = [
  { mark: 'strong',        label: 'B',   title: 'Bold',          run: (c) => callCommand(toggleStrongCommand.key)(c) },
  { mark: 'emphasis',      label: 'I',   title: 'Italic',        run: (c) => callCommand(toggleEmphasisCommand.key)(c) },
  { mark: 'strike_through', label: 'S',  title: 'Strikethrough', run: (c) => callCommand(toggleStrikethroughCommand.key)(c) },
  { mark: 'inlineCode',    label: '</>', title: 'Code',          run: (c) => callCommand(toggleInlineCodeCommand.key)(c) },
];

/**
 * FIND & REPLACE — the matches, and which one you are on.
 *
 * Held in plugin state so the highlights recompute through the normal state pipeline and survive every edit: replace
 * one occurrence and the rest re-derive themselves, rather than being a DOM overlay that goes stale the moment the
 * document moves under it.
 */
interface FindState { query: string; hits: { from: number; to: number }[]; current: number }
const findKey = new PluginKey<FindState>('osy-md-find');
const EMPTY_FIND: FindState = { query: '', hits: [], current: 0 };

const findPlugin = $prose(() => new Plugin<FindState>({
  key: findKey,
  state: {
    init: () => EMPTY_FIND,
    apply(tr, value) {
      const meta = tr.getMeta(findKey);
      const next = meta !== undefined ? meta as FindState : value;
      // An edit moves everything: re-run the search rather than map stale ranges, because a replace CHANGES what
      // there is to find. Cheap — it is one walk of the document, and only while the bar is open.
      //
      // The docChanged check must come AFTER the meta, not instead of it: a REPLACE both edits the document and
      // carries meta, and taking the meta as final would leave the old hit list in state — five matches replaced, five
      // still shown, and "none left" never arriving.
      if (tr.docChanged && next.query) {
        const hits = findHits(tr.doc, next.query);
        return { query: next.query, hits, current: Math.min(next.current, Math.max(0, hits.length - 1)) };
      }
      return next;
    },
  },
  props: {
    decorations(state) {
      const f = findKey.getState(state);
      if (!f?.hits.length) return null;
      return DecorationSet.create(state.doc, f.hits.map((h, i) =>
        Decoration.inline(h.from, h.to, { class: i === f.current ? 'osy-md__find-hit osy-md__find-hit--current' : 'osy-md__find-hit' })));
    },
  },
}));

/**
 * Every occurrence of `query`, case-insensitively, with real document positions.
 *
 * Searched per TEXTBLOCK rather than per text node, so a phrase that crosses a mark boundary — "the **whole** thing"
 * is three text nodes — is still one match. `textBetween` with a placeholder for leaf nodes is what keeps the offset
 * mapping 1:1: an image contributes one character to the string exactly as it contributes one position to the
 * document, so an offset after it still lands where it should.
 */
function findHits(doc: any, query: string): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  const q = query.toLowerCase();
  if (!q) return out;
  doc.descendants((node: any, pos: number) => {
    if (!node.isTextblock) return true;
    const text = node.textBetween(0, node.content.size, undefined, '￼').toLowerCase();
    let i = text.indexOf(q);
    while (i !== -1) {
      out.push({ from: pos + 1 + i, to: pos + 1 + i + q.length });
      i = text.indexOf(q, i + q.length);
    }
    return false;   // a textblock's children are inline — nothing further down to search
  });
  return out;
}

/**
 * KEEP THE SELECTION VISIBLE while the URL field has focus.
 *
 * A browser paints a text selection only in the focused element, so the moment the caret moves into the URL field the
 * text being linked goes plain — you are typing an address for something you can no longer see. The selection is
 * still there in the editor's state; what is missing is a way to draw it, and a decoration is exactly that.
 *
 * The range is mapped through document changes rather than pinned, so it survives anything that lands while the field
 * is open (an autosave adopting section ids, another writer's reload).
 */
const selKeepKey = new PluginKey<{ from: number; to: number } | null>('osy-md-seltool-keep');

const selKeepPlugin = $prose(() => new Plugin<{ from: number; to: number } | null>({
  key: selKeepKey,
  state: {
    init: () => null,
    apply(tr, value) {
      const meta = tr.getMeta(selKeepKey);
      if (meta !== undefined) return meta as { from: number; to: number } | null;
      if (value && tr.docChanged) return { from: tr.mapping.map(value.from), to: tr.mapping.map(value.to) };
      return value;
    },
  },
  props: {
    decorations(state) {
      const r = selKeepKey.getState(state);
      if (!r || r.from >= r.to) return null;
      return DecorationSet.create(state.doc, [Decoration.inline(r.from, r.to, { class: 'osy-md__seltool-keep' })]);
    },
  },
}));

/** The landing mark on the half of a footnote you just jumped to.
 *
 *  A DECORATION rather than a class on the element, for the reason every other highlight here is one: the click that
 *  triggers the jump also moves the selection, ProseMirror redraws the nodes it owns, and a class set by hand goes
 *  with the old DOM, so the flash would be gone almost as soon as it landed.
 *
 *  One position, not a range — the whole node is marked, which is what makes a two-line note read as one landing
 *  rather than as a highlighted first line. Mapped through edits like the kept selection beside it. */
const fnFlashKey = new PluginKey<{ pos: number | null }>('osy-md-fn-flash');
/** Bumped per jump, so a stale clear-timer cannot wipe a newer jump's mark. */
let fnFlashSeq = 0;

const fnFlashPlugin = $prose(() => new Plugin<{ pos: number | null }>({
  key: fnFlashKey,
  state: {
    init: () => ({ pos: null }),
    apply(tr, value) {
      const meta = tr.getMeta(fnFlashKey);
      if (meta !== undefined) return meta as { pos: number | null };
      if (value.pos !== null && tr.docChanged) return { pos: tr.mapping.map(value.pos) };
      return value;
    },
  },
  props: {
    decorations(state) {
      const f = fnFlashKey.getState(state);
      if (!f || f.pos === null) return null;
      const node = state.doc.nodeAt(f.pos);
      if (!node) return null;
      return DecorationSet.create(state.doc, [
        Decoration.node(f.pos, f.pos + node.nodeSize, { class: 'osy-md__fn-flash' }),
      ]);
    },
  },
}));

/**
 * Whether a mark is on, using the SAME rule the toggle command uses — ProseMirror's `toggleMark` removes when ANY of
 * the range carries the mark, so "active" has to mean that too. Reporting "all of it is bold" instead would light the
 * button up in cases where pressing it makes text bold rather than plain.
 */
function markActive(state: any, type: any): boolean {
  if (!type) return false;
  const { from, to, empty, $from } = state.selection;
  if (empty) return !!type.isInSet(state.storedMarks || $from.marks());
  return state.doc.rangeHasMark(from, to, type);
}

/** The href of the first link mark touching the selection — what the URL field opens prefilled with. */
function linkHrefIn(state: any, type: any): string | null {
  if (!type) return null;
  const { from, to } = state.selection;
  let href: string | null = null;
  state.doc.nodesBetween(from, from === to ? to + 1 : to, (node: any) => {
    if (href !== null) return false;
    const mark = node.marks?.find((m: any) => m.type === type);
    if (mark) { href = mark.attrs.href ?? ''; return false; }
    return true;
  });
  return href;
}

// The return type is annotated so that a missing or mistyped handle member is reported here, on the member. Without
// the annotation `tsc` infers this function's return type and never compares it with the
// `mount(...): MarkdownEditorHandle` that `markdown.control.d.ts` declares. The generated `markdown.control.check.ts`
// beside this file enforces the same agreement independently.
export function mount(el: HTMLElement, props: Props, host: Host): MarkdownEditorHandle {
  ensureStyles(el.ownerDocument);

  let current: Props = { ...props };
  let destroyed = false;
  let mode: 'rich' | 'raw' = 'rich';
  let faceIndex = Math.max(0, FACES.indexOf(current.face ?? 'editorial'));
  let outlineTimer: ReturnType<typeof setTimeout> | null = null;

  let view: any = null;
  let schema: any = null;
  let serialize: ((n: any) => string) | null = null;
  let parse: ((md: string) => any) | null = null;
  let cm: CMView | null = null;

  const tracker = new SectionIdTracker();
  /**
   * The re-link baselines track the EDITOR's belief, not the server's. Using what was last persisted strands any
   * section with unsaved edits: after a raw-mode round trip it matches neither a live position nor the stored text,
   * and would come back as a delete plus a create under a fresh id.
   */
  let lastKnown: PriorContent = new Map();
  let lastBlocks: { id: string | null; heading: string; body: string }[] = [];
  /**
   * The ContentHash each section was last seen at. Sent back as a precondition so a save cannot overwrite a section
   * that changed underneath us — the difference between "my edit landed" and "my edit silently ate someone else's".
   */
  let baseHash = new Map<string, string>();
  /** What the SERVER holds for each section — the baseline a partial save diffs against. Distinct from `lastKnown`,
   *  which tracks the editor's own belief and moves on every keystroke. */
  let serverState = new Map<string, { level: number; heading: string; body: string }>();
  /** The section ids in document order as the server last reported them — how a structural change is detected. */
  let lastSavedOrder: string[] = [];

  /**
   * Nothing counts as an edit until the document has finished loading.
   *
   * Parsing markdown into the editor normalises it — list tightness, table delimiter widths — so the very first
   * transactions differ from what the server sent through no fault of the user. Without this gate, merely OPENING a
   * document marks it dirty and autosaves, rewriting section hashes for a change nobody made.
   */
  let ready = false;
  let dirty = false;
  let saving = false;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * A save was asked for while another was in flight, and therefore NOT sent.
   *
   * Without this it was simply dropped: the autosave timer had already expired, so nothing was left to re-run it and
   * the edit stayed unsaved until the user happened to type again or press Save. Observed as a document that reported
   * "saved · 1 updated" while the server did not hold the last edit at all — the worst shape a save bug can take,
   * because the status line says the opposite of the truth.
   */
  let savePending = false;
  /** Bumped by every edit, so a completing save can tell whether the document moved underneath it. */
  let editSeq = 0;

  // ── chrome ────────────────────────────────────────────────────────────
  const root = el.ownerDocument.createElement('div');
  root.className = 'osy-md';
  root.setAttribute('data-face', FACES[faceIndex]);
  applyDensity();
  applyOutlineVisibility();

  const bar = el.ownerDocument.createElement('div');
  bar.className = 'osy-md__bar';
  const modeBtn = button('Source');
  const faceBtn = button('Aa');
  const status = el.ownerDocument.createElement('span');
  status.className = 'osy-md__status';
  const spacer = el.ownerDocument.createElement('span');
  spacer.className = 'osy-md__spacer';
  const densityBtn = button('Density');
  const saveBtn = button('Save');
  // The app's own toolbar content, rendered INSIDE this control's toolbar. The editor decides WHERE it sits
  // (here, before the spacer, so the app's buttons read as part of one bar); the app decides what it is, and its
  // content can call this control's declared commands.
  const appSlot = el.ownerDocument.createElement('div');
  appSlot.className = 'osy-md__appslot';
  bar.append(modeBtn, faceBtn, densityBtn, appSlot, spacer, status, saveBtn);

  // UNDER `recordScoped` THIS CONTROL HAS NO SAVE TO OFFER, so it does not draw one.
  //
  // In that mode the document's writes land in the HOST PAGE's unit of work and are durable only when the page
  // commits — which is why the save status says "staged for save" rather than "saved". A button that flushes a stage
  // is not a save, and putting one in the toolbar makes it look like the peer of the page's own Save when it is only
  // a sub-step of it. Two buttons reading "Save" — one that commits and one that does not — leave a person guessing,
  // and one of the two guesses silently discards the edit on navigation.
  //
  // The autosave itself is unaffected: it still runs on its debounce and still reports through `say(...)`.
  if (current.recordScoped) saveBtn.remove();
  // A READ-ONLY document has nothing to save either: Save beside text nobody may change offers an action that does
  // nothing. Hidden rather than removed, because `readOnly` is a prop and may flip (a draft opened for editing).
  const applySaveVisibility = () => { saveBtn.hidden = !!current.readOnly; };
  applySaveVisibility();

  // The outline rail sits BESIDE the scrolling pane, not inside it, so it stays put while the document scrolls.
  const outlineEl = el.ownerDocument.createElement('nav');
  outlineEl.className = 'osy-md__outline';
  outlineEl.setAttribute('aria-label', 'Document outline');

  const body = el.ownerDocument.createElement('div');
  body.className = 'osy-md__body';

  const pane = el.ownerDocument.createElement('div');
  pane.className = 'osy-md__pane';
  const richHost = el.ownerDocument.createElement('div');
  /** Where the pointer went down, so a click can tell "follow this link" from "finish selecting this text". */
  let pointerDownAt: { x: number; y: number } | null = null;
  richHost.addEventListener('mousedown', (ev) => { pointerDownAt = { x: ev.clientX, y: ev.clientY }; }, true);
  const rawHost = el.ownerDocument.createElement('div');
  rawHost.className = 'osy-md__raw';
  rawHost.style.display = 'none';
  pane.append(richHost, rawHost);

  // Sits between the toolbar and the document, and only when there is something to say.
  const conflictBar = el.ownerDocument.createElement('div');
  conflictBar.className = 'osy-md__conflict';
  conflictBar.hidden = true;

  body.append(outlineEl, pane);
  root.append(bar, conflictBar, body);
  el.appendChild(root);

  // Ask the platform for the app's `slot Toolbar { c => … }` content, if it wrote any. Nothing renders when it did
  // not: an unfilled slot is simply absent, never an empty box.
  const appSlotInstance = host.slots?.Toolbar?.render(appSlot) ?? null;

  function button(label: string) {
    const b = el.ownerDocument.createElement('button');
    b.type = 'button';
    b.className = 'osy-md__btn';
    b.textContent = label;
    return b;
  }

  function say(text: string) {
    status.textContent = text;
  }

  function fail(message: string) {
    const box = el.ownerDocument.createElement('div');
    box.className = 'osy-md__error';
    box.textContent = message;
    pane.replaceChildren(box);
  }

  // ── the document's address on the server ──────────────────────────────
  const docPath = () =>
    `/_osy/markdown/${encodeURIComponent(current.ownerType ?? '')}/${current.ownerId}/${encodeURIComponent(current.property ?? '')}`
    + (current.recordScoped ? '?recordScoped=true' : '');

  // ── boot ──────────────────────────────────────────────────────────────
  // The boot is the handle's `ready`: it REJECTS when the editor did not come up, so the platform marks the control
  // failed and a probe says "never started" rather than answering from chrome over nothing. Every early exit below
  // therefore THROWS — a `fail(); return;` would resolve it, which is the lie this exists to remove.
  const boot = (async () => {
    if (!host.data)
      throw new Error('This markdown control needs the app-data channel (host.data) and this client did not provide one.');
    if (!current.ownerId || !current.ownerType || !current.property)
      throw new Error('The markdown control needs ownerType, ownerId and property to know which document to edit.');

    let read: ReadResponse;
    try {
      const res = await host.data.request(docPath());
      if (!res.ok) throw new Error(`Could not load the document (HTTP ${res.status}).`);
      read = (await res.json()) as ReadResponse;
    } catch (err) {
      throw new Error(`Could not load the document: ${(err as Error).message}`);
    }
    if (destroyed) return;

    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, richHost);
        ctx.set(defaultValueCtx, read.markdown);
        // Keeps the serializer's output closer to what a human wrote. Bullet char and rule style are recoverable
        // here; list tightness is not (it rides the mdast `spread` flag), which is a known normalisation.
        ctx.update(remarkStringifyOptionsCtx, (prev: any) => ({ ...prev, bullet: '-', rule: '-', ruleRepetition: 3, emphasis: '_' }));

        // ── tight lists must stay tight ────────────────────────────────────────────────────────────────────────
        // With the stock commonmark preset, `- a` / `- b` comes back with a blank line between every item on every
        // save, which is not cosmetic: a loose list wraps its items in <p>, so the spacing visibly changes under the
        // author.
        //
        // It looks like a serializer limitation and is actually a TYPE bug, in all three list schemas. Each has a
        // `spread` attr and mdast does carry tightness, but the parse runners store it as a STRING —
        // `spread = node.spread != null ? \`${node.spread}\` : "true"` — and the serializers hand that string
        // straight back to mdast. The string "false" is TRUTHY, so every tight list is reported as loose.
        //
        // So the overrides below parse a real BOOLEAN and default to TIGHT (the stock `list_item` default is `true`,
        // so even a list typed from scratch would serialize loose). The LIST's spread is what decides looseness, so
        // overriding only `list_item` would change nothing visible.
        const asBool = (v: any) => v === true || v === 'true';
        const boolSpread = (schema: any, isItem: boolean, ordered = false) =>
          ctx.update(schema.key, (prev: any) => (c: any) => {
            const base = prev(c);
            return {
              ...base,
              attrs: { ...base.attrs, spread: { default: false, validate: 'boolean' } },
              parseMarkdown: {
                ...base.parseMarkdown,
                runner: (state: any, node: any, type: any) => {
                  const attrs: any = { spread: node.spread === true };
                  if (isItem) {
                    attrs.label = node.label != null ? `${node.label}.` : '\u2022';
                    attrs.listType = node.label != null ? 'ordered' : 'bullet';
                  }
                  state.openNode(type, attrs);
                  state.next(node.children);
                  state.closeNode();
                },
              },
              toMarkdown: {
                ...base.toMarkdown,
                runner: (state: any, node: any) => {
                  // An item is SPREAD only if it really holds separated prose — two or more paragraphs. mdast marks
                  // an item containing a nested sublist as spread even when the source has no blank line, and taking
                  // that at face value would put a blank line after every parent item. A paragraph followed by a sublist
                  // is the ordinary shape of a nested tight list, and it is what people write.
                  let spread = asBool(node.attrs.spread);
                  if (isItem && spread) {
                    let paras = 0;
                    node.content.forEach((child: any) => { if (child.type.name === 'paragraph') paras++; });
                    spread = paras > 1;
                  }
                  const attrs: any = { spread };
                  if (!isItem) attrs.ordered = ordered;
                  state.openNode(isItem ? 'listItem' : 'list', undefined, attrs);
                  state.next(node.content);
                  state.closeNode();
                },
              },
            };
          });
        boolSpread(listItemSchema, true);
        boolSpread(bulletListSchema, false, false);
        boolSpread(orderedListSchema, false, true);

        // The tooltip plugin reads its spec when the ProseMirror plugin is CONSTRUCTED, which is inside `create()` —
        // so it has to be set here, before the provider itself exists. The indirection through `selProvider` is what
        // lets the provider be built afterwards, when there is a ctx to run commands with.
        ctx.set(selTooltip.key, {
          view: () => ({
            update: (v: any, prev: any) => selProvider?.update(v, prev),
          }),
        });

        ctx.update(editorViewOptionsCtx, (prev: any) => ({
          ...prev,
          editable: () => !current.readOnly,
          /**
           * Clicking a link SHOWS ITS POPOVER rather than navigating — the Google Docs shape, and the one that makes
           * both jobs possible at once. Plain-click-to-navigate (Notion's shape) follows a link fine but costs two
           * things: a double click opens a tab that cannot be un-opened, and there is no way to put the caret in a
           * linked word with the mouse without a stray tab. So following is deliberate — the popover's Open, or
           * Cmd/Ctrl-click for the people who already have that in their fingers.
           *
           * Two guards, both learned from how people actually click:
           *  · a DOUBLE or TRIPLE click is a selection gesture, not a follow;
           *  · a drag that ends on the link fires a click too — so the pointer must not have MOVED.
           *
           * Movement, not "is the selection empty": ProseMirror defers the selection update when a click starts
           * INSIDE an existing selection (it might become a drag of that content), so at click time the old
           * selection is still in state. An emptiness test would therefore refuse exactly the click on the link
           * you just made.
           *
           * Returns false either way: ProseMirror still places the caret, so the link stays editable.
           */
          handleClick: (_v: any, pos: number, ev: MouseEvent) => {
            const target = ev.target as HTMLElement | null;
            const moved = pointerDownAt
              ? Math.hypot(ev.clientX - pointerDownAt.x, ev.clientY - pointerDownAt.y)
              : 0;
            const isRealClick = ev.detail <= 1 && moved <= 4;

            // A footnote's mark and its note reach each other. That round trip IS the feature: a marker you
            // cannot follow is decoration, and a note you cannot get back from loses your place in the prose. Both
            // directions use the same two guards as a link (a double click is a selection gesture; a drag that ends
            // here fired a click too), and both return false, so the caret still lands and the node stays editable.
            const ref = target?.closest?.('sup[data-type="footnote_reference"]') as HTMLElement | null;
            if (ref && richHost.contains(ref) && isRealClick) { jumpToFootnote('definition', ref.dataset.label ?? ''); return false; }
            // Only the MARKER goes back, not the note's body — the body is text you edit, and a click in it must put
            // the caret where you clicked. The marker has no text of its own to edit.
            const marker = target?.closest?.('dl[data-type="footnote_definition"] > dt') as HTMLElement | null;
            if (marker && richHost.contains(marker) && isRealClick) {
              jumpToFootnote('reference', (marker.parentElement as HTMLElement).dataset.label ?? '');
              return false;
            }

            const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
            if (!anchor || !richHost.contains(anchor)) return false;
            if (!isRealClick) return false;
            const href = anchor.getAttribute('href') ?? '';
            // An in-document link belongs in this document, not in a second copy of the app.
            if (href.startsWith('#')) { scrollToAnchor(href.slice(1)); return false; }
            if (ev.metaKey || ev.ctrlKey) { openHref(href); return false; }
            showLinkPopover(pos, anchor);
            return false;
          },
          /**
           * PASTE A URL OVER SELECTED TEXT AND IT BECOMES A LINK, instead of replacing the words with the URL.
           * Copy a link, select the phrase it belongs on, paste — which is how people link things everywhere else.
           *
           * Only for a plain-text clipboard that is ENTIRELY a safe URL, and only over a non-empty text selection:
           * pasting into an empty caret, or pasting prose that merely contains a URL, still means paste.
           */
          handlePaste: (v: any, ev: ClipboardEvent) => {
            if (current.readOnly || !cmdCtx) return false;
            // An image on the clipboard is an image, not text — screenshot, copied photo, dragged-in file.
            const images = imageFilesIn(ev.clipboardData);
            if (images.length) { void uploadAndInsert(images); return true; }
            const { selection } = v.state;
            if (selection.empty || !(selection instanceof TextSelection)) return false;
            if (!v.state.doc.textBetween(selection.from, selection.to).length) return false;
            const text = ev.clipboardData?.getData('text/plain')?.trim() ?? '';
            if (!text || /\s/.test(text) || !/^[a-z][a-z0-9+.-]*:\/\/|^mailto:/i.test(text)) return false;
            if (!isSafeLinkHref(text)) return false;
            callCommand(toggleLinkCommand.key, { href: text })(cmdCtx);
            return true;   // handled — the words stay, the link goes on them
          },
          /** Dropping image files is the same story as pasting them; anything else is ProseMirror's own drop. */
          handleDrop: (v: any, ev: DragEvent) => {
            if (current.readOnly || !cmdCtx) return false;
            const images = imageFilesIn(ev.dataTransfer);
            if (!images.length) return false;
            ev.preventDefault();
            // Drop where the POINTER is, not where the caret was — that is the whole grammar of a drop.
            const at = v.posAtCoords({ left: ev.clientX, top: ev.clientY });
            if (at) { try { v.dispatch(v.state.tr.setSelection(TextSelection.near(v.state.doc.resolve(at.pos)))); } catch { /* keep the caret */ } }
            void uploadAndInsert(images);
            return true;
          },
          handleKeyDown: (_v: any, ev: KeyboardEvent) => {
            // Escape closes the popover before anything else looks at the key — it is the frontmost thing on screen.
            if (ev.key === 'Escape' && !linkPop.hidden) { hideLinkPopover(); return true; }
            // Only while the menu is up — otherwise these are ordinary editing keys and must stay so.
            if (!slashActive || !slashMatches.length) return false;
            if (ev.key === 'ArrowDown') { slashIndex = (slashIndex + 1) % slashMatches.length; renderSlash(); return true; }
            if (ev.key === 'ArrowUp')   { slashIndex = (slashIndex - 1 + slashMatches.length) % slashMatches.length; renderSlash(); return true; }
            if (ev.key === 'Enter' || ev.key === 'Tab') { pickSlash(slashIndex); return true; }
            if (ev.key === 'Escape') { slashDismissedAt = slashQuery; slashActive = false; slashProvider?.hide(); return true; }
            return false;
          },
          dispatchTransaction(this: any, tr: any) {
            // Identity is remapped BEFORE the state advances, so the tracker sees every transaction exactly once.
            tracker.apply(tr);
            this.updateState(this.state.apply(tr));
            // Any edit invalidates the popover: it holds absolute positions and points at a rectangle that has just
            // moved. Hiding is the honest response — except while its own field is open, which IS the edit.
            if (tr.docChanged) {
              markDirty(); replaceBlockHandle(pendingFollowPos ?? undefined); scheduleOutline(); applyPlaceholder();
              if (!linkPop.hidden && linkPop.dataset.mode !== 'edit') hideLinkPopover();
            }
            slashProvider?.update(this as any);
            rememberCaretCell(this.state);
          },
        }));
      })
      .use(commonmark).use(gfm).use(history).use(block).use(cursor).use(blockRangePlugin).use(slash).use(selTooltip)
      .use(selKeepPlugin).use(findPlugin).use(fnFlashPlugin).use(codeHighlightPlugin)
      // Math. The `math` export is remark-math (parse) plus the two atom nodes whose serializer writes the LaTeX
      // back VERBATIM. Registered before the node views below, which only decide how those nodes are drawn.
      .use(math)
      // The node views are built HERE rather than at module scope, because signing an image needs this mount's own
      // credentialed channel.
      .use($prose(() => new Plugin({
        props: {
          nodeViews: {
            image: (n: any) => new SignedImageView(n, signAsset),
            math_inline: (n: any) => new MathView(n, true, host),
            math_block: (n: any) => new MathView(n, false, host),
            // A ```mermaid fence draws its diagram BENEATH its source, which stays an ordinary editable code
            // block. Returning undefined for every other language leaves those exactly as they were: ProseMirror
            // falls back to the schema's own toDOM, so the highlighting decorations and the language badge are
            // untouched for the ~dozen languages that are not diagrams.
            // Declining is `undefined`, which ProseMirror's RUNTIME supports (`let dom = spec && spec.dom` in
            // ViewDesc.create falls through to the schema's own toDOM) but its TYPE does not admit — hence the cast,
            // which is narrower than loosening the whole map.
            code_block: ((n: any) =>
              isMermaid(n.attrs?.language) ? new DiagramView(n, host) : undefined) as any,
          },
        },
      })))
      .create();

    if (destroyed) { editor.destroy(); return; }

    editor.action((ctx) => {
      view = ctx.get(editorViewCtx);
      schema = ctx.get(schemaCtx);
      const ser = ctx.get(serializerCtx);
      const par = ctx.get(parserCtx);
      serialize = (n: any) => ser(n);
      parse = (md: string) => par(md);
    });

    editor.action((ctx) => { cmdCtx = ctx; mountBlockHandle(ctx); mountSlash(ctx); mountSelToolbar(); });

    seedIdentity(read.sections);
    for (const b of currentBlocks()) if (b.id) serverState.set(b.id, { level: b.level, heading: b.heading, body: b.body });
    ready = true;
    buildOutline();
    // The document arrives ASYNCHRONOUSLY, so the first answer was given against an empty view either way. Ask
    // again now that the sections are in: a document with content must not flash a prompt, and one with none has
    // only just become genuinely empty rather than merely unloaded.
    applyPlaceholder();
    say(read.sections.length === 1 ? '1 section' : `${read.sections.length} sections`);
  })().catch((err) => { fail(`The markdown editor failed to start: ${(err as Error).message}`); throw err; });
  boot.catch(() => { /* reported on screen above and through `ready` below; not an unhandled rejection */ });

  /**
   * The SERVER's slug for each section heading, so `#some-heading` resolves to the heading it actually names.
   *
   * Taken from the read rather than derived here: slugging is the server's rule (it is also how agent tools address
   * sections), and a second implementation of it in the client would disagree in exactly the cases that are hard to
   * notice — punctuation, accents, duplicates.
   */
  let sectionSlugs = new Map<string, string>();

  /**
   * Scroll to the heading a `#slug` names.
   *
   * TWO ways to match, and both are needed. The server's slug is the exact addressing key (it is what the agent
   * tools use), but it carries a disambiguating suffix — a second "Tables" heading is `tables-2` — so a person
   * writing `[see](#tables)` by hand would never hit it. So: try the server's slug first, then fall back to any
   * heading whose own text slugifies to the anchor, which is what the person meant.
   *
   * Silent when nothing matches: an anchor into a heading that has since been renamed is a stale link, and inventing
   * a destination for it would be worse than doing nothing.
   */
  function scrollToAnchor(anchor: string) {
    if (!view) return;
    const want = anchor.toLowerCase();
    const byServerSlug = sectionSlugs.get(want);
    let found: number | null = null;
    view.state.doc.descendants((n: any, p: number) => {
      if (found !== null) return false;
      if (n.type.name !== 'heading') return true;
      const text = n.textContent.trim();
      if ((byServerSlug && text === byServerSlug.trim()) || slugifyHeading(text) === want) { found = p; return false; }
      return true;
    });
    if (found === null) return;
    const dom = view.nodeDOM(found);
    if (dom instanceof HTMLElement) dom.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  /** Scroll to the other half of a footnote and say which one you landed on.
   *
   *  Both halves are found by their LABEL, which is the identity markdown itself uses (`[^why]` pairs with
   *  `[^why]:`), so this works for a named label exactly as it does for a number — no renumbering, no positional
   *  guessing. Queried from the DOM rather than walked in the document because that is where the scroll happens, and
   *  a definition may be far outside the rendered viewport.
   *
   *  The flash matters more than it looks: after a scroll you have to find the thing you asked for, and a note that
   *  arrives silently in the middle of a screen of small grey text has not really been reached. */
  function jumpToFootnote(want: 'definition' | 'reference', label: string) {
    if (!view || !label) return;
    const type = want === 'definition' ? 'footnote_definition' : 'footnote_reference';
    let found: number | null = null;
    view.state.doc.descendants((n: any, pos: number) => {
      if (found !== null) return false;
      if (n.type.name === type && String(n.attrs?.label ?? '') === label) { found = pos; return false; }
      return true;
    });
    // A reference whose definition does not exist is legal markdown (it stays literal text and never becomes a node),
    // so the other half genuinely may be absent. Doing nothing is the honest answer — there is nowhere to go.
    if (found === null) return;

    const dom = view.nodeDOM(found);
    if (dom instanceof HTMLElement) dom.scrollIntoView({ block: 'center', behavior: 'smooth' });

    // The landing mark is a DECORATION, not a class on the element.
    //
    // A class set through `classList` does not survive: the click that triggers the jump also moves the selection,
    // ProseMirror redraws the nodes it owns, and the class goes with the old DOM. A decoration is re-applied on every
    // redraw because the editor owns it, which is the same reason every other highlight here (find hits, the kept
    // selection) is one.
    const clear = ++fnFlashSeq;
    view.dispatch(view.state.tr.setMeta(fnFlashKey, { pos: found }));
    window.setTimeout(() => {
      if (!view || clear !== fnFlashSeq) return;       // a newer jump owns the mark now
      view.dispatch(view.state.tr.setMeta(fnFlashKey, { pos: null }));
    }, 1400);
  }

  /** The ordinary heading→anchor rule people expect: lowercase, punctuation dropped, spaces to dashes. */
  function slugifyHeading(text: string): string {
    return text.toLowerCase().trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-');
  }

  function seedIdentity(sections: ServerSection[]) {
    sectionSlugs = new Map(sections.filter((s) => s.slug).map((s) => [s.slug.toLowerCase(), s.heading]));
    baseHash = new Map(sections.map((s) => [s.id, s.contentHash]));
    lastSavedOrder = sections.map((s) => s.id);
    const preamble = sections.find((s) => s.level === 0);
    tracker.init(view.state.doc, sections.filter((s) => s.level > 0).map((s) => s.id), preamble?.id ?? null);
    lastKnown = new Map();
    lastBlocks = [];
    // Prime the baselines from the editor's own reading of the document rather than from the server's rows: the
    // parser may normalise on the way in, and the baseline has to describe what is actually in the editor.
    currentBlocks();
  }

  const deps = () => ({ schema, serialize: serialize! });

  /** The document as an ordered, GUID-tagged block list — the four tiers, most trustworthy first. */
  function currentBlocks(): Block[] {
    const blocks = extractBlocks(view.state.doc, deps(), tracker);
    relinkByContent(blocks, tracker, lastKnown);
    relinkBySuspectPosition(blocks, tracker);
    if (lastBlocks.length) alignBySequence(blocks, lastBlocks, tracker);
    for (const b of blocks) if (b.id) lastKnown.set(b.id, { heading: b.heading, body: b.body });
    lastBlocks = blocks.map((b) => ({ id: b.id, heading: b.heading, body: b.body }));
    return blocks;
  }

  /** Re-pin the tracker and the re-link baselines to the ids the server reports after a save. */
  function adoptIdentity(sent: { id: string | null; level: number; heading: string; body: string }[], order: string[]) {
    // A server that does not report the order, or reports a different shape, leaves identity untouched rather
    // than half-applied — the tiers can recover, a wrong id cannot.
    if (!view || !Array.isArray(order) || order.length !== sent.length) return;
    const headingIds = order.filter((_, i) => sent[i].level > 0);
    const preambleId = sent[0]?.level === 0 ? order[0] : null;
    tracker.init(view.state.doc, headingIds, preambleId);
    lastKnown = new Map();
    lastBlocks = sent.map((b, i) => ({ id: order[i], heading: b.heading, body: b.body }));
    for (const b of lastBlocks) if (b.id) lastKnown.set(b.id, { heading: b.heading, body: b.body });
  }

  // ── Images ─────────────────────────────────────────────────────────────────────────────────────────────────────
  //
  // Paste or drop an image and it is uploaded and inserted where you are. The bytes go to the platform's file upload
  // over `host.data` — the session's own credentialed channel — and the new asset's stable `/api/files/<id>` URL is
  // what the markdown carries. Nothing about the image is stored in the document but that URL, so the document
  // round-trips as ordinary markdown.

  /** The image files on a clipboard or a drop, if any. `getAsFile` is the only way to reach a pasted screenshot. */
  function imageFilesIn(dt: DataTransfer | null | undefined): File[] {
    if (!dt) return [];
    const out: File[] = [];
    for (const item of Array.from(dt.items ?? [])) {
      if (item.kind !== 'file') continue;
      const f = item.getAsFile();
      if (f && f.type.startsWith('image/')) out.push(f);
    }
    // Some browsers populate `files` but not `items` for a drop.
    if (!out.length) for (const f of Array.from(dt.files ?? [])) if (f.type.startsWith('image/')) out.push(f);
    return out;
  }

  /**
   * Upload each image, then insert it. Sequentially, so several pasted images land in the order they were given
   * rather than in whatever order the network finished.
   *
   * A refusal is REPORTED, never swallowed: the server owns the type and size rules, so its message is the true
   * answer, and an image that silently fails to appear is the worst possible outcome for someone who just pasted a
   * screenshot into a document.
   */
  async function uploadAndInsert(files: File[]) {
    if (!host.data || !view || !cmdCtx) return;
    for (const file of files) {
      // Pre-checks for the MESSAGE only — the server enforces both, and would refuse regardless of what is asked
      // here. They spare a slow connection from uploading 40 MB only to be refused.
      if (!file.type.startsWith('image/')) { say(`${file.name}: not an image`); continue; }
      if (file.size > UPLOAD_MAX_BYTES) {
        say(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${UPLOAD_MAX_BYTES / 1024 / 1024} MB`);
        continue;
      }
      say(`uploading ${file.name}…`);
      try {
        const form = new FormData();
        form.append('file', file, file.name);
        const res = await host.data.request(UPLOAD_PATH, { method: 'POST', body: form });
        if (!res.ok) {
          // The server's own words where it has them — "Only image files are supported", "File exceeds the 10 MB
          // limit" — because it is the one that decided.
          let msg = `upload failed (HTTP ${res.status})`;
          try { const j = await res.json() as { error?: string }; if (j?.error) msg = `upload refused: ${j.error}`; } catch { /* keep the status */ }
          say(msg);
          continue;
        }
        const { id } = await res.json() as { id: string; url: string };
        if (!id) { say('upload returned no asset id'); continue; }
        // The DOCUMENT gets the stable id-keyed URL. The signed one never goes near it — see SignedImageView.
        const url = assetUrl(id);
        if (destroyed || !view) return;
        callCommand(insertImageCommand.key, { src: url, alt: file.name.replace(/\.[^.]+$/, ''), title: '' })(cmdCtx);
        say(`added ${file.name}`);
      } catch (err) {
        say(`upload failed: ${(err as Error).message}`);
      }
    }
  }

  /** Mint a short-lived signature for a FileAsset, or null when this reader may not have it.
   *
   *  The authorization is the SERVER's and it is by READ: the sign endpoint fetches the asset through the caller's
   *  own secured context, so an id they cannot read is an id they cannot sign. Nothing here decides anything — a
   *  null simply means the answer was no. */
  async function signAsset(assetId: string): Promise<{ url: string; expiresAt: string } | null> {
    if (!host.data) return null;
    try {
      const res = await host.data.request(`/api/files/${assetId}/sign`, { method: 'POST' });
      if (!res.ok) return null;
      return await res.json() as { url: string; expiresAt: string };
    } catch { return null; }
  }

  /** Re-read the section hashes so the next save's preconditions are current. One small GET, not a re-render. */
  async function refreshHashes() {
    if (!host.data) return;
    try {
      const res = await host.data.request(docPath());
      if (!res.ok) return;
      const doc = (await res.json()) as ReadResponse;
      baseHash = new Map(doc.sections.map((s) => [s.id, s.contentHash]));
      lastSavedOrder = doc.sections.map((s) => s.id);
    } catch { /* the next save simply sends no precondition for anything it could not refresh */ }
  }

  /**
   * Someone else changed a section we were about to overwrite. Rather than guess at a merge, reload the document
   * and re-pin identity — the edit that was refused is still in front of the user, in their own editor, to redo.
   */
  async function reloadFromServer() {
    if (!host.data || !view || !parse) return;
    const res = await host.data.request(docPath());
    if (!res.ok) { say('could not reload'); return; }
    const doc = (await res.json()) as ReadResponse;
    ready = false;
    const parsed = parse(doc.markdown);
    const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, parsed.content);
    tracker.apply(tr);
    view.dispatch(tr);
    seedIdentity(doc.sections);
    for (const b of currentBlocks()) if (b.id) serverState.set(b.id, { level: b.level, heading: b.heading, body: b.body });
    ready = true;
    dirty = false;
    applyPlaceholder();     // a reload can empty a document that had content, and vice versa
    say(`reloaded · ${doc.sections.length} sections`);
  }

  /**
   * Offer the user their own version back after a refused save.
   *
   * Deliberately NOT a merge: two edits to one section can only be combined by guessing, and a wrong guess in a
   * document is worse than an explicit choice. What it does guarantee is that a conflict never costs the user their
   * writing — the text is held, named, and one click away from being reapplied on top of the current version.
   */
  function showConflict(mine: Map<string, Block>, theirs: ConflictResponse['conflicts']) {
    if (mine.size === 0) { conflictBar.hidden = true; return; }
    const names = theirs.map((t) => t.heading || 'the opening section').join(', ');
    conflictBar.replaceChildren();

    const msg = el.ownerDocument.createElement('span');
    msg.className = 'osy-md__conflict-msg';
    msg.textContent = `${names} changed while you were editing. Your version was not saved.`;

    const keep = button('Keep my version');
    const drop = button('Discard mine');
    keep.classList.add('osy-md__btn--primary');

    keep.addEventListener('click', async () => {
      conflictBar.hidden = true;
      say('re-applying your version…');
      // Re-based on the CURRENT hashes, so this is an ordinary edit on top of theirs rather than a second attempt
      // at the same stale write.
      const blocks = [...mine.entries()].map(([id, b]) => ({
        id, level: b.level, heading: b.heading, body: b.body, baseHash: baseHash.get(id) ?? null,
      }));
      const res = await host.data!.request(docPath(), { method: 'POST', body: { blocks, scope: 'partial' } });
      if (!res.ok) { say(`could not re-apply (HTTP ${res.status})`); return; }
      await reloadFromServer();
      say('your version re-applied');
    });
    drop.addEventListener('click', () => { conflictBar.hidden = true; say('kept the other version'); });

    conflictBar.append(msg, keep, drop);
    conflictBar.hidden = false;
  }

  function markDirty() {
    if (!ready || current.readOnly) return;
    editSeq++;
    if (!dirty) { dirty = true; host.emit('dirty', true); }
    say('unsaved…');
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => void save(), AUTOSAVE_MS);
  }

  /**
   * Is this edit STRUCTURAL — did the set of sections or their order change?
   *
   * A structural edit has to go up as the whole document, because deciding which id belongs to which block after a
   * split, merge, move or delete is a decision about the document as a whole. A content-only edit does not: the
   * sections are the same sections in the same order, so only the ones that actually changed need to travel.
   */
  function isStructural(blocks: Block[]): boolean {
    const now = blocks.map((b) => b.id);
    if (now.some((id) => id == null)) return true;                    // a new section
    if (now.length !== lastSavedOrder.length) return true;            // one appeared or vanished
    return now.some((id, i) => id !== lastSavedOrder[i]);             // or moved
  }

  async function save() {
    if (destroyed || current.readOnly || !view || !host.data) return;
    // One save at a time — a second POST would race the first over the same section hashes. Remember that one was
    // owed, though: the timer that asked for it has already expired, so dropping it here loses the edit outright.
    if (saving) { savePending = true; return; }
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    saving = true;
    const seq = editSeq;
    say('saving…');
    try {
      const all = currentBlocks();
      const structural = isStructural(all);
      const wire = (b: Block) => ({
        id: b.id, level: b.level, heading: b.heading, body: b.body,
        baseHash: b.id ? baseHash.get(b.id) ?? null : null,
      });

      // Content-only: send just the sections whose text actually moved. A checkbox tick is one block, not a
      // document — and a section this save never mentions cannot conflict with anyone else's edit to it.
      const blocks = structural
        ? all.map(wire)
        : all.filter((b) => {
            const held = serverState.get(b.id!);
            return !held || held.level !== b.level || held.heading !== b.heading || held.body !== b.body;
          }).map(wire);

      if (!structural && blocks.length === 0) { dirty = false; say('saved · nothing changed'); return; }

      const res = await host.data.request(docPath(), {
        method: 'POST',
        body: { blocks, scope: structural ? 'full' : 'partial' },
      });

      if (res.status === 409) {
        const c = (await res.json()) as ConflictResponse;
        // Hold on to what the user wrote BEFORE re-basing on the server. Reloading is the only safe way to get back
        // to a known state, but reloading without this would throw their edit away — which is the whole cost of a
        // conflict, and the part that has nothing to do with merging.
        const mine = new Map<string, Block>();
        for (const k of c.conflicts) {
          const b = all.find((x) => x.id === k.id);
          if (b) mine.set(k.id, b);
        }
        await reloadFromServer();
        showConflict(mine, c.conflicts);
        return;
      }
      if (!res.ok) { say(`save failed (HTTP ${res.status})`); return; }
      const out = (await res.json()) as SaveResponse;
      // Adopt the identity the server just assigned. Sections the editor created went up with no id and came back
      // with one; without adopting them here the editor would send them as new AGAIN next time, and every save
      // would delete and recreate the same rows. The response is in document order, so it zips with what we sent.
      adoptIdentity(all, out.order);
      // The server now holds exactly what we sent for these sections, at a hash we can recompute from their text.
      for (const b of all) if (b.id) serverState.set(b.id, { level: b.level, heading: b.heading, body: b.body });
      lastSavedOrder = out.order;
      await refreshHashes();
      // Clean only if the document did NOT move while this save was in the air. An edit that landed mid-flight is
      // not in what the server just acknowledged, and telling the app it is clean would put a Save button (or an
      // unsaved-changes prompt) in the wrong state for as long as the follow-up save takes.
      if (editSeq === seq) { dirty = false; host.emit('dirty', false); }
      host.emit('saved', out.updated.length, out.created.length, out.deleted.length);
      const touched = out.updated.length + out.created.length + out.deleted.length;
      // RECORD-SCOPED SAYS "staged", NOT "saved", and the distinction is not pedantry. In that mode the POST lands in
      // the PAGE's unit of work and is durable only once the page commits — so a page whose Save forgets to
      // `commit()` discards every one of these writes, while the editor would have been reporting `saved · 1 new`
      // all along. A status that overclaims is worse than no status, because it is the thing a person checks before
      // navigating away.
      const verb = current.recordScoped ? 'staged for save' : 'saved';
      say(touched === 0
        ? `${verb} · nothing changed · ${out.unchanged.length} sections`
        : `${verb} · ${out.updated.length} updated, ${out.created.length} new, ${out.deleted.length} removed`);
    } catch (err) {
      say(`save failed: ${(err as Error).message}`);
    } finally {
      saving = false;
      // Run the one this save refused. Immediately, not on a fresh debounce: the edit is already at least a full
      // autosave interval old, and nothing else is going to ask again.
      if (savePending && !destroyed) { savePending = false; void save(); }
    }
  }

  // ── raw source mode, over the SAME markdown string ────────────────────
  function toRaw() {
    if (!view || !serialize) return;
    // Snapshot identity as it stands RIGHT NOW, before the document is torn down. Coming back from raw replaces
    // every node at once, so the sequence tier is the only thing left to re-attach ids — and it can only align
    // against a baseline that describes the document as it was immediately before the toggle, not as of the last
    // save. Without this, any section edited since that save comes back as a delete plus a create.
    currentBlocks();
    const md = serialize(view.state.doc).trimEnd();
    // The caret is carried as a fraction of the document. The two engines index different things (node positions
    // vs character offsets), so this is approximate by construction; mapping through the section ranges would make
    // it exact.
    const frac = view.state.selection.from / Math.max(1, view.state.doc.content.size);

    richHost.style.display = 'none';
    rawHost.style.display = 'block';
    cm = new CMView({
      parent: rawHost,
      state: EditorState.create({
        doc: md,
        selection: { anchor: Math.min(Math.round(frac * md.length), md.length) },
        extensions: [
          cmMarkdown(), cmHistory(),
          keymap.of([...defaultKeymap, ...historyKeymap]),
          drawSelection(), highlightActiveLine(),
          syntaxHighlighting(cmHighlight),
          CMView.lineWrapping,
          CMView.editable.of(!current.readOnly),
          CMView.updateListener.of((u) => { if (u.docChanged) markDirty(); }),
        ],
      }),
    });
    cm.focus();
    // The toolbar is about a ProseMirror selection that no longer exists once the source view is up, and nothing will
    // call `shouldShow` again until the rendered view comes back. The popover points at a rendered link, likewise.
    selProvider?.hide();
    closeLinkEditor();
    hideLinkPopover();
    hideTableGrips();      // they describe a rendered table; the source view has none
    mode = 'raw';
    modeBtn.textContent = 'Rendered';
    modeBtn.setAttribute('aria-pressed', 'true');
    applyPlaceholder();     // source mode is CodeMirror — a prompt over raw markdown reads as text in the file
  }

  function toRich() {
    if (!cm || !view || !parse) return;
    const md = cm.state.doc.toString();
    const frac = cm.state.selection.main.from / Math.max(1, md.length);
    cm.destroy(); cm = null;
    rawHost.replaceChildren();
    rawHost.style.display = 'none';
    richHost.style.display = 'block';

    // Replacing the whole document destroys every tracked position at once. Identity survives because the content
    // and sequence tiers run on the next extract — which is exactly why tier 4 exists.
    const doc = parse(md);
    const tr = view.state.tr.replaceWith(0, view.state.doc.content.size, doc.content);
    tracker.apply(tr);
    view.dispatch(tr);

    const target = Math.min(Math.round(frac * view.state.doc.content.size), Math.max(1, view.state.doc.content.size - 1));
    try {
      view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(Math.max(1, target)))).scrollIntoView());
    } catch { /* selection restore is best effort; never block the toggle on it */ }
    view.focus();
    mode = 'rich';
    modeBtn.textContent = 'Source';
    modeBtn.removeAttribute('aria-pressed');
    applyPlaceholder();
  }

  // ── Density + the outline rail ─────────────────────────────────────────────────────────────────────────────────
  function applyDensity() {
    root.setAttribute('data-density', current.density === 'compact' ? 'compact' : 'comfortable');
  }
  function applyOutlineVisibility() {
    root.setAttribute('data-outline', current.outline ? 'on' : 'off');
  }

  /**
   * The empty-document prompt — the same idea `Input` and `Field` have, spelled the same way.
   *
   * It is CSS on a data attribute, NOT a node in the document, and that is the whole design. A placeholder that
   * lives in the doc is content: it would be saved, diffed into a section, exported, searched and counted. This
   * writes nothing into ProseMirror's state — the document with no text is still a document with no text — so
   * `0 sections` stays true and a save still writes nothing.
   *
   * Three conditions, each of which is a real case rather than defensive coding:
   *  · RICH MODE ONLY. Source mode is CodeMirror; a prompt floating over raw markdown reads as text in the file.
   *  · NOT `readOnly`. A prompt invites typing, and there is nothing to invite.
   *  · GENUINELY EMPTY. `doc.textContent` rather than a node count: a fresh ProseMirror document is one empty
   *    paragraph, never zero nodes, so counting nodes says "not empty" for the exact case this exists for.
   */
  function applyPlaceholder() {
    const text = current.placeholder ?? '';
    const empty = mode === 'rich' && !current.readOnly && text !== '' && docIsEmpty();
    root.setAttribute('data-empty', empty ? 'yes' : 'no');
    // A CSS custom property rather than an attribute, because `attr()` in `content:` reads the attribute of the
    // element the pseudo belongs to — which is the ProseMirror surface, not this root. `JSON.stringify` produces a
    // correctly quoted and escaped CSS string, so a prompt containing a quote or a backslash cannot break out of it.
    if (empty) root.style.setProperty('--osy-md-placeholder', JSON.stringify(text));
    else root.style.removeProperty('--osy-md-placeholder');
  }

  /** Is the rich document devoid of text? Whitespace counts as empty — a stray space is not content a reader sees. */
  function docIsEmpty(): boolean {
    try { return (view?.state.doc.textContent ?? '').trim() === ''; }
    catch { return false; }   // mid-teardown: say "not empty" rather than flashing a prompt over a live document
  }

  /**
   * Rebuild the outline from the LIVE document rather than the last saved section list, so a heading you just typed
   * appears immediately. Debounced, because it runs off every keystroke and a full walk per character would be the
   * one thing in this control that made typing feel heavy.
   */
  function scheduleOutline() {
    if (!current.outline) return;
    if (outlineTimer) clearTimeout(outlineTimer);
    outlineTimer = setTimeout(buildOutline, 250);
  }

  /** The outline's label for a heading. `textContent` alone is wrong for any heading that carries maths: a
   *  formula is an ATOM whose text is empty, so `Where $E = mc^2$ comes from` listed as "Where comes from". The TeX
   *  source stands in for each one — the same fallback the formula itself shows before its chunk arrives. */
  function headingLabel(node: any): string {
    let out = '';
    node.forEach((child: any) => {
      out += child.type.name === 'math_inline' ? String(child.attrs?.value ?? '') : child.textContent;
    });
    return out.replace(/\s+/g, ' ').trim();
  }

  /** Every heading in the live document, in order — what the outline rail shows and what the probe reports. */
  function outlineEntries(): { pos: number; level: number; text: string }[] {
    const entries: { pos: number; level: number; text: string }[] = [];
    if (!view) return entries;
    view.state.doc.forEach((node: any, offset: number) => {
      if (node.type.name !== 'heading') return;
      entries.push({ pos: offset, level: node.attrs?.level ?? 1, text: headingLabel(node) });
    });
    return entries;
  }

  function buildOutline() {
    if (destroyed || !view || !current.outline) return;
    const doc = el.ownerDocument;
    const entries = outlineEntries();

    outlineEl.replaceChildren();
    if (!entries.length) {
      const empty = doc.createElement('p');
      empty.className = 'osy-md__outline-empty';
      empty.textContent = 'No headings yet';
      outlineEl.append(empty);
      return;
    }
    for (const e of entries) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'osy-md__outline-item';
      b.dataset.level = String(Math.min(e.level, 4));
      b.textContent = e.text || '(untitled)';
      b.title = e.text;
      b.addEventListener('click', () => {
        if (!view) return;
        const dom = view.nodeDOM(e.pos);
        if (dom instanceof HTMLElement) dom.scrollIntoView({ block: 'start', behavior: 'smooth' });
        // Put the caret in the heading too — clicking an outline entry is "take me there to work", not just to look.
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, e.pos + 1)));
        view.focus();
      });
      outlineEl.append(b);
    }
  }

  // ── The slash menu ─────────────────────────────────────────────────────────────────────────────────────────────
  let slashProvider: SlashProvider | null = null;
  let slashActive = false;
  let slashIndex = 0;
  let slashMatches: SlashItem[] = [];
  let slashQuery = '';
  /**
   * The query the menu was dismissed at. Escape alone is not enough: the next transaction re-runs `shouldShow`,
   * which re-probes the same unchanged `/quo` text and re-opens the menu you just dismissed. Suppress until the
   * query actually changes, or the caret leaves it.
   */
  let slashDismissedAt: string | null = null;
  const slashEl = el.ownerDocument.createElement('div');
  slashEl.className = 'osy-md__slash';

  /** The `/query` immediately before the cursor, or null when the menu should not be up. */
  function slashProbe(v: any): string | null {
    const { selection } = v.state;
    if (!selection.empty || !(selection instanceof TextSelection)) return null;
    const $from = selection.$from;
    if ($from.parent.type.name !== 'paragraph') return null;
    // From the block's START, not a window: the `^` boundary in SLASH_RE has to mean the start of the BLOCK, and a
    // sliding window would make it mean "60 characters back", firing mid-sentence in a long paragraph.
    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '\uFFFC');
    const m = SLASH_RE.exec(before);
    return m ? m[1] : null;
  }

  function renderSlash() {
    const q = slashQuery.toLowerCase();
    slashMatches = q
      ? SLASH_ITEMS.filter((i) => i.label.toLowerCase().includes(q) || i.keys.some((k) => k.startsWith(q)))
      : SLASH_ITEMS.slice();
    if (slashIndex >= slashMatches.length) slashIndex = 0;
    slashEl.replaceChildren();
    if (!slashMatches.length) {
      const none = el.ownerDocument.createElement('div');
      none.className = 'osy-md__slash-empty';
      none.textContent = 'No matching block';
      slashEl.append(none);
      return;
    }
    slashMatches.forEach((item, i) => {
      const b = el.ownerDocument.createElement('button');
      b.type = 'button';
      b.className = 'osy-md__slash-item';
      if (i === slashIndex) b.dataset.active = 'true';
      const label = el.ownerDocument.createElement('span');
      label.className = 'osy-md__slash-label';
      label.textContent = item.label;
      const hint = el.ownerDocument.createElement('span');
      hint.className = 'osy-md__slash-hint';
      hint.textContent = item.hint;
      b.append(label, hint);
      // mousedown, not click: the editor must not lose the selection the pick is about to act on.
      b.addEventListener('mousedown', (ev) => { ev.preventDefault(); pickSlash(i); });
      slashEl.append(b);
      // The list is capped and scrolls, so the keyboard's position has to be kept visible — otherwise arrowing past
      // the sixth item moves a highlight you can no longer see. `nearest` scrolls the minimum needed.
      if (i === slashIndex) requestAnimationFrame(() => b.scrollIntoView({ block: 'nearest' }));
    });
  }

  /**
   * Turn the list items the selection touches into TASK items, or back.
   *
   * GFM models a task item as a `checked` ATTRIBUTE on an ordinary list item, and ships no command for it — only the
   * `[ ] ` input rule — so this is the one menu entry assembled here rather than delegated to a preset.
   *
   * Only the SHALLOWEST items in range are touched. `nodesBetween` descends, so a list item that contains a sublist
   * would otherwise tick its children too, which is not what "make this a checklist" means anywhere else.
   */
  function taskifySelection(force?: boolean | null) {
    if (!view) return;
    const { from, to } = view.state.selection;
    const found: { pos: number; depth: number; checked: boolean | null }[] = [];
    view.state.doc.nodesBetween(from, to, (n: any, p: number) => {
      if (n.type.name !== 'list_item') return true;
      found.push({ pos: p, depth: view.state.doc.resolve(p).depth, checked: n.attrs.checked ?? null });
      return true;
    });
    if (!found.length) return;
    const top = Math.min(...found.map((f) => f.depth));
    const items = found.filter((f) => f.depth === top);
    // Toggle by default: a list already ALL task items goes back to plain, which is what pressing the same entry
    // twice should do. An explicit `force` is for the slash menu, where the list was just created.
    const value = force !== undefined ? force : (items.every((i) => i.checked !== null) ? null : false);
    const tr = view.state.tr;
    // BACKWARDS, so one setNodeMarkup cannot invalidate the position of the next.
    for (const it of items.slice().reverse()) {
      const n = view.state.doc.nodeAt(it.pos);
      if (n) tr.setNodeMarkup(it.pos, undefined, { ...n.attrs, checked: value });
    }
    if (tr.docChanged) view.dispatch(tr);
  }

  const slashApi: SlashApi = { taskify: () => taskifySelection(false) };

  /** Apply an item: remove the typed `/query` first, then run the command on the now-clean paragraph. */
  function pickSlash(i: number) {
    const item = slashMatches[i];
    if (!item || !view || !cmdCtx) return;
    const to = view.state.selection.from;
    const from = to - (slashQuery.length + 1);   // +1 for the slash itself
    view.dispatch(view.state.tr.delete(from, to));
    view.focus();
    item.run(cmdCtx, slashApi);
    slashProvider?.hide();
    slashActive = false;
  }

  function mountSlash(_ctx: any) {
    root.append(slashEl);
    slashProvider = new SlashProvider({
      content: slashEl,
      root: richHost,
      debounce: 0,
      // The stock trigger only fires while the LAST character is "/", so the menu vanished the moment you typed a
      // letter to narrow it. Matching `/query` instead is what makes it filterable rather than a one-shot list.
      shouldShow: (v) => {
        if (current.readOnly) return false;
        const q = slashProbe(v);
        if (q === null) { slashActive = false; slashDismissedAt = null; return false; }
        if (slashDismissedAt !== null && q === slashDismissedAt) { slashActive = false; return false; }
        slashDismissedAt = null;
        if (!slashActive || q !== slashQuery) { slashIndex = 0; }
        slashQuery = q;
        slashActive = true;
        renderSlash();
        return slashMatches.length > 0;
      },
    });
    slashProvider.onHide = () => { slashActive = false; };
  }

  // ── The selection toolbar ──────────────────────────────────────────────────────────────────────────────────────
  //
  // Two faces on one popover: the MARKS row, and the URL field the link button swaps in. One element rather than two
  // because they are the same object to the person using it — the field opens where the button they just pressed
  // was, and closing it puts the buttons back — and because `plugin/tooltip` positions exactly one element.
  let selProvider: TooltipProvider | null = null;
  const selEl = el.ownerDocument.createElement('div');
  selEl.className = 'osy-md__seltool';
  selEl.dataset.mode = 'marks';

  const selMarksRow = el.ownerDocument.createElement('div');
  selMarksRow.className = 'osy-md__seltool-row';
  const selLinkRow = el.ownerDocument.createElement('div');
  selLinkRow.className = 'osy-md__seltool-row osy-md__seltool-linkrow';

  /** The mark buttons, built once — only their active state changes as the selection moves. */
  const selButtons = new Map<string, HTMLButtonElement>();
  for (const item of SEL_MARKS) {
    const b = el.ownerDocument.createElement('button');
    b.type = 'button';
    b.className = 'osy-md__seltool-btn';
    b.dataset.mark = item.mark;
    b.textContent = item.label;
    b.title = item.title;
    b.setAttribute('aria-label', item.title);
    // mousedown + preventDefault, as in the slash menu: pressing a button must not take the selection it is about
    // to format. The click event never fires without focus moving, so the action rides mousedown.
    b.addEventListener('mousedown', (ev) => {
      ev.preventDefault();
      if (!view || !cmdCtx) return;
      item.run(cmdCtx);
      renderSelToolbar(view.state);
    });
    selButtons.set(item.mark, b);
    selMarksRow.append(b);
  }

  const selSep = el.ownerDocument.createElement('span');
  selSep.className = 'osy-md__seltool-sep';
  const selLinkBtn = el.ownerDocument.createElement('button');
  selLinkBtn.type = 'button';
  selLinkBtn.className = 'osy-md__seltool-btn osy-md__seltool-link';
  selLinkBtn.dataset.mark = 'link';
  selLinkBtn.textContent = 'Link';
  selLinkBtn.title = 'Link';
  selLinkBtn.addEventListener('mousedown', (ev) => { ev.preventDefault(); openLinkEditor(); });
  selMarksRow.append(selSep, selLinkBtn);

  const selUrl = el.ownerDocument.createElement('input');
  selUrl.type = 'text';
  selUrl.className = 'osy-md__seltool-url';
  selUrl.placeholder = 'https://…';
  selUrl.setAttribute('aria-label', 'Link address');
  selUrl.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); applyLink(); }
    else if (ev.key === 'Escape') { ev.preventDefault(); closeLinkEditor(true); }
    // Everything else is ordinary typing in a text field — it must not reach the editor's keymaps.
    ev.stopPropagation();
  });
  const selApply = el.ownerDocument.createElement('button');
  selApply.type = 'button';
  selApply.className = 'osy-md__seltool-btn';
  selApply.textContent = '✓';
  selApply.title = 'Apply';
  selApply.addEventListener('mousedown', (ev) => { ev.preventDefault(); applyLink(); });
  const selUnlink = el.ownerDocument.createElement('button');
  selUnlink.type = 'button';
  selUnlink.className = 'osy-md__seltool-btn osy-md__seltool-unlink';
  selUnlink.textContent = 'Remove';
  selUnlink.title = 'Remove link';
  selUnlink.addEventListener('mousedown', (ev) => { ev.preventDefault(); removeLink(); });
  selLinkRow.append(selUrl, selApply, selUnlink);
  selEl.append(selMarksRow, selLinkRow);

  /** Light the buttons that describe what the selection already IS. */
  function renderSelToolbar(state: any) {
    if (!schema) return;
    for (const [name, btn] of selButtons) {
      const on = markActive(state, schema.marks[name]);
      if (on) btn.dataset.active = 'true'; else delete btn.dataset.active;
    }
    const href = linkHrefIn(state, schema.marks.link);
    if (href !== null) selLinkBtn.dataset.active = 'true'; else delete selLinkBtn.dataset.active;
    // A link that exists can be removed; one that does not, cannot — an always-present Remove is a button that
    // usually does nothing.
    selUnlink.hidden = href === null;
  }

  function openLinkEditor() {
    if (!view) return;
    const href = linkHrefIn(view.state, schema?.marks.link);
    selUrl.value = href ?? '';
    selUnlink.hidden = href === null;
    selEl.dataset.mode = 'link';
    const { from, to } = view.state.selection;
    view.dispatch(view.state.tr.setMeta(selKeepKey, { from, to }));
    // After the frame the tooltip is laid out in, or the caret lands in a field that has not been shown yet.
    requestAnimationFrame(() => { selUrl.focus(); selUrl.select(); });
  }

  /** `restoreFocus` returns the caret to the document — right after Escape, wrong when the editor is being hidden. */
  function closeLinkEditor(restoreFocus = false) {
    selEl.dataset.mode = 'marks';
    selUrl.value = '';
    // Only when it is actually set — a no-op transaction on every hide would churn the editor for nothing.
    if (view && selKeepKey.getState(view.state)) view.dispatch(view.state.tr.setMeta(selKeepKey, null));
    if (restoreFocus) view?.focus();
  }

  function applyLink() {
    if (!view || !cmdCtx || !schema) return;
    const href = selUrl.value.trim();
    if (!href) { removeLink(); return; }
    const existing = linkHrefIn(view.state, schema.marks.link) !== null;
    view.focus();
    // Two different commands, because they are two different operations: `update` rewrites the href of the link the
    // caret is in (and keeps its title), while `toggle` puts a new mark on the selected range.
    if (existing) callCommand(updateLinkCommand.key, { href })(cmdCtx);
    else callCommand(toggleLinkCommand.key, { href })(cmdCtx);
    closeLinkEditor();
  }

  function removeLink() {
    if (!view || !cmdCtx || !schema) return;
    if (linkHrefIn(view.state, schema.marks.link) !== null) {
      view.focus();
      callCommand(toggleLinkCommand.key, {})(cmdCtx);   // toggleMark removes when the range already carries it
    }
    closeLinkEditor(true);
  }

  // ── Table controls on the cell borders ─────────────────────────────────────────────────────────────────────────
  //
  // Hover a table and grips appear along its top and left edges — one per column, one per row — with a `+` on the
  // trailing edges to add at the end. This is the shape the block menu could only approximate: a grip IS the
  // column, so every verb it offers already knows which column it means. The block menu has to reconstruct that from
  // the caret, and the click that opens the menu is exactly what moves the caret.
  //
  // The overlay is positioned from the CELL RECTS rather than a layout of our own, so it tracks whatever the
  // browser actually did with the table — column widths that differ, a table that scrolls sideways inside itself,
  // a density change. Recomputed on every show; there is no cached geometry to go stale.
  const tableGrips = el.ownerDocument.createElement('div');
  tableGrips.className = 'osy-md__tgrips';
  tableGrips.hidden = true;
  /** Which table the grips currently describe, and where it is in the document. */
  let gripTable: { pos: number; node: any; dom: HTMLElement } | null = null;
  /**
   * Hiding is DELAYED, because reaching a grip means leaving the table: the grips sit outside its edges, so the
   * pointer necessarily passes over whatever is beside the table on the way. Hiding the instant the pointer is not
   * on a cell made every grip unreachable — you could see them and never touch them.
   */
  let gripHideTimer: ReturnType<typeof setTimeout> | null = null;

  const tableMenu = el.ownerDocument.createElement('div');
  tableMenu.className = 'osy-md__tmenu';
  tableMenu.hidden = true;

  function scheduleGripHide() {
    if (gripHideTimer) clearTimeout(gripHideTimer);
    gripHideTimer = setTimeout(() => { if (tableMenu.hidden) hideTableGrips(); }, 400);
  }

  function cancelGripHide() {
    if (gripHideTimer) { clearTimeout(gripHideTimer); gripHideTimer = null; }
  }

  function hideTableGrips() {
    cancelGripHide();
    tableGrips.hidden = true;
    tableGrips.replaceChildren();
    gripTable = null;
    tableMenu.hidden = true;
  }

  /** Build the grips for the table under the pointer. Cheap enough to redo on hover; nothing is cached. */
  function showTableGrips(tableDom: HTMLElement) {
    if (!view || current.readOnly) return;
    const at = view.posAtDOM(tableDom, 0);
    if (typeof at !== 'number') return;
    // posAtDOM lands INSIDE the table; resolve out to the table node itself.
    const $at = view.state.doc.resolve(at);
    let pos: number | null = null;
    let node: any = null;
    for (let d = $at.depth; d > 0; d--) {
      if ($at.node(d).type.name === 'table') { pos = $at.before(d); node = $at.node(d); break; }
    }
    if (pos === null || !node) return;

    const rr = root.getBoundingClientRect();
    const firstRow = tableDom.querySelector('tr');
    if (!firstRow) return;
    const cells = Array.from(firstRow.children) as HTMLElement[];
    const rows = Array.from(tableDom.querySelectorAll('tr')) as HTMLElement[];
    const tableRect = tableDom.getBoundingClientRect();

    gripTable = { pos, node, dom: tableDom };
    tableGrips.replaceChildren();
    tableGrips.hidden = false;

    // One grip per COLUMN, sitting on the table's top edge, spanning exactly that column's width.
    cells.forEach((cell, col) => {
      const r = cell.getBoundingClientRect();
      const g = el.ownerDocument.createElement('button');
      g.type = 'button';
      g.className = 'osy-md__tgrip osy-md__tgrip--col';
      g.title = `Column ${col + 1}`;
      g.setAttribute('aria-label', `Column ${col + 1} actions`);
      // Flush with the table's top border, and tall enough to be a real target: the gap between an edge control
      // and its table is a gap the pointer has to cross on the way to the control.
      g.style.left = `${r.left - rr.left}px`;
      g.style.top = `${tableRect.top - rr.top - 12}px`;
      g.style.width = `${r.width}px`;
      g.addEventListener('click', (ev) => { ev.stopPropagation(); openTableMenu('col', col, g); });
      tableGrips.append(g);
    });

    // One per ROW, on the left edge. The header row gets one too — deleting it is not offered, but aligning and
    // inserting around it are perfectly sensible.
    rows.forEach((rowEl, row) => {
      const r = rowEl.getBoundingClientRect();
      const g = el.ownerDocument.createElement('button');
      g.type = 'button';
      g.className = 'osy-md__tgrip osy-md__tgrip--row';
      g.title = `Row ${row + 1}`;
      g.setAttribute('aria-label', `Row ${row + 1} actions`);
      g.style.left = `${tableRect.left - rr.left - 12}px`;
      g.style.top = `${r.top - rr.top}px`;
      g.style.height = `${r.height}px`;
      g.addEventListener('click', (ev) => { ev.stopPropagation(); openTableMenu('row', row, g); });
      tableGrips.append(g);
    });

    // The two `+`s: a column on the right edge, a row on the bottom. Adding at the end is the commonest table edit
    // there is, and making it a single click is most of the value of this whole affordance.
    // Anchored to the LAST CELL, not to the table element: a table stretches to its container, so its right edge
    // can be far past where the columns actually end, which would strand the button out of reach.
    const lastCell = cells[cells.length - 1].getBoundingClientRect();
    const addCol = plusButton('Add column', () => runTableCmd('col-after', 0, cells.length - 1));
    addCol.style.left = `${lastCell.right - rr.left + 4}px`;
    addCol.style.top = `${tableRect.top - rr.top}px`;
    const addRow = plusButton('Add row', () => runTableCmd('row-after', rows.length - 1, 0));
    addRow.style.left = `${tableRect.left - rr.left}px`;
    addRow.style.top = `${tableRect.bottom - rr.top + 4}px`;
    tableGrips.append(addCol, addRow);
  }

  function plusButton(title: string, run: () => void): HTMLButtonElement {
    const b = el.ownerDocument.createElement('button');
    b.type = 'button';
    b.className = 'osy-md__tplus';
    b.textContent = '+';
    b.title = title;
    b.setAttribute('aria-label', title);
    b.addEventListener('click', (ev) => { ev.stopPropagation(); run(); });
    return b;
  }

  /** The grip's own menu — the verbs that make sense for a whole row or a whole column, and nothing else. */
  function openTableMenu(kind: 'row' | 'col', index: number, anchor: HTMLElement) {
    tableMenu.replaceChildren();
    const items: { label: string; act: string; danger?: boolean }[] = kind === 'col'
      ? [
        { label: 'Insert column left', act: 'col-before' },
        { label: 'Insert column right', act: 'col-after' },
        { label: 'Align left', act: 'align-left' },
        { label: 'Align centre', act: 'align-center' },
        { label: 'Align right', act: 'align-right' },
        { label: 'Delete column', act: 'del-col', danger: true },
      ]
      : [
        { label: 'Insert row above', act: 'row-before' },
        { label: 'Insert row below', act: 'row-after' },
        // A GFM table's first row IS its header — that is the syntax, not a style — so there is no row to promote
        // and deleting it would leave a table that cannot be written back.
        ...(index === 0 ? [] : [{ label: 'Delete row', act: 'del-row', danger: true }]),
      ];
    for (const it of items) {
      const b = el.ownerDocument.createElement('button');
      b.type = 'button';
      b.className = 'osy-md__tmenu-item';
      if (it.danger) b.dataset.danger = 'true';
      b.textContent = it.label;
      b.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const row = kind === 'row' ? index : 0;
        const col = kind === 'col' ? index : 0;
        runTableCmd(it.act, row, col);
      });
      tableMenu.append(b);
    }
    tableMenu.hidden = false;
    const rr = root.getBoundingClientRect();
    const ar = anchor.getBoundingClientRect();
    const viewportH = el.ownerDocument.documentElement.clientHeight;
    const below = ar.bottom - rr.top + 4;
    const above = ar.top - rr.top - tableMenu.offsetHeight - 4;
    tableMenu.style.top = `${ar.bottom + tableMenu.offsetHeight + 8 > viewportH && above > 0 ? above : below}px`;
    tableMenu.style.left = `${Math.max(8, Math.min(ar.left - rr.left, rr.width - tableMenu.offsetWidth - 8))}px`;
  }

  /**
   * Run a table verb with the caret placed in the cell the grip names.
   *
   * This is the whole point of border controls: the gfm commands act on the CARET's cell, and here we know exactly
   * which cell that should be — the one at the grip's row/column — instead of reconstructing it from wherever the
   * user last happened to click.
   */
  function runTableCmd(act: string, row: number, col: number) {
    if (!view || !cmdCtx || !gripTable || current.readOnly) return;
    const { pos } = gripTable;
    const node = view.state.doc.nodeAt(pos);
    if (!node || node.type.name !== 'table') { hideTableGrips(); return; }
    const target = cellPos(node, pos, row, col) ?? firstCellPos(node, pos);
    if (target == null) return;
    try { view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, target))); } catch { return; }

    const cmd = { 'row-before': addRowBeforeCommand, 'row-after': addRowAfterCommand, 'col-before': addColBeforeCommand, 'col-after': addColAfterCommand }[act];
    if (cmd) callCommand(cmd.key)(cmdCtx);
    else if (act === 'del-row' || act === 'del-col') {
      callCommand((act === 'del-row' ? selectRowCommand : selectColCommand).key, { index: act === 'del-row' ? row : col })(cmdCtx);
      callCommand(deleteSelectedCellsCommand.key)(cmdCtx);
    } else if (act.startsWith('align-')) {
      const dir = act.slice('align-'.length);
      callCommand(setAlignCommand.key, dir === 'centre' ? 'center' : dir)(cmdCtx);
    }
    tableMenu.hidden = true;
    // The table just changed shape; rebuild the grips against the new geometry rather than leaving them describing
    // a table that no longer exists.
    requestAnimationFrame(() => {
      const dom = gripTable?.dom;
      if (dom && dom.isConnected) showTableGrips(dom); else hideTableGrips();
    });
  }

  // A menu with no way out is a trap: anything that is not the menu or a grip dismisses it, and so does Escape.
  // Registered on the DOCUMENT because a click that lands outside the control still means "not that menu".
  el.ownerDocument.addEventListener('click', (ev) => {
    if (tableMenu.hidden) return;
    const t = ev.target as HTMLElement | null;
    if (t?.closest?.('.osy-md__tmenu') || t?.closest?.('.osy-md__tgrip')) return;
    tableMenu.hidden = true;
  }, true);
  el.ownerDocument.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !tableMenu.hidden) { tableMenu.hidden = true; hideTableGrips(); }
  });

  tableGrips.addEventListener('mouseover', () => cancelGripHide());
  tableMenu.addEventListener('mouseover', () => cancelGripHide());

  richHost.addEventListener('mouseover', (ev) => {
    const target = ev.target as HTMLElement | null;
    const table = target?.closest?.('table') as HTMLElement | null;
    if (table) { cancelGripHide(); if (gripTable?.dom !== table) showTableGrips(table); return; }
    if (target?.closest?.('.osy-md__tgrips, .osy-md__tmenu')) { cancelGripHide(); return; }
    if (!tableGrips.hidden && tableMenu.hidden) scheduleGripHide();
  });

  // ── Find & replace ─────────────────────────────────────────────────────────────────────────────────────────────
  //
  // The editor holds the find ENGINE and no find UI at all. "Where is that word" is a question you ask of a document,
  // not of a rendering of one, so it works in BOTH views: in the rendered view it decorates matches and walks them,
  // in the source view it drives CodeMirror's own selection. One engine, two backends.
  //
  // What it does NOT own is the bar. The query and the replacement arrive as PROPS (they are state, and the
  // app owns the boxes), the verbs arrive as COMMANDS, and the match count leaves as an EVENT. So an app designs the
  // bar it wants — or none — and none of the matching moves.
  const findQuery = () => current.findQuery ?? '';
  const replaceValue = () => current.replaceWith ?? '';

  root.append(tableGrips, tableMenu);

  /** Re-run the search and repaint the count. The single place the bar's state is derived from the document. */
  function runFind(keepCurrent = false) {
    const query = findQuery();
    if (mode === 'raw') { runFindInSource(query, keepCurrent); return; }
    if (!view) return;
    const hits = findHits(view.state.doc, query);
    const prev = findKey.getState(view.state) ?? EMPTY_FIND;
    const current = keepCurrent ? Math.min(prev.current, Math.max(0, hits.length - 1)) : 0;
    view.dispatch(view.state.tr.setMeta(findKey, { query, hits, current }));
    paintFindCount(hits.length, hits.length ? current + 1 : 0);
    if (hits.length) revealHit(hits[current]);
  }

  /** Say how the search stands. The app renders it — "3/20", "none", a progress ring, nothing at all — because how
   *  a match count should LOOK is a presentation decision, and this control is not the one making it. */
  function paintFindCount(total: number, ordinal: number) {
    host.emit('matchesChanged', ordinal, total);
  }

  /** Scroll a match into view WITHOUT stealing the caret — the field keeps focus so you can keep typing. */
  function revealHit(hit: { from: number; to: number }) {
    if (!view) return;
    const dom = view.domAtPos(hit.from)?.node as HTMLElement | Text | undefined;
    const el2 = dom instanceof Text ? dom.parentElement : dom;
    el2?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function stepFind(delta: number) {
    if (mode === 'raw') { stepFindInSource(delta); return; }
    if (!view) return;
    const f = findKey.getState(view.state);
    if (!f?.hits.length) return;
    const current = (f.current + delta + f.hits.length) % f.hits.length;
    view.dispatch(view.state.tr.setMeta(findKey, { ...f, current }));
    paintFindCount(f.hits.length, current + 1);
    revealHit(f.hits[current]);
  }

  function doReplace(all: boolean) {
    if (current.readOnly) return;
    if (mode === 'raw') { replaceInSource(all); return; }
    if (!view) return;
    const f = findKey.getState(view.state);
    if (!f?.hits.length) return;
    const with_ = replaceValue();
    const tr = view.state.tr;
    // BACKWARDS, so an earlier replacement cannot invalidate the position of a later one.
    const targets = all ? [...f.hits].reverse() : [f.hits[f.current]];
    for (const h of targets) tr.insertText(with_, h.from, h.to);
    tr.setMeta(findKey, { ...f, current: 0 });
    view.dispatch(tr);
    // The plugin re-searched the new document as the transaction applied; read the result rather than guess it.
    const after = findKey.getState(view.state) ?? EMPTY_FIND;
    paintFindCount(after.hits.length, after.hits.length ? after.current + 1 : 0);
    say(all ? `replaced ${targets.length}` : 'replaced 1');
  }

  // ── the same two verbs against the SOURCE view ──────────────────────────────────────────────────────────────────
  let sourceHits: { from: number; to: number }[] = [];
  let sourceCurrent = 0;

  function runFindInSource(query: string, keepCurrent = false) {
    if (!cm) return;
    const text = cm.state.doc.toString().toLowerCase();
    const q = query.toLowerCase();
    sourceHits = [];
    if (q) { let i = text.indexOf(q); while (i !== -1) { sourceHits.push({ from: i, to: i + q.length }); i = text.indexOf(q, i + q.length); } }
    if (!keepCurrent || sourceCurrent >= sourceHits.length) sourceCurrent = 0;
    paintFindCount(sourceHits.length, sourceHits.length ? sourceCurrent + 1 : 0);
    revealSourceHit();
  }

  function stepFindInSource(delta: number) {
    if (!sourceHits.length) return;
    sourceCurrent = (sourceCurrent + delta + sourceHits.length) % sourceHits.length;
    paintFindCount(sourceHits.length, sourceCurrent + 1);
    revealSourceHit();
  }

  /** CodeMirror VIRTUALISES, so a match below the fold has no DOM to scroll to — its own `scrollIntoView` effect is
   *  the only thing that can reach it. */
  function revealSourceHit() {
    if (!cm || !sourceHits.length) return;
    const h = sourceHits[sourceCurrent];
    cm.dispatch({ selection: { anchor: h.from, head: h.to }, scrollIntoView: true });
  }

  function replaceInSource(all: boolean) {
    if (!cm || !sourceHits.length) return;
    const with_ = replaceValue();
    const targets = all ? sourceHits : [sourceHits[sourceCurrent]];
    cm.dispatch({ changes: targets.map((h) => ({ from: h.from, to: h.to, insert: with_ })) });
    say(all ? `replaced ${targets.length}` : 'replaced 1');
    runFindInSource(findQuery());
  }

  /** Cmd-F. There is no bar to open, so the editor says the user asked for one and hands over the selection —
   *  searching for what you just highlighted is the common case, and the app cannot see the selection itself. */
  function requestFind() {
    const selected = mode === 'raw'
      ? cm?.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to) ?? ''
      : view ? view.state.doc.textBetween(view.state.selection.from, view.state.selection.to) : '';
    host.emit('findRequested', selected.includes('\n') ? '' : selected);
  }

  /** Drop the search — highlights and count. The app calls this when it closes its bar. */
  function clearFind() {
    sourceHits = [];
    if (view && findKey.getState(view.state)?.hits.length) view.dispatch(view.state.tr.setMeta(findKey, EMPTY_FIND));
    host.emit('matchesChanged', 0, 0);
  }

  // Mod-F anywhere in the control, including from the source view, where ProseMirror's keymap never runs.
  root.addEventListener('keydown', (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'f' || ev.key === 'F')) {
      ev.preventDefault();
      requestFind();
    }
  });

  // ── The link popover ───────────────────────────────────────────────────────────────────────────────────────────
  //
  // Hover or click a link and it says where it goes, with the three verbs that apply: Open, Edit, Remove. This is
  // what makes a link both followable and editable — the two things a plain click has to choose between.
  //
  // It acts on the link's OWN range, not on the selection. The pointer is on a link the caret may be nowhere near,
  // so every verb selects that range first and then runs the same preset command the toolbar runs. Anything else
  // would edit whatever happened to be selected — which, when you pressed Remove on a link you were pointing at, is
  // the worst kind of wrong.
  const linkPop = el.ownerDocument.createElement('div');
  linkPop.className = 'osy-md__linkpop';
  linkPop.hidden = true;
  /** The link the popover is currently about: its mark range and href. */
  let linkPopAt: { from: number; to: number; href: string } | null = null;
  let linkPopHideTimer: ReturnType<typeof setTimeout> | null = null;
  let linkPopShowTimer: ReturnType<typeof setTimeout> | null = null;

  const linkPopUrl = el.ownerDocument.createElement('a');
  linkPopUrl.className = 'osy-md__linkpop-url';
  linkPopUrl.target = '_blank';
  linkPopUrl.rel = 'noopener noreferrer';
  const linkPopOpen = el.ownerDocument.createElement('button');
  linkPopOpen.type = 'button';
  linkPopOpen.className = 'osy-md__linkpop-btn';
  linkPopOpen.textContent = 'Open';
  const linkPopEdit = el.ownerDocument.createElement('button');
  linkPopEdit.type = 'button';
  linkPopEdit.className = 'osy-md__linkpop-btn';
  linkPopEdit.textContent = 'Edit';
  const linkPopRemove = el.ownerDocument.createElement('button');
  linkPopRemove.type = 'button';
  linkPopRemove.className = 'osy-md__linkpop-btn osy-md__linkpop-remove';
  linkPopRemove.textContent = 'Remove';
  const linkPopField = el.ownerDocument.createElement('input');
  linkPopField.type = 'text';
  linkPopField.className = 'osy-md__linkpop-field';
  linkPopField.placeholder = 'https://…';
  linkPopField.setAttribute('aria-label', 'Link address');
  const linkPopRow = el.ownerDocument.createElement('div');
  linkPopRow.className = 'osy-md__linkpop-row';
  linkPopRow.append(linkPopUrl, linkPopOpen, linkPopEdit, linkPopRemove);
  const linkPopEditRow = el.ownerDocument.createElement('div');
  linkPopEditRow.className = 'osy-md__linkpop-row osy-md__linkpop-editrow';
  linkPopEditRow.append(linkPopField);
  linkPop.append(linkPopRow, linkPopEditRow);

  /** Open a href, but only one whose scheme is safe to open. */
  function openHref(href: string) {
    if (!isSafeLinkHref(href)) return;
    el.ownerDocument.defaultView?.open(href, '_blank', 'noopener,noreferrer');
  }

  /** The full extent of the link mark around a position — the range every verb here acts on. */
  function linkRangeAt(pos: number): { from: number; to: number; href: string } | null {
    if (!view || !schema?.marks.link) return null;
    const $pos = view.state.doc.resolve(pos);
    const parent = $pos.parent;
    if (!parent.isTextblock) return null;
    const start = $pos.start();
    let found: { from: number; to: number; href: string } | null = null;
    parent.forEach((child: any, offset: number) => {
      if (found) return;
      const mark = child.marks?.find((m: any) => m.type === schema.marks.link);
      if (!mark) return;
      const from = start + offset;
      const to = from + child.nodeSize;
      if (pos >= from && pos <= to) found = { from, to, href: mark.attrs.href ?? '' };
    });
    return found;
  }

  /** Read-only still gets the popover — knowing where a link goes is a READING affordance. Edit and Remove hide
   *  themselves instead, below. */
  function showLinkPopover(pos: number, anchorEl: HTMLElement) {
    const range = linkRangeAt(pos);
    if (!range || !view) return;
    if (linkPopHideTimer) { clearTimeout(linkPopHideTimer); linkPopHideTimer = null; }
    linkPopAt = range;
    linkPopEditRow.dataset.on = 'false';
    linkPop.dataset.mode = 'view';
    linkPopUrl.textContent = range.href.length > 48 ? `${range.href.slice(0, 47)}…` : range.href;
    linkPopUrl.title = range.href;
    // A safe href gets a real anchor (middle-click, "copy link address" — the things people expect of a URL); an
    // unsafe one is shown as text only, so there is nothing to click and nothing to copy into a new tab.
    if (isSafeLinkHref(range.href)) linkPopUrl.href = range.href; else linkPopUrl.removeAttribute('href');
    linkPopOpen.hidden = !isSafeLinkHref(range.href);
    linkPopEdit.hidden = !!current.readOnly;
    linkPopRemove.hidden = !!current.readOnly;

    linkPop.hidden = false;
    // Positioned against the LINK, not the caret — it is about that link, and the caret may be elsewhere entirely.
    const r = anchorEl.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    const w = linkPop.offsetWidth;
    const viewportH = el.ownerDocument.documentElement.clientHeight;
    const below = r.bottom - rr.top + 6;
    const above = r.top - rr.top - linkPop.offsetHeight - 6;
    // Below the link normally; above it when that would fall off the bottom of the window.
    const top = (r.bottom + linkPop.offsetHeight + 12 > viewportH && r.top - linkPop.offsetHeight - 6 > 0) ? above : below;
    linkPop.style.top = `${top}px`;
    linkPop.style.left = `${Math.max(8, Math.min(r.left - rr.left, rr.width - w - 8))}px`;
  }

  function hideLinkPopover() {
    if (linkPopShowTimer) { clearTimeout(linkPopShowTimer); linkPopShowTimer = null; }
    linkPop.hidden = true;
    linkPop.dataset.mode = 'view';
    linkPopField.value = '';
    linkPopAt = null;
  }

  /** Put the selection over the popover's link, so the preset commands act on IT rather than on the caret. */
  function selectPopLink(): boolean {
    if (!view || !linkPopAt) return false;
    try {
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, linkPopAt.from, linkPopAt.to)));
      return true;
    } catch { return false; }
  }

  linkPopOpen.addEventListener('click', () => { const href = linkPopAt?.href ?? ''; hideLinkPopover(); openHref(href); });
  linkPopEdit.addEventListener('click', () => {
    if (!linkPopAt) return;
    linkPopField.value = linkPopAt.href;
    linkPop.dataset.mode = 'edit';
    requestAnimationFrame(() => { linkPopField.focus(); linkPopField.select(); });
  });
  linkPopRemove.addEventListener('click', () => {
    if (!cmdCtx || !selectPopLink()) return;
    view.focus();
    callCommand(toggleLinkCommand.key, {})(cmdCtx);   // toggleMark removes when the range already carries it
    hideLinkPopover();
  });
  linkPopField.addEventListener('keydown', (ev) => {
    ev.stopPropagation();
    if (ev.key === 'Escape') { ev.preventDefault(); hideLinkPopover(); view?.focus(); return; }
    if (ev.key !== 'Enter') return;
    ev.preventDefault();
    const href = linkPopField.value.trim();
    if (!cmdCtx || !selectPopLink()) return;
    view.focus();
    if (href) callCommand(updateLinkCommand.key, { href })(cmdCtx);
    else callCommand(toggleLinkCommand.key, {})(cmdCtx);
    hideLinkPopover();
  });
  // Moving the pointer INTO the popover must not dismiss it — that is the whole reason for the grace period below.
  linkPop.addEventListener('mouseenter', () => { if (linkPopHideTimer) { clearTimeout(linkPopHideTimer); linkPopHideTimer = null; } });
  linkPop.addEventListener('mouseleave', () => scheduleLinkPopHide());

  function scheduleLinkPopHide() {
    if (linkPopHideTimer) clearTimeout(linkPopHideTimer);
    // Long enough to cross the gap between the link and the popover, short enough not to linger.
    linkPopHideTimer = setTimeout(() => { if (linkPop.dataset.mode !== 'edit') hideLinkPopover(); }, 260);
  }

  richHost.addEventListener('mouseover', (ev) => {
    const anchor = (ev.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor) return;
    if (linkPopShowTimer) clearTimeout(linkPopShowTimer);
    if (linkPopHideTimer) { clearTimeout(linkPopHideTimer); linkPopHideTimer = null; }
    // A delay, because a pointer crossing a line of prose passes over links it is not interested in.
    linkPopShowTimer = setTimeout(() => {
      if (!view) return;
      // A live text selection means the selection toolbar is up and is the thing being used; two popovers over the
      // same words would fight each other.
      if (!view.state.selection.empty) return;
      const at = view.posAtDOM(anchor, 0);
      if (typeof at === 'number') showLinkPopover(at + 1, anchor);
    }, 350);
  });
  richHost.addEventListener('mouseout', (ev) => {
    const anchor = (ev.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!anchor) return;
    if (linkPopShowTimer) { clearTimeout(linkPopShowTimer); linkPopShowTimer = null; }
    scheduleLinkPopHide();
  });

  function mountSelToolbar() {
    root.append(linkPop);
    root.append(selEl);
    selProvider = new TooltipProvider({
      content: selEl,
      root: richHost,
      debounce: 0,
      offset: 8,
      // Without a padding the shift middleware parks the toolbar exactly ON the viewport edge at a phone width —
      // flush, shadow clipped, first button half off.
      shift: { padding: 8 },
      shouldShow: (v) => {
        if (current.readOnly || mode !== 'rich') return false;
        const { selection, doc } = v.state;
        if (!(selection instanceof TextSelection) || selection.empty) return false;
        // A selection that spans only node boundaries has no text to format.
        if (!doc.textBetween(selection.from, selection.to).length) return false;
        // Inside a code block NONE of these apply — code content takes no marks — so the toolbar would be five dead
        // buttons. The language badge is the affordance that belongs there.
        if (selection.$from.parent.type.spec.code) return false;
        // Focus is the editor's, OR one of our own controls' — the URL field takes focus and must not dismiss the
        // toolbar it lives in. (This is the stock provider's rule; a custom `shouldShow` replaces it wholesale.)
        if (!v.hasFocus() && !selEl.contains(el.ownerDocument.activeElement)) return false;
        renderSelToolbar(v.state);
        return true;
      },
    });
    // Any dismissal — a click elsewhere, a collapsed selection — abandons a half-typed URL rather than leaving it to
    // reappear against whatever is selected next.
    selProvider.onHide = () => closeLinkEditor();
  }

  // ── The block handle (⋮⋮ drag + ⋯ menu) ────────────────────────────────────────────────────────────────────────
  //
  // Milkdown's `plugin/block` supplies the hard half: it tracks which block the pointer is over and positions ONE
  // element beside it, wiring `draggable` and the whole drag-to-reorder protocol onto that element itself. What we
  // supply is the element, the menu, and the look — all of it from the app's tokens, so the handle belongs to the
  // app's design rather than arriving with one of its own.
  //
  // Every action goes through a ProseMirror TRANSACTION rather than touching the DOM, which is what makes a moved or
  // duplicated block behave like any other edit: it joins history, it flows through the section-identity tiers, and
  // it rides the next save. A duplicated heading is a genuinely NEW section — it cannot steal the original's id,
  // because tier 2 only reconsiders ids whose position mapping DIED, and the original's is still live.
  let blockProvider: BlockProvider | null = null;
  /** The last pointer Y over the document — the only coordinate the block plugin uses to pick the active block
   *  (it always probes the editor's horizontal centre). Kept so the handle can be re-derived after the doc changes. */
  let lastPointerY: number | null = null;
  /** Set around a block-menu dispatch: where that block landed, so the handle can follow it rather than the pointer.
   *  Undefined for every other transaction (typing, a drag-drop), which fall back to the pointer. */
  let pendingFollowPos: number | null | undefined;
  /** The last block the handle targeted on its own — the anchor a shift-click extends FROM. */
  let lastSingleTarget: BlockRange | null = null;
  /**
   * The block the handle last pointed at, recorded independently of the plugin.
   *
   * Needed because the plugin HIDES the handle on any keydown — and a shift-click begins with a keydown. By the time
   * the click arrives `blockProvider.active` is already null, so the chord could never extend anything if we asked
   * the plugin. The pointer has not moved, so the block it last showed is still the right answer.
   */
  let lastActiveBlock: { pos: number; node: any } | null = null;
  /** The editor ctx, kept so the menus and the selection toolbar can run a preset command outside an
   *  `editor.action` call. */
  let cmdCtx: any = null;
  /**
   * The last table cell the CARET was in. Remembered continuously, because clicking the block handle replaces the
   * selection with a NodeSelection on the table — so by the time the menu opens, the cell context its row/column
   * verbs need has already been destroyed by the very click that opened it.
   */
  let lastCaretCell: { tablePos: number; row: number; col: number } | null = null;

  /**
   * Re-place the block handle after the document changed under it.
   *
   * The plugin positions the handle only in response to a POINTER MOVE, and its `update()` is an initializer that
   * does nothing once it has run. So after any edit that reflows the document — turning a paragraph into a heading,
   * moving a block, or dropping a dragged one — the handle keeps the coordinates it had and ends up pointing at the
   * wrong block, or at nothing.
   *
   * Hide it at once so there is never a handle in the wrong place, then let the plugin recompute from the pointer's
   * real position. Re-deriving from the pointer (rather than tracking the moved node) is what makes this correct for
   * every case uniformly: after a DROP the pointer is over the block's new home, and after a menu action it is over
   * the margin, where the block at that height is exactly the one to offer.
   */
  function replaceBlockHandle(followPos?: number) {
    if (!blockProvider) return;
    blockProvider.hide();

    // Re-place by synthesizing a pointermove rather than calling `provider.show()` directly. `show()` only MOVES the
    // element — the service's notion of which block is active, which is what the menu acts on and what a drag picks
    // up, is updated only on the plugin's own path. Driving that path keeps the handle's POSITION and its TARGET the
    // same block; calling `show()` would leave a correctly-placed handle wired to the block that used to be there.
    const aim = () => {
      if (destroyed || !view) return;
      // Prefer the block we just acted on (`followPos`), so the handle stays with the thing you moved and you can
      // move it again — that is what the affordance implies. Fall back to the pointer when there is no such block
      // (a delete), or after a drag, where the pointer IS at the block's new home.
      let y: number | null = null;
      if (followPos != null) {
        const dom = view.nodeDOM(followPos);
        if (dom instanceof HTMLElement) {
          const r = dom.getBoundingClientRect();
          if (r.height > 0) y = r.top + Math.min(10, r.height / 2);
        }
      }
      y ??= lastPointerY;
      if (y == null) return;
      view.dom.dispatchEvent(new PointerEvent('pointermove', {
        clientX: view.dom.getBoundingClientRect().left + view.dom.clientWidth / 2,
        clientY: y, bubbles: true,
      }));
    };
    // The plugin THROTTLES pointermove (200ms), so an event sent immediately can be swallowed. Aim on the next frame
    // — once the DOM has reflowed, which is also when the moved block's new rect exists — and again past the window.
    requestAnimationFrame(aim);
    setTimeout(aim, 220);
  }

  /** Redraw the app-supplied block-menu entries. Set when the block handle mounts; null before that (the menu
   *  does not exist yet) and after destroy, so an `update` that arrives either side of the editor's life is a no-op
   *  rather than a throw. */
  let rebuildAppMenuItems: (() => void) | null = null;

  function mountBlockHandle(ctx: any) {
    const doc = el.ownerDocument;
    const handle = doc.createElement('div');
    handle.className = 'osy-md__handle';
    const menuBtn = doc.createElement('button');
    menuBtn.type = 'button';
    menuBtn.className = 'osy-md__handle-btn';
    menuBtn.setAttribute('aria-label', 'Block actions');
    menuBtn.title = 'Block actions';
    menuBtn.textContent = '⋯';
    const grip = doc.createElement('span');
    grip.className = 'osy-md__handle-grip';
    grip.title = 'Drag to move';
    grip.setAttribute('aria-hidden', 'true');
    grip.textContent = '⠿';
    handle.append(menuBtn, grip);

    const menu = doc.createElement('div');
    menu.className = 'osy-md__blockmenu';
    menu.hidden = true;
    const menuCount = doc.createElement('div');
    menuCount.className = 'osy-md__blockmenu-count';
    menuCount.hidden = true;
    menu.append(menuCount);
    // GROUPED, not a flat stack. "Heading 1" and "Move up" answer completely different questions — one changes what
    // the block IS, the other changes where it sits — and a single column of eight makes the reader work that out
    // from the wording each time. The labels do it once.
    const GROUPS: { label: string; items: { act: string; label: string }[] }[] = [
      { label: 'Turn into', items: [
        { act: 'h1', label: 'Heading 1' },
        { act: 'h2', label: 'Heading 2' },
        { act: 'h3', label: 'Heading 3' },
        { act: 'text', label: 'Text' },
        { act: 'bullet', label: 'Bullet list' },
        { act: 'ordered', label: 'Numbered list' },
        { act: 'task', label: 'Task list' },
        { act: 'quote', label: 'Quote' },
        { act: 'code', label: 'Code' },
      ] },
      { label: 'Actions', items: [
        { act: 'up', label: 'Move up' },
        { act: 'down', label: 'Move down' },
        { act: 'duplicate', label: 'Duplicate' },
        { act: 'delete', label: 'Delete' },
      ] },
    ];
    // Table editing — offered only when the handle is on a table, so the menu does not carry eight entries
    // that are meaningless for a paragraph. GFM tables ALWAYS have a header row (it is the syntax: the `---`
    // delimiter line defines it), so there is no "make this row the header" — the first row IS the header, and the
    // useful verb is moving a row up to it.
    const TABLE_GROUP: { label: string; items: { act: string; label: string }[] } = {
      label: 'Table', items: [
        { act: 'row-before', label: 'Insert row above' },
        { act: 'row-after', label: 'Insert row below' },
        { act: 'col-before', label: 'Insert column left' },
        { act: 'col-after', label: 'Insert column right' },
        { act: 'del-row', label: 'Delete row' },
        { act: 'del-col', label: 'Delete column' },
        { act: 'align-left', label: 'Align left' },
        { act: 'align-center', label: 'Align centre' },
        { act: 'align-right', label: 'Align right' },
      ],
    };

    // "Turn into" is hidden on a table: every entry there works on TEXTBLOCKS, and the only textblock inside a table
    // is a single cell's paragraph — so "Heading 1" would quietly turn one cell into a heading. A table's own verbs
    // are in its own group.
    const turnIntoEls: HTMLElement[] = [];
    for (const g of GROUPS) {
      const head = doc.createElement('div');
      head.className = 'osy-md__blockmenu-group';
      head.textContent = g.label;
      menu.append(head);
      if (g.label === 'Turn into') turnIntoEls.push(head);
      for (const it of g.items) {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'osy-md__blockmenu-item';
        b.dataset.act = it.act;
        b.textContent = it.label;
        menu.append(b);
        if (g.label === 'Turn into') turnIntoEls.push(b);
      }
    }
    const showTurnIntoItems = (on: boolean) => { for (const b of turnIntoEls) b.hidden = !on; };
    // Language, on a code block only. Same shape as the Table group: the block menu is where a block's OWN
    // properties live, so a second popover for this would be a second thing to learn for no gain.
    const langHead = doc.createElement('div');
    langHead.className = 'osy-md__blockmenu-group';
    langHead.textContent = 'Language';
    menu.append(langHead);
    const langButtons: HTMLElement[] = [langHead];
    for (const lang of CODE_LANGUAGES) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'osy-md__blockmenu-item';
      b.dataset.act = `lang:${lang}`;
      b.textContent = lang === '' ? 'Plain text' : lang;
      menu.append(b);
      langButtons.push(b);
    }
    const showLangItems = (on: boolean, currentLang: string) => {
      for (const b of langButtons) b.hidden = !on;
      for (const b of langButtons) {
        if (!(b instanceof HTMLButtonElement)) continue;
        const v = (b.dataset.act ?? '').slice('lang:'.length);
        b.dataset.current = String(v === currentLang);
      }
    };

    // Build the table group too; visibility is decided per-open.
    const tableHead = doc.createElement('div');
    tableHead.className = 'osy-md__blockmenu-group';
    tableHead.textContent = TABLE_GROUP.label;
    menu.append(tableHead);
    const tableButtons: HTMLElement[] = [tableHead];
    for (const it of TABLE_GROUP.items) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.className = 'osy-md__blockmenu-item';
      b.dataset.act = it.act;
      b.textContent = it.label;
      menu.append(b);
      tableButtons.push(b);
    }
    const showTableItems = (on: boolean) => { for (const b of tableButtons) b.hidden = !on; };

    // The APP's own entries, LAST. They are drawn here, with the editor's own item chrome, rather than by the
    // app: a menu has one look and one keyboard model, and app-rendered markup could join neither (roving focus does
    // not cross into a foreign subtree, and an app-styled row beside these would read as a different control). So the
    // app hands back VALUES — a label and a verb — and the editor draws them.
    //
    // Rebuilt whenever the prop changes, because an app may compute its entries from state ("Unpublish" when it is
    // published). Kept in their own section behind a rule: the editor cannot know what an app's verb DOES, and
    // presenting them as though they were its own would promise a consistency it cannot keep.
    let appItemEls: HTMLElement[] = [];
    const appSep = doc.createElement('div');
    appSep.className = 'osy-md__blockmenu-rule';
    appSep.hidden = true;
    menu.append(appSep);

    function rebuildAppItems() {
      for (const el2 of appItemEls) el2.remove();
      appItemEls = [];
      const entries = Array.isArray(current.extraItems) ? current.extraItems : [];
      appSep.hidden = entries.length === 0;
      for (const entry of entries) {
        // A malformed entry cannot reach here through a compiled app — the member is typed and the call site is
        // checked — but a control can be loaded by any caller, and a menu row that looks live and does nothing is
        // worse than no row. So it is skipped loudly rather than drawn dead.
        if (typeof entry?.Run !== 'function') {
          if (entry) console.warn('[osy-md] a menu entry has no verb to run; skipping', entry);
          continue;
        }
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'osy-md__blockmenu-item';
        b.dataset.app = 'true';
        b.textContent = String(entry.Label ?? '');
        b.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          closeMenu();
          entry.Run();
        });
        menu.append(b);
        appItemEls.push(b);
      }
    }

    rebuildAppMenuItems = rebuildAppItems;
    rebuildAppItems();

    root.append(menu);

    blockProvider = new BlockProvider({
      ctx,
      content: handle,
      // Align the handle with the TOP of its block, not its middle (floating-ui defaults to a centred "left").
      // Centring is fine for a one-line paragraph and wrong for anything tall: on a list item that contains a
      // sublist the handle lands ~35px down, beside the nested child, so the item you are actually hovering looks
      // like it has no handle at all. Aligning to the first line is also what makes it read as "this block's".
      getPlacement: () => 'left-start',
      // Nudge down by roughly half a line so it sits on the first line's optical centre rather than its very top.
      getOffset: () => ({ mainAxis: 8, crossAxis: 4 }),
      // Anchor every handle to the SAME gutter — the editor's content edge — instead of to each block's own left
      // edge. Aligning per block means an indented list item's handle is drawn 8px from ITS text, which puts it
      // inside the parent's column and reads as crowding the item rather than sitting beside it. `min` keeps a
      // top-level block (whose edge already IS the content edge) exactly where it was.
      getPosition: ({ active, editorDom }: any) => {
        const r = active.el.getBoundingClientRect();
        const e = editorDom.getBoundingClientRect();
        const padLeft = parseFloat(getComputedStyle(editorDom).paddingLeft) || 0;
        const left = Math.min(r.left, e.left + padLeft);
        return { top: r.top, bottom: r.bottom, left, right: left, width: 0, height: r.height, x: left, y: r.top };
      },
    });
    blockProvider.update();

    // Dragging with a run selected must move the RUN, not just the block under the handle. Both this and the
    // service's dragstart set `view.dragging`, and the LAST one registered wins — the service adds its own inside
    // the rAF that `update()` schedules, so this must be queued after that rAF, not run synchronously here.
    // Registered inline, it would silently lose: the drag would move one block out of the three.
    requestAnimationFrame(() => {
      if (destroyed) return;
      handle.addEventListener('dragstart', (ev: DragEvent) => {
        const r = currentRange();
        if (!r || !view || !ev.dataTransfer) return;
        // NO active-node check. While a run is selected the handle REPRESENTS the run, and asking the plugin which
        // block is active would undo that: its answer drifts with the pointer, so a few pixels of hand movement
        // between selecting and grabbing would move one block and leave the rest behind.
        const slice = view.state.doc.slice(r.from, r.to);
        // ProseMirror deletes the current SELECTION when completing a move-drop — not the slice it was handed. The
        // service left a NodeSelection on the single block under the handle, so without widening it the drop inserts
        // N blocks and removes 1, duplicating the rest. Select the whole run so the removal matches the insertion.
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, r.from, r.to)));
        const { dom, text } = view.serializeForClipboard(slice);
        ev.dataTransfer.clearData();
        ev.dataTransfer.setData('text/html', dom.innerHTML);
        ev.dataTransfer.setData('text/plain', text);
        view.dragging = { slice, move: true };
      });
    });

    // `show` is an instance property (an arrow assigned in the constructor), so wrapping it is a supported seam and
    // gives an exact, synchronous record of what the handle points at — see lastActiveBlock for why that matters.
    const providerShow = blockProvider.show.bind(blockProvider);
    blockProvider.show = (active: any) => {
      // STICKY WHILE A RUN IS SELECTED. Between selecting a run and grabbing the handle the pointer inevitably
      // drifts, and a drift of a few pixels re-targets the handle at a neighbouring block. The handle then still
      // looks like the selection's, but dragging it moves that ONE block — the run silently does not travel.
      // While a run is up the handle belongs to the run, and only clearing it hands the handle back to hover.
      const r = currentRange();
      if (r) {
        const pos = active.$pos.pos;
        if (pos < r.from || pos >= r.to) return;    // outside the run — leave the handle where it is
      }
      lastActiveBlock = { pos: active.$pos.pos, node: active.node };
      providerShow(active);
    };

    // The plugin picks the active block from the pointer's Y alone; remember it so an edit that reflows the document
    // can ask for the handle to be re-derived (replaceBlockHandle).
    //
    // `dragover`/`drop` are tracked as well as `pointermove`, and that is load-bearing rather than belt-and-braces:
    // an HTML5 drag fires NO pointermove, so through the whole drag the last pointer position stays wherever the
    // drag STARTED. Re-deriving from that after a drop puts the handle back at the block's old home — the very
    // staleness this is here to fix, and the case where it is most visible.
    for (const type of ['pointermove', 'dragover', 'drop']) {
      richHost.addEventListener(type, (ev: Event) => {
        const y = (ev as PointerEvent | DragEvent).clientY;
        if (typeof y === 'number' && y > 0) lastPointerY = y;
      }, { passive: true });
    }

    /** The block the handle is currently pointing at, captured when the menu opens (hovering elsewhere moves it). */
    let target: { pos: number; node: any } | null = null;

    function closeMenu() { menu.hidden = true; target = null; }

    // NB the mousedown must be allowed to REACH the handle. The service's mousedown is what creates the NodeSelection
    // that `dragstart` then hands to ProseMirror as `view.dragging`; swallow it and dragging from this half of the
    // handle silently does nothing — you drag, and the block never moves. A click on the menu button cannot start a
    // drag anyway: no dragstart fires without pointer movement.
    menuBtn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      if (!menu.hidden) { closeMenu(); return; }
      const active = blockProvider?.active ?? lastActiveBlock;
      if (!active || current.readOnly) return;

      // SHIFT (extend) and CMD/CTRL (add) both grow the run rather than opening the menu. Two chords for one
      // outcome because they are the two people reach for, and a run here is always contiguous — "add this block"
      // and "extend to this block" describe the same result, so there is no reason to make you pick the right one.
      const activePos = (active as any).$pos ? (active as any).$pos.pos : (active as any).pos;
      if (ev.shiftKey || ev.metaKey || ev.ctrlKey) { extendRangeTo(activePos, active.node); return; }

      // With a run selected the handle represents the RUN, so the menu acts on it regardless of which member the
      // handle is sitting on. Clearing the run (Escape, or a click in the document) hands the handle back to hover.
      const r = currentRange();
      if (r) {
        const first = view.state.doc.nodeAt(r.from);
        target = first ? { pos: r.from, node: first } : { pos: activePos, node: active.node };
      } else {
        target = { pos: activePos, node: active.node };
        lastSingleTarget = { from: target.pos, to: target.pos + target.node.nodeSize, depth: view.state.doc.resolve(target.pos).depth };
      }
      // An app-supplied entry runs AFTER the menu closes, so the block it acts on is remembered separately
      // from `target` (which closing clears).
      lastMenuTarget = target;

      // Say how many blocks this is about to act on, when it is more than the one you clicked.
      const span = actionSpan(target.pos, target.node);
      let count = 0;
      view.state.doc.nodesBetween(span.from, span.to, (n: any, pp: number) => {
        if (pp < span.from || pp + n.nodeSize > span.to) return true;
        if (view.state.doc.resolve(pp).depth !== span.depth) return true;
        count++; return false;
      });
      menuCount.hidden = count < 2;
      menuCount.textContent = count < 2 ? '' : `${count} blocks selected`;
      const isCode = target.node?.type?.name === 'code_block';
      showLangItems(isCode, String(target.node?.attrs?.language ?? '').trim());
      const isTable = target.node?.type?.name === 'table';
      showTableItems(isTable);
      showTurnIntoItems(!isTable);
      if (isTable) {
        // Deleting needs a row/column to mean; without a caret in this table there is none, and offering the verb
        // anyway would delete the header. Click into a cell first and they come back.
        const hasCell = caretCell(target.pos) !== null;
        for (const a of ['del-row', 'del-col']) {
          const btn = menu.querySelector(`[data-act="${a}"]`) as HTMLElement | null;
          if (btn) btn.hidden = !hasCell;
        }
      }

      // Open INTO THE MARGIN, to the left of the handle, so the menu never covers the block it is about to act on —
      // opening downwards puts it straight over the target's own second line. Falls back to below-the-handle only
      // when the margin is too narrow to hold it (a narrow window), where covering something is unavoidable.
      menu.hidden = false;
      const hr = handle.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      const w = menu.offsetWidth;
      const leftOfHandle = hr.left - rr.left - w - 6;
      const top = leftOfHandle >= 8 ? hr.top - rr.top : hr.bottom - rr.top + 4;
      const left = leftOfHandle >= 8
        ? leftOfHandle
        : Math.max(8, Math.min(hr.left - rr.left, rr.width - w - 8));
      // Keep it inside the VIEWPORT, not inside the control. The control is taller than the window (it fills the
      // page and scrolls internally), so clamping to its height let the menu open below the fold — which the
      // grouped menu, being taller, did at every window size. Coordinates here are root-relative, so the viewport
      // bound has to be converted through the root's own offset.
      const viewportH = el.ownerDocument.documentElement.clientHeight;
      const maxTop = viewportH - menu.offsetHeight - 8 - rr.top;
      const minTop = 8 - rr.top;
      menu.style.top = `${Math.max(minTop, Math.min(top, maxTop))}px`;
      menu.style.left = `${left}px`;
    });

    // Shift-clicking the grip extends the run as well: the two halves should not disagree about what shift means.
    grip.addEventListener('click', (ev) => {
      if (!ev.shiftKey && !ev.metaKey && !ev.ctrlKey) return;
      const active = blockProvider?.active ?? lastActiveBlock;
      if (!active || current.readOnly) return;
      ev.preventDefault(); ev.stopPropagation();
      extendRangeTo((active as any).$pos ? (active as any).$pos.pos : (active as any).pos, active.node);
    });

    menu.addEventListener('mousedown', (ev) => ev.preventDefault());   // keep the editor's selection intact
    menu.addEventListener('click', (ev) => {
      const act = (ev.target as HTMLElement | null)?.dataset?.act;
      if (!act || !target || !view) return;
      applyBlockAction(act, target.pos, target.node);
      closeMenu();
    });

    // Anywhere else closes it — including inside the document, where the next click is a caret placement.
    doc.addEventListener('mousedown', (ev) => {
      if (menu.hidden) return;
      if (menu.contains(ev.target as Node) || handle.contains(ev.target as Node)) return;
      closeMenu();
    }, true);
    doc.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { closeMenu(); setRange(null); } });
    // Clicking into the document is a return to writing — the run is no longer what you are working on. The handle
    // and its menu are EXCLUDED: the provider appends the handle inside richHost, so without this a shift-click on
    // the handle clears the very run it is trying to extend.
    richHost.addEventListener('mousedown', (ev: Event) => {
      const t = ev.target as Node | null;
      if (t && (handle.contains(t) || menu.contains(t))) return;
      if (currentRange()) setRange(null);
    });
  }

  const currentRange = (): BlockRange | null => (view ? blockRangeKey.getState(view.state) ?? null : null);

  function setRange(r: BlockRange | null) {
    if (!view) return;
    view.dispatch(view.state.tr.setMeta(blockRangeKey, r));
  }

  /** The span an action should act on: the selected RUN when the clicked block is part of it, else that block alone. */
  function actionSpan(pos: number, node: any): { from: number; to: number; depth: number } {
    const r = currentRange();
    if (r && pos >= r.from && pos < r.to) return r;
    return { from: pos, to: pos + node.nodeSize, depth: view.state.doc.resolve(pos).depth };
  }

  /**
   * Extend the selection to cover every sibling between the anchor and the block just clicked. Only blocks at the
   * SAME depth can form a run — "the three list items" and "the three paragraphs" are meaningful, "this list item
   * and that heading two levels up" is not, and refusing it is cheaper than defining what it would mean.
   */
  function extendRangeTo(pos: number, node: any) {
    if (!view) return;
    const doc = view.state.doc;
    const $new = doc.resolve(pos);
    const existing = currentRange();
    const anchor = existing ?? lastSingleTarget;
    if (!anchor) { setRange(null); return; }
    const $anchor = doc.resolve(anchor.from);
    if ($anchor.depth !== $new.depth || $anchor.parent !== $new.parent) { setRange(null); return; }

    const from = Math.min(anchor.from, pos);
    const to = Math.max(anchor.to, pos + node.nodeSize);
    setRange({ from, to, depth: $new.depth });
  }

  /** The block a COMMAND acts on. Set when the block menu opens and deliberately NOT cleared when it closes:
   *  an app-supplied entry closes the menu and then runs its verb, so a target that died with the menu would make
   *  every app entry a no-op — a menu row that looks live and does nothing. */
  let lastMenuTarget: { pos: number; node: any } | null = null;

  /** Run one of the built-in block actions on whatever a command should act on: the block the menu was opened on
   *  while that is still the same node, otherwise the block the caret is in (a command may be invoked from the app's
   *  own chrome, with no menu involved). Nothing to act on → nothing happens, rather than acting on a guess. */
  function runOnMenuTarget(act: string) {
    if (!view || current.readOnly) return;
    let t = lastMenuTarget && view.state.doc.nodeAt(lastMenuTarget.pos) === lastMenuTarget.node ? lastMenuTarget : null;
    if (!t) {
      const $from = view.state.selection.$from;
      if ($from.depth === 0) return;
      const pos = $from.before(1);
      const node = view.state.doc.nodeAt(pos);
      if (!node) return;
      t = { pos, node };
    }
    applyBlockAction(act, t.pos, t.node);
  }

  /**
   * Apply a block action as one transaction. `pos` is the block's own position (a NodeSelection position), so the
   * node spans [pos, pos + nodeSize) — the same addressing the drag protocol uses. When the block is part of a
   * selected run the action applies to the WHOLE run, which is the point of having one.
   */
  function applyBlockAction(act: string, pos: number, node: any) {
    if (!view || current.readOnly) return;
    const state = view.state;
    // The document may have moved under us between opening the menu and choosing an item; if the node is no longer
    // the one we captured, do nothing rather than edit the wrong block.
    if (state.doc.nodeAt(pos) !== node) return;


    // One block, or the whole selected run it belongs to.
    const { from, to, depth } = actionSpan(pos, node);
    const content = state.doc.slice(from, to).content;
    const tr = state.tr;
    // Where the run ends up, so the handle can follow it. Null = it is gone.
    let landedAt: number | null = from;

    if (act.startsWith('lang:')) {
      if (node.type.name !== 'code_block') return;
      // Dispatched directly rather than through the preset's updateCodeBlockLanguage command, which does not apply
      // from here. The command's whole body is this one line, so routing through it buys nothing and costs a layer
      // that can silently no-op — the opposite of the list/table verbs, where the preset does real work.
      view.dispatch(state.tr.setNodeAttribute(from, 'language', act.slice('lang:'.length)));
      replaceBlockHandle(from);
      return;
    }

    // TABLE actions go through the gfm preset's own commands, which operate on the CELL SELECTION rather than on a
    // node range. The block handle gives us a table, not a cell, so put the caret in the first cell first —
    // otherwise every one of these silently no-ops, which looks exactly like a broken menu.
    if (act.startsWith('row-') || act.startsWith('col-') || act.startsWith('del-') || act.startsWith('align-')) {
      if (!cmdCtx || node.type.name !== 'table') return;
      const at = caretCell(from);
      // EVERY one of these commands acts on the caret's cell — and the handle click that opened this menu replaced
      // the caret with a NodeSelection on the whole table. So the caret has to be put back into a cell first, or
      // they all silently no-op. Back where the user left it when we know, the first cell when we do not (where
      // "insert row below / column right" is still a defensible, visible result).
      const target = at ? cellPos(node, from, at.row, at.col) : firstCellPos(node, from);
      if (target == null) return;
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, target)));
      const cmd = {
        'row-before': addRowBeforeCommand, 'row-after': addRowAfterCommand,
        'col-before': addColBeforeCommand, 'col-after': addColAfterCommand,
      }[act];
      if (cmd) { callCommand(cmd.key)(cmdCtx); replaceBlockHandle(from); return; }
      if (act === 'del-row' || act === 'del-col') {
        // Only ever with a real caret cell — see caretCell for why a default index is destructive here.
        if (at === null) return;
        const sel = act === 'del-row' ? selectRowCommand : selectColCommand;
        callCommand(sel.key, { index: act === 'del-row' ? at.row : at.col })(cmdCtx);
        callCommand(deleteSelectedCellsCommand.key)(cmdCtx);
        replaceBlockHandle(from);
        return;
      }
      const dir = act.slice('align-'.length);
      callCommand(setAlignCommand.key, dir === 'centre' ? 'center' : dir)(cmdCtx);
      replaceBlockHandle(from);
      return;
    }

    // WRAPPING turn-into. Heading and Text are a `setNodeMarkup` on each textblock; a list, a quote and a code
    // block are not — they need the block range lifted, wrapped and re-joined with its neighbours. The presets do
    // exactly that already, and they act on the SELECTION, so the run is selected first and the command run on it.
    // Re-implementing the wrapping here would let this menu and the editor's own keybindings disagree about what
    // "bullet list" means, which is the one thing a second entry point must never do.
    if (TURN_INTO.has(act)) { turnInto(act, from, to, node); return; }

    switch (act) {
      case 'duplicate':
        tr.insert(to, content);
        break;
      case 'delete':
        tr.delete(from, to);
        landedAt = null;              // nothing left to point at — fall back to the pointer
        break;
      case 'up': {
        const $from = state.doc.resolve(from);
        const index = $from.index();
        if (index === 0) return;                                  // already first among its siblings
        const prevSize = $from.parent.child(index - 1).nodeSize;
        tr.delete(from, to);
        tr.insert(from - prevSize, content);
        landedAt = from - prevSize;
        break;
      }
      case 'down': {
        // Resolve at the run's END, not its start: for a multi-block run the start's next sibling is inside the run.
        const $to = state.doc.resolve(to);
        const nextIndex = $to.index();          // a position on a child boundary indexes the child AFTER it
        const parent = $to.parent;
        if (nextIndex >= parent.childCount) return;                // already last
        const nextSize = parent.child(nextIndex).nodeSize;
        tr.delete(from, to);
        tr.insert(from + nextSize, content);
        landedAt = from + nextSize;
        break;
      }
      default:
        return;
    }

    // The handle follows the block through the edit. `dispatch` runs replaceBlockHandle() via dispatchTransaction
    // (which has no idea where the block went), so record the destination for it to aim at first.
    if (tr.docChanged) { pendingFollowPos = landedAt; view.dispatch(tr); pendingFollowPos = undefined; }
  }

  /**
   * TURN INTO — make the block (or the selected run) BE the chosen kind.
   *
   * The rule that makes this coherent: **unwrap first, then apply**. Heading and Text are a `setNodeMarkup` on each
   * textblock, but a list, a quote and a code block are wrappers, and a wrapper reached by wrapping AGAIN gives you a
   * list inside a quote rather than a list. Worse, "Text" on a quoted paragraph is a no-op — the paragraph is already
   * a paragraph — so without the unwrap the menu would appear to do nothing at all.
   *
   * So every entry starts by lifting the run out of whatever it is in, and then applies exactly one thing. The wrap
   * itself is the PRESET's command, the same one the keyboard runs, so this menu cannot disagree with a shortcut.
   */
  function turnInto(act: string, from: number, to: number, node: any) {
    if (!view || !cmdCtx) return;

    // Task list is the one entry that TOGGLES, and it has to answer before the unwrap: a list that is already all
    // task items becomes a plain list again. Unwrapping first would turn "press it twice" into "no visible change".
    if (act === 'task' && (node?.type?.name === 'bullet_list' || node?.type?.name === 'ordered_list' || node?.type?.name === 'list_item')) {
      if (!selectSpan(from, to)) return;
      taskifySelection();
      replaceBlockHandle(from);
      return;
    }

    if (!selectSpan(from, to)) return;
    liftOutOfWrappers();

    if (act === 'h1' || act === 'h2' || act === 'h3' || act === 'text') {
      const st = view.state;
      const type = act === 'text' ? st.schema.nodes.paragraph : st.schema.nodes.heading;
      if (!type) return;
      // The selection is the source of truth now — the positions the menu was opened with describe a document that
      // the lift has already changed.
      const { from: sFrom, to: sTo } = st.selection;
      const targets: number[] = [];
      st.doc.nodesBetween(sFrom, sTo, (n: any, p: number) => {
        if (n.isTextblock) { targets.push(p); return false; }
        return true;
      });
      if (!targets.length) return;
      const tr = st.tr;
      // BACKWARDS, so each setNodeMarkup cannot invalidate the position of the one after it.
      for (const p of targets.reverse()) {
        const n = st.doc.nodeAt(p);
        if (n) tr.setNodeMarkup(p, type, act === 'text' ? {} : { ...n.attrs, level: Number(act.slice(1)) });
      }
      if (tr.docChanged) view.dispatch(tr);
      replaceBlockHandle(from);
      return;
    }

    // A RUN into a list is the one case the presets get wrong for us, and it is worth knowing why: `wrapInList`
    // wraps the whole block RANGE in a single list item, so two paragraphs came back as ONE bullet containing two
    // paragraphs. Every editor gives you two bullets, and so does every keyboard path — but there is no keyboard
    // path for "turn this run into a list" at all, so there is no preset behaviour to stay consistent with here.
    // One item per block, built in one transaction.
    if ((act === 'bullet' || act === 'ordered' || act === 'task') && buildListFromRun(act, from, to)) {
      replaceBlockHandle(from);
      return;
    }

    const cmd = {
      bullet: wrapInBulletListCommand, ordered: wrapInOrderedListCommand,
      quote: wrapInBlockquoteCommand, code: createCodeBlockCommand,
      task: wrapInBulletListCommand,
    }[act as 'bullet' | 'ordered' | 'quote' | 'code' | 'task'];
    if (!cmd) return;
    callCommand(cmd.key)(cmdCtx);
    if (act === 'task') taskifySelection(false);
    replaceBlockHandle(from);
  }

  /**
   * Replace a run of sibling TEXTBLOCKS with one list holding one item per block. Returns false when the run is a
   * single block, or holds anything that is not a textblock — both of which the preset command handles correctly and
   * this would only reimplement.
   *
   * A list item's content is `paragraph block*`, so a heading cannot simply be re-parented into one: its text moves
   * into a fresh paragraph, which is what "turn this heading into a list item" means anyway.
   */
  function buildListFromRun(act: 'bullet' | 'ordered' | 'task', from: number, to: number): boolean {
    if (!view) return false;
    const st = view.state;
    const depth = st.doc.resolve(from).depth;
    const blocks: any[] = [];
    st.doc.nodesBetween(from, to, (n: any, p: number) => {
      if (p < from || p + n.nodeSize > to) return true;
      if (st.doc.resolve(p).depth !== depth) return true;
      blocks.push(n);
      return false;
    });
    if (blocks.length < 2 || !blocks.every((n) => n.isTextblock)) return false;

    const itemType = st.schema.nodes.list_item;
    const listType = st.schema.nodes[act === 'ordered' ? 'ordered_list' : 'bullet_list'];
    const paragraph = st.schema.nodes.paragraph;
    if (!itemType || !listType || !paragraph) return false;

    const ordered = act === 'ordered';
    const items = blocks.map((n, i) => itemType.create(
      {
        label: ordered ? `${i + 1}.` : '•',
        listType: ordered ? 'ordered' : 'bullet',
        spread: false,
        ...(act === 'task' ? { checked: false } : {}),
      },
      n.type === paragraph ? n : paragraph.create(null, n.content, n.marks),
    ));
    try {
      view.dispatch(st.tr.replaceWith(from, to, listType.create({ spread: false }, items)));
    } catch { return false; }
    return true;
  }

  /**
   * Put a TEXT selection over a block run. The handle click left a NodeSelection on the block, and every wrapping
   * command works from a text selection — without this they all silently decline, which looks exactly like a broken
   * menu. `between` on the INNER edges, so it lands inside the first and last textblock rather than on a boundary.
   */
  function selectSpan(from: number, to: number): boolean {
    if (!view) return false;
    try {
      const st = view.state;
      view.dispatch(st.tr.setSelection(TextSelection.between(
        st.doc.resolve(Math.min(from + 1, st.doc.content.size)),
        st.doc.resolve(Math.max(0, to - 1)))));
      return true;
    } catch { return false; }
  }

  /**
   * Lift the selection out of any quote or list it sits in, one level at a time.
   *
   * Bounded, and stops the moment a step changes nothing: a command that declines (there is nothing left to lift out
   * of, or the structure will not allow it) must end the loop rather than spin against an unchanging document.
   */
  function liftOutOfWrappers(maxSteps = 6) {
    if (!view || !cmdCtx) return;
    for (let step = 0; step < maxSteps; step++) {
      const $from = view.state.selection.$from;
      const parent = $from.depth > 0 ? $from.node(-1) : null;
      const kind = parent?.type.name;
      if (kind !== 'list_item' && kind !== 'blockquote') return;
      const before = view.state.doc;
      // liftListItem knows how to split a list around the item it removes; a plain lift does not.
      if (kind === 'list_item') callCommand(liftListItemCommand.key)(cmdCtx);
      else lift(view.state, view.dispatch);
      if (view.state.doc === before) return;
    }
  }

  /** Record the caret's table cell whenever it is in one; a NodeSelection (a handle click) leaves the last one. */
  function rememberCaretCell(state: any) {
    const sel = state.selection;
    if (!(sel instanceof TextSelection)) return;
    const $pos = sel.$from;
    for (let d = $pos.depth; d > 0; d--) {
      if ($pos.node(d).type.name !== 'table') continue;
      if ($pos.depth >= d + 2) { lastCaretCell = { tablePos: $pos.before(d), row: $pos.index(d), col: $pos.index(d + 1) }; return; }
    }
    lastCaretCell = null;   // the caret is somewhere that is not a table cell
  }

  /**
   * Which cell of `tablePos`'s table the caret is in, as (row, column) indices — what the row/column commands need.
   * Null when the caret is not inside this table, which is the case that has to be handled rather than guessed:
   * every one of these commands acts on the CARET, and `selectRow` defaults to index 0, so "delete row" with no
   * caret context silently destroys the HEADER row instead of the one the user meant.
   */
  function caretCell(tablePos: number): { row: number; col: number } | null {
    if (!view) return null;
    // Prefer the LIVE caret; fall back to the remembered one, which is what survives the handle's own click.
    rememberCaretCell(view.state);
    const c = lastCaretCell;
    return c && c.tablePos === tablePos ? { row: c.row, col: c.col } : null;
  }

  /** The content position inside cell (row, col) of a table, so the caret can be put back where the user left it. */
  function cellPos(table: any, tablePos: number, row: number, col: number): number | null {
    const rowNode = table.maybeChild(row);
    if (!rowNode) return null;
    let offset = tablePos + 1;                       // into the table
    for (let r = 0; r < row; r++) offset += table.child(r).nodeSize;
    let inRow = offset + 1;                          // into the row
    for (let c = 0; c < col; c++) {
      const cell = rowNode.maybeChild(c);
      if (!cell) return null;
      inRow += cell.nodeSize;
    }
    return inRow + 1;                                // into the cell
  }

  /** The position of a table's first cell content, so a cell-scoped command has something to act on. */
  function firstCellPos(table: any, tablePos: number): number | null {
    let found: number | null = null;
    table.descendants((n: any, offset: number) => {
      if (found !== null) return false;
      if (n.type.name === 'table_cell' || n.type.name === 'table_header') {
        found = tablePos + 1 + offset + 1;   // +1 into the table, +1 into the cell
        return false;
      }
      return true;
    });
    return found;
  }

  /**
   * Toggle a GFM task item when its checkbox is clicked.
   *
   * The box is CSS-drawn in the item's left gutter, so there is no element to bind to — the hit test is "did this
   * click land in the gutter of a task item". Toggling goes through a ProseMirror transaction rather than touching
   * the DOM, so the change is part of the document, lands in history, and flows into the next save like any edit.
   */
  richHost.addEventListener('mousedown', (ev: MouseEvent) => {
    if (!view || current.readOnly) return;
    const li = (ev.target as HTMLElement | null)?.closest?.('li[data-item-type="task"]') as HTMLElement | null;
    if (!li) return;
    const rect = li.getBoundingClientRect();
    const gutter = parseFloat(getComputedStyle(li).paddingLeft) || 28;
    if (ev.clientX - rect.left > gutter) return;   // a click on the TEXT is an ordinary caret placement
    ev.preventDefault();

    const $pos = view.state.doc.resolve(view.posAtDOM(li, 0));
    for (let d = $pos.depth; d > 0; d--) {
      const node = $pos.node(d);
      if (node.type.name !== 'list_item') continue;
      view.dispatch(view.state.tr.setNodeMarkup($pos.before(d), undefined, { ...node.attrs, checked: !node.attrs.checked }));
      break;
    }
  });

  applyPlaceholder();
  modeBtn.addEventListener('click', () => { if (!view) return; mode === 'rich' ? toRaw() : toRich(); });
  densityBtn.addEventListener('click', () => {
    current = { ...current, density: current.density === 'compact' ? 'comfortable' : 'compact' };
    applyDensity();
    say(`density: ${current.density}`);
  });
  faceBtn.addEventListener('click', () => {
    faceIndex = (faceIndex + 1) % FACES.length;
    root.setAttribute('data-face', FACES[faceIndex]);
    say(`typeface: ${FACES[faceIndex]}`);
  });
  saveBtn.addEventListener('click', () => { if (mode === 'raw') toRich(); void save(); });

  return {
    ready: boot,
    // The verbs declared in `markdown.osy`. The platform checks these are present when it takes this handle, and
    // routes an app's `onClick: c.FindNext` to them.
    commands: {
      findNext: () => stepFind(1),
      findPrev: () => stepFind(-1),
      replaceOne: () => doReplace(false),
      replaceAll: () => doReplace(true),
      clearFind: () => clearFind(),
      // The two BLOCK verbs an app can put in the menu beside its own. They run the very same code the
      // editor's own "Delete" and "Heading 2" items run, so an app-supplied entry and the built-in one cannot drift.
      // Both act on the block the menu was opened on (or the whole selected run, exactly as the built-ins do).
      deleteBlock: () => runOnMenuTarget('delete'),
      turnIntoHeading: (level: number) => runOnMenuTarget(`h${Math.max(1, Math.min(3, Number(level) || 1))}`),
    },
    // The `probe { }` block declared in `markdown.osy`: what is true INSIDE this editor right now, so an app's
    // tests can assert it. Read LIVE on every call, never cached: a probe is what is true at the instant it is asked,
    // and a value captured at mount would be a fact that stopped being true minutes ago.
    //
    // Non-perturbing by construction — every read below is a plain state read. Nothing dispatches a transaction,
    // moves the selection or triggers a save, because a probe that changed what it was measuring would prove nothing.
    probe() {
      // Both views are real: the rich view is ProseMirror and the source view is CodeMirror, and the search runs in
      // whichever is showing. Reporting only one would answer correctly in rich mode and lie in source mode.
      const rich = view ? findKey.getState(view.state) : null;
      const matches = mode === 'raw' ? sourceHits.length : rich?.hits.length ?? 0;
      const current1 = mode === 'raw'
        ? (sourceHits.length ? sourceCurrent + 1 : 0)
        : (rich?.hits.length ? rich.current + 1 : 0);
      const selected = mode === 'raw'
        ? cm?.state.sliceDoc(cm.state.selection.main.from, cm.state.selection.main.to) ?? ''
        : view ? view.state.doc.textBetween(view.state.selection.from, view.state.selection.to) : '';
      return {
        dirty,
        matches,
        currentMatch: current1,
        // An EMPTY selection is "nothing is highlighted", which is a different statement from "the empty string was
        // selected" — a caret in a document selects nothing at all. Reported as null so the two stay apart.
        selection: selected.length > 0 ? selected : null,
        // The rail's labels, so a test can assert what a reader is offered — including a heading's maths, which
        // `textContent` would drop. Null when hidden or empty, which are both "nothing is listed".
        outline: current.outline && view ? (outlineEntries().map(e => e.text).join('\n') || null) : null,
      };
    },
    update(next: Props) {
      const wasReadOnly = current.readOnly;
      current = { ...current, ...next };
      if (next.density !== undefined) applyDensity();
      // Both of these change whether a prompt should be showing: the text itself, and `readOnly` (a prompt invites
      // typing, so a document turned read-only must stop offering one).
      if (next.placeholder !== undefined || next.readOnly !== undefined) applyPlaceholder();
      if (next.readOnly !== undefined) applySaveVisibility();
      // An app may compute its entries from its own state, so a changed list redraws them. `undefined` means
      // the app did not send this prop on this update, which is not the same as sending an empty list.
      if (next.extraItems !== undefined) rebuildAppMenuItems?.();
      // The search re-runs when the app's box changes — the query is a prop, so typing in the app's Input IS the
      // search. `keepCurrent` is deliberately false: a changed query starts at the first match, as any find does.
      if (next.findQuery !== undefined) runFind();
      if (next.outline !== undefined) { applyOutlineVisibility(); buildOutline(); }
      if (next.face && FACES.includes(next.face)) {
        faceIndex = FACES.indexOf(next.face);
        root.setAttribute('data-face', next.face);
      }
      // A readOnly flip has to reach the live view; ProseMirror re-reads `editable` on the next transaction.
      if (view && wasReadOnly !== current.readOnly) view.dispatch(view.state.tr);
    },
    destroy() {
      destroyed = true;
      appSlotInstance?.destroy();
      if (saveTimer) clearTimeout(saveTimer);
      if (outlineTimer) clearTimeout(outlineTimer);
      // The provider appends its handle to the editor's parent, so it outlives a naive replaceChildren.
      blockProvider?.destroy(); blockProvider = null;
      slashProvider?.destroy(); slashProvider = null;
      selProvider?.destroy(); selProvider = null;
      cm?.destroy(); cm = null;
      view?.destroy?.();
      el.replaceChildren();
    },
  };
}
