/**
 * Diagrams for the MarkdownEditor: a ```mermaid fence renders as a diagram, and stays editable.
 *
 * WHY THIS NEEDS NO SCHEMA NODE, WHERE MATH DID. `$…$` is not GFM, so math had to become a ProseMirror node or the
 * serializer would corrupt it (`$a_1$` → `$a\_1$`, which is a literal underscore to LaTeX). A ```mermaid fence
 * is ALREADY a GFM fenced code block with an info string. It parses, serializes and round-trips through the existing
 * commonmark schema untouched, including a diagram body containing `a_1` and `*not emphasis*`. So this file adds a
 * NODE VIEW — how an existing node is drawn — and touches neither the parser nor the serializer.
 *
 * WHY THE SOURCE STAYS VISIBLE. This is an editor, so a fence whose source were replaced by its picture could not be
 * corrected. The view is the code block PLUS a rendered panel: `contentDOM` is the ordinary `<pre><code>`, which keeps
 * the code-highlighting decorations and every editing gesture working, and the diagram is drawn beneath it. A failed
 * render therefore degrades to exactly what the document already showed — the fence — which is the same rule
 * `MathView` follows and the reason neither can lose content it cannot draw.
 *
 * Mermaid arrives from a PACKAGE chunk, not a bundled file: it loads its own diagram engines at run time by
 * relative path, so a flattened bundle would hand every document with a flowchart the cytoscape and gantt engines
 * too — 3.4 MB rather than a 28 KB entry plus what the diagram actually reaches.
 */

/** Everything this module needs from the control host — narrower than the real `Host`, so the view is testable. */
export interface DiagramHost {
  chunkUrl(name: string): string;
}

interface MermaidApi {
  initialize(config: unknown): void;
  render(id: string, text: string): Promise<{ svg: string }>;
}

let mermaidChunk: Promise<MermaidApi> | null = null;

/**
 * Load mermaid once per page and configure it.
 *
 * `securityLevel: 'strict'` is not a default worth inheriting silently — it is the reason this is safe at all. A
 * document is CONTENT and an agent may have written it, so the diagram source is untrusted input; strict encodes HTML
 * in diagram text and disables mermaid's `click` directive, which would otherwise let a fence bind a handler that
 * calls into the page. It is the rule the platform's own markdown rendering follows — document text never becomes
 * raw HTML — applied where a third-party renderer would otherwise decide it for us.
 */
function loadMermaid(host: DiagramHost, theme: ThemeSnapshot): Promise<MermaidApi> {
  if (mermaidChunk) return mermaidChunk;
  mermaidChunk = import(/* @vite-ignore */ host.chunkUrl('Diagrams'))
    .then((m: any) => {
      const mermaid: MermaidApi = m.default ?? m;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', ...themeConfig(theme) });
      return mermaid;
    });
  return mermaidChunk;
}

/** The size a diagram's labels are measured AND painted at. One constant, quoted in the mermaid config and in the
 *  stylesheet's `[data-mermaid-render]` rule — two places that must agree, so neither may invent a number. Slightly
 *  under the prose size, because a diagram reads as an inset figure rather than as running text. */
export const DIAGRAM_FONT_PX = 15;

/** The app's look, resolved to concrete colours — what mermaid needs, since it BAKES styles into the SVG. */
export interface ThemeSnapshot {
  surface: string;
  onSurface: string;
  border: string;
  muted: string;
  primary: string;
  container: string;
  font: string;
}

/**
 * Read the app's tokens as RESOLVED colours, by measuring rather than by parsing.
 *
 * A token's value is routinely `color-mix(in oklch, …)` or `oklch(from …)`, and mermaid manipulates the colours it
 * is given (lightening, darkening, computing contrast), which those spellings break. Reading
 * `getPropertyValue('--colors-border')` hands back the token TEXT, unresolved.
 *
 * So: set each token as the `color` of a hidden probe inside the diagram's own element and read it back computed.
 * The browser resolves the whole `var()` chain, the colour space and the app's overrides, and what comes out is
 * always a plain `rgb(...)`. It also picks up the CASCADE at this element, which matters for the container colour
 * below and is not something any parse of the stylesheet could know.
 */
export function readTheme(el: HTMLElement): ThemeSnapshot {
  const probe = document.createElement('span');
  probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden';
  el.appendChild(probe);
  const resolve = (expr: string, fallback: string): string => {
    probe.style.color = '';
    probe.style.color = expr;
    const value = getComputedStyle(probe).color;
    return value && value !== 'rgba(0, 0, 0, 0)' ? value : fallback;
  };
  const snapshot: ThemeSnapshot = {
    surface: resolve('var(--colors-surface)', '#ffffff'),
    onSurface: resolve('var(--colors-onsurface)', '#16181d'),
    border: resolve('var(--colors-border)', '#e6e4de'),
    muted: resolve('var(--colors-muted)', '#f0eee8'),
    primary: resolve('var(--colors-primary)', '#4f46e5'),
    // The CONTAINER's own background, not the page's. Getting this wrong is invisible in light mode (where the code
    // block and the surface are nearly the same) and paints every edge label in a dark chip in dark mode — which is
    // why this is measured off the element rather than taken from the app's background token.
    container: getComputedStyle(el).backgroundColor || '#ffffff',
    font: getComputedStyle(el).fontFamily,
  };
  probe.remove();
  return snapshot;
}

/**
 * The app's tokens as mermaid theme variables.
 *
 * `theme: 'base'` rather than one of the shipped themes, because a shipped theme is another product's opinion about
 * colour and would sit inside the app's page looking like an import. What makes the result read as designed rather
 * than as a toy is the node FILL: mermaid's default fills every node with the accent, so a diagram of ten states is
 * ten accent-coloured boxes. Here a node is a quiet `muted` with a hairline border, and the accent is spent only
 * where a diagram's own `classDef` asks for it — on meaning, never on decoration.
 */
export function themeConfig(t: ThemeSnapshot): Record<string, unknown> {
  return {
    theme: 'base',
    themeVariables: {
      fontFamily: t.font,
      // PIN THE SIZE, on both sides of mermaid's own measurement.
      //
      // Mermaid sizes each node by measuring its label and writes that width into the SVG as a `foreignObject`,
      // which CLIPS. When the box it measures is a few pixels narrower than the label as painted, "Approved" loses
      // its final letter — which reads as a mistake in the diagram SOURCE.
      // The cause is that it measures against its configured size and paints through inherited CSS, so any gap
      // between the two becomes clipping. Naming the size here, and again in the stylesheet for the figure, closes
      // that gap by making both sides quote the same number.
      fontSize: `${DIAGRAM_FONT_PX}px`,
      background: t.container,
      primaryColor: t.muted,
      primaryTextColor: t.onSurface,
      primaryBorderColor: t.border,
      secondaryColor: t.surface,
      tertiaryColor: t.surface,
      lineColor: t.border,
      textColor: t.onSurface,
      mainBkg: t.muted,
      nodeBorder: t.border,
      clusterBkg: t.surface,
      clusterBorder: t.border,
      // Follows the CONTAINER — see readTheme.
      edgeLabelBackground: t.container,
      titleColor: t.onSurface,
      labelBoxBkgColor: t.surface,
      labelBoxBorderColor: t.border,
    },
  };
}

/** Every live view, so a theme change can re-render them. Module-level because the trigger is page-wide. */
const liveViews = new Set<{ retheme(): void }>();
let themeWatcher: (() => void) | null = null;

/**
 * Re-render every diagram when the app's look changes.
 *
 * Mermaid bakes its colours into the SVG at GENERATION time, so a dark-mode switch is a re-render and not a restyle —
 * there is no stylesheet to re-cascade over an SVG whose fills are attributes. Two triggers, because an app may
 * switch either way: the OS preference, and a class or attribute on the document element (which is how an in-app
 * toggle does it). Both are debounced into one pass, since a theme switch commonly fires both.
 */
function watchTheme(): void {
  if (themeWatcher) return;
  let pending: ReturnType<typeof setTimeout> | null = null;
  const bump = () => {
    if (pending) clearTimeout(pending);
    pending = setTimeout(() => { pending = null; for (const v of liveViews) v.retheme(); }, 50);
  };
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', bump);
  const observer = new MutationObserver(bump);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style', 'data-theme'] });
  themeWatcher = () => { media.removeEventListener('change', bump); observer.disconnect(); };
}

/** A monotonic id per rendered diagram. Mermaid needs a unique one; it puts it in the SVG's own element ids. */
let renderSeq = 0;

/**
 * The node view for a ```mermaid fence: the editable source, plus the picture it describes.
 *
 * Kept deliberately independent of ProseMirror's types (structural, not imported) so the module can be reasoned
 * about — and tested — without an editor.
 */
export class DiagramView {
  readonly dom: HTMLElement;
  readonly contentDOM: HTMLElement;
  private readonly figure: HTMLElement;
  private source: string;
  private disposed = false;
  private renderToken = 0;

  constructor(node: { textContent: string }, private readonly host: DiagramHost) {
    this.source = node.textContent ?? '';

    this.dom = document.createElement('div');
    this.dom.setAttribute('data-mermaid-block', '');

    // The ordinary code block, unchanged. Keeping the real `<pre><code>` is what preserves the language badge, the
    // highlighting decorations, selection, and every keystroke — a node view that replaced it would have to
    // re-implement all of them, and would get them subtly wrong.
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    pre.appendChild(code);
    this.contentDOM = code;

    this.figure = document.createElement('div');
    this.figure.setAttribute('data-mermaid-render', '');
    this.figure.setAttribute('data-mermaid-state', 'pending');
    // Not editable and not part of the document: this element is a RENDERING of the text above it, so a caret must
    // never land in it and ProseMirror must never read it back as content.
    this.figure.contentEditable = 'false';

    this.dom.append(pre, this.figure);

    liveViews.add(this);
    watchTheme();
    void this.draw();
  }

  /** Re-render at the current theme — the whole diagram, because the colours are inside the SVG. */
  retheme(): void {
    // A theme change invalidates the CONFIGURED mermaid instance too, not just the output: `initialize` is what
    // carries the palette, and it runs once per page inside the chunk loader.
    mermaidChunk = null;
    void this.draw();
  }

  private async draw(): Promise<void> {
    const token = ++this.renderToken;
    const text = this.source.trim();
    if (!text) {
      // An empty fence is not a failure — it is a diagram someone is about to write. Say nothing rather than
      // showing an error for a state the author is passing through on their way to a valid one.
      this.figure.replaceChildren();
      this.figure.setAttribute('data-mermaid-state', 'empty');
      return;
    }
    try {
      const theme = readTheme(this.dom);
      // WAIT FOR THE FONTS. Mermaid sizes every node by MEASURING its label, then writes those widths into the SVG
      // as geometry — so measuring with the fallback face and painting with the app's own produces boxes that are
      // subtly too small, and a longer label is CLIPPED. It renders as a typo ("Approved" losing its last letter),
      // which reads as a mistake in the diagram SOURCE rather than a timing one. `fonts.ready` resolves immediately
      // once the faces are in, so this costs nothing after the first diagram on a page.
      await document.fonts?.ready;
      const mermaid = await loadMermaid(this.host, theme);
      if (this.disposed || token !== this.renderToken) return;   // destroyed, or edited while the chunk was in flight
      const { svg } = await mermaid.render(`osy-mermaid-${++renderSeq}`, text);
      if (this.disposed || token !== this.renderToken) return;

      // `svg` is mermaid's own output, produced under securityLevel 'strict' (which encodes HTML in diagram text and
      // disables the click directive), so the untrusted part of the input has already been neutralised by the
      // renderer whose job that is. Parsed as SVG rather than assigned as innerHTML so nothing here re-enters the
      // HTML parser, and any <script> the parse yields is dropped rather than adopted.
      const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const root = parsed.documentElement;
      if (parsed.querySelector('parsererror') || root.nodeName.toLowerCase() !== 'svg') {
        throw new Error('the diagram renderer returned something that is not an SVG');
      }
      for (const script of root.querySelectorAll('script')) script.remove();
      this.figure.replaceChildren(document.importNode(root, true));
      this.figure.setAttribute('data-mermaid-state', 'ok');
      this.figure.removeAttribute('data-mermaid-error');
    } catch (err) {
      if (this.disposed || token !== this.renderToken) return;
      // The SOURCE is already on screen above this, so a failure loses nothing — which is the argument for keeping
      // it visible. What is shown here is the REASON, because a diagram that silently does not appear is
      // indistinguishable from one whose syntax is being typed, and the author cannot tell which they are looking at.
      this.figure.replaceChildren();
      this.figure.setAttribute('data-mermaid-state', 'error');
      this.figure.setAttribute('data-mermaid-error', (err as Error).message);
      const note = document.createElement('p');
      note.className = 'osy-md-diagram-error';
      note.textContent = (err as Error).message;
      this.figure.appendChild(note);
    }
  }

  /** ProseMirror re-uses this view while the node is still a mermaid fence; anything else forces a rebuild. */
  update(node: { type: { name: string }; attrs: Record<string, unknown>; textContent: string }): boolean {
    if (node.type.name !== 'code_block') return false;
    if (!isMermaid(node.attrs.language)) return false;
    const next = node.textContent ?? '';
    if (next === this.source) return true;
    this.source = next;
    void this.draw();
    return true;
  }

  /** Mermaid writes an SVG into `figure`, which is OUTSIDE contentDOM — so those mutations are ours, not edits.
   *  Without this, ProseMirror re-reads the node from its rendered DOM and the fence loses its text. */
  ignoreMutation(mutation: { target: Node }): boolean {
    return this.figure === mutation.target || this.figure.contains(mutation.target);
  }

  destroy(): void {
    this.disposed = true;
    liveViews.delete(this);
  }
}

/** Whether a fence's info string names mermaid. Case-insensitive and trimmed, because an info string is free text
 *  an author types — and a ```Mermaid fence that silently stays a code block is a bug report nobody can diagnose. */
export function isMermaid(language: unknown): boolean {
  return String(language ?? '').trim().toLowerCase() === 'mermaid';
}
