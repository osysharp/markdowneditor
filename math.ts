/**
 * Math for the MarkdownEditor: `$…$` inline and `$$…$$` display.
 *
 * WHY THIS IS A SCHEMA NODE AND NOT A DECORATION. Rendering `$…$` over plain text would have been much less code,
 * and it silently corrupts documents. Markdown's escaper does not know the text is math, so `$a_1 + a_2$`
 * serializes to `$a\_1 + a\_2$` — `_` is emphasis syntax to markdown, and `\_` is a literal underscore to LaTeX, not
 * a subscript. The damage lands on SAVE and only becomes visible on the next open.
 *
 * A node makes the math OPAQUE: its content is an attribute, never a text node, so nothing escapes it and the
 * serializer writes back exactly the characters the author typed.
 *
 * The delimiters are `$`/`$$` and not `\(…\)`, and that is not a matter of taste: markdown consumes the
 * backslash escape before math sees it, so `\(x^2\)` round-trips to `(x^2)`. `$` is also what agents write.
 *
 * Rendering is TEMML, loaded lazily from a control CHUNK — see `renderMath` in markdown.ts. This module is only the
 * document model: parse, serialize, and the ProseMirror nodes. It has no opinion about who draws the result, which
 * is what keeps the round-trip guarantee testable without a browser.
 */
import { $node, $remark } from '@milkdown/kit/utils';
import remarkMath from 'remark-math';

/**
 * remark-math gives us BOTH directions: a micromark extension that produces mdast `inlineMath`/`math` nodes, and
 * (via mdast-util-math) the toMarkdown handlers that write them back out with their `$` delimiters. We rely on the
 * parse half and drive the write half ourselves through the node runners below, so the exact output shape is ours.
 */
export const remarkMathPlugin = $remark('math', () => remarkMath);

/**
 * PRICES ARE NOT FORMULAE.
 *
 * remark-math accepts any `$…$`, so "It costs $5 and $10 together." parses as inline math with the value `5 and `.
 * That is the classic hazard of choosing `$`, and it is invisible to a round-trip test: serializing that math node
 * writes `$5 and $10 together.` straight back, byte-identical to the input. The TEXT survives while the document
 * MODEL is wrong — so the document renders a formula where the author wrote a price.
 *
 * The remedy is GitHub's rule, which exists for exactly this and is worth stating rather than citing:
 *   · the opening `$` must not be followed by whitespace, and the closing `$` must not be preceded by it —
 *     `$5 and $` has a space before its closer, so it is not math;
 *   · the closing `$` must not be followed by a digit — `$5-$10` has `1` after its closer, so neither is it.
 * Both are about the DELIMITERS, not the content, so legitimate math with spaces inside (`$a + b$`) is untouched.
 *
 * A rejected node becomes the literal text it was written as, delimiters included, which is what the author meant.
 */
export const remarkMathGuard = $remark('mathGuard', () => function (this: any) {
  // mdast-util-math marks `$` UNSAFE in phrasing, so remark escapes every dollar in ordinary text: "It costs $5"
  // serializes to "It costs \$5". That escape exists because an unescaped `$…$` would re-parse as math — which the
  // guard below prevents, so the escape is pure churn. And churn is not cosmetic here: it changes the bytes of a
  // section, which changes its content hash, re-triggers indexing, and shows an agent a phantom edit on a document
  // nobody touched. Every price in every document, on every save.
  //
  // Dropping it is safe in the direction that matters — text this parser will NOT read back as math needs no
  // escaping — and it converges: an author's explicit `\$` normalises to `$` once and is then a fixed point.
  const exts = this.data('toMarkdownExtensions') as any[] | undefined;
  if (Array.isArray(exts))
    for (const ext of exts)
      if (Array.isArray(ext?.unsafe)) ext.unsafe = ext.unsafe.filter((u: any) => u?.character !== '$');

  return (tree: any, file: any) => {
  const src = String(file?.value ?? '');

  const walk = (node: any): void => {
    if (!Array.isArray(node.children)) return;
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i];
      if (child?.type === 'inlineMath') {
        const value: string = child.value ?? '';
        // The character just past the closing `$`. Absent at end-of-input, which is fine — nothing follows it.
        const after = src.slice(child.position?.end?.offset ?? src.length).charAt(0);
        const bad = value.length === 0 || /^\s|\s$/.test(value) || /[0-9]/.test(after);
        if (bad) node.children[i] = { type: 'text', value: `$${value}$`, position: child.position };
        continue;
      }
      walk(child);
    }
  };

  walk(tree);
  };
});

/** `$…$` — an inline atom. `value` is the LaTeX, verbatim. */
export const mathInlineNode = $node('math_inline', () => ({
  group: 'inline',
  inline: true,
  atom: true,
  // Selectable so a click lands ON the formula rather than inside a text node that does not exist; not draggable,
  // because dragging an inline atom out of its paragraph is a gesture with no sensible drop target here.
  selectable: true,
  draggable: false,
  attrs: { value: { default: '' } },
  parseDOM: [{
    tag: 'span[data-math-inline]',
    getAttrs: (dom: any) => ({ value: dom.getAttribute('data-value') ?? '' }),
  }],
  // The DOM here is the FALLBACK — the source text in a tagged span. The Temml render replaces its children once
  // the chunk resolves (markdown.ts). Keeping the raw LaTeX in an attribute means a copy, a paste, or a save that
  // happens before the chunk lands still carries the real content.
  toDOM: (node: any) => ['span', { 'data-math-inline': '', 'data-value': node.attrs.value }, node.attrs.value],
  parseMarkdown: {
    match: (node: any) => node.type === 'inlineMath',
    runner: (state: any, node: any, type: any) => { state.addNode(type, { value: node.value ?? '' }); },
  },
  toMarkdown: {
    match: (node: any) => node.type.name === 'math_inline',
    runner: (state: any, node: any) => { state.addNode('inlineMath', undefined, node.attrs.value); },
  },
}));

/** `$$…$$` — a block atom. */
export const mathBlockNode = $node('math_block', () => ({
  group: 'block',
  atom: true,
  selectable: true,
  draggable: false,
  attrs: { value: { default: '' } },
  parseDOM: [{
    tag: 'div[data-math-block]',
    getAttrs: (dom: any) => ({ value: dom.getAttribute('data-value') ?? '' }),
  }],
  toDOM: (node: any) => ['div', { 'data-math-block': '', 'data-value': node.attrs.value }, node.attrs.value],
  parseMarkdown: {
    match: (node: any) => node.type === 'math',
    runner: (state: any, node: any, type: any) => { state.addNode(type, { value: node.value ?? '' }); },
  },
  toMarkdown: {
    match: (node: any) => node.type.name === 'math_block',
    runner: (state: any, node: any) => { state.addNode('math', undefined, node.attrs.value); },
  },
}));

// Order matters: the guard runs AFTER remark-math, over the tree it produced.
export const math = [remarkMathPlugin, remarkMathGuard, mathInlineNode, mathBlockNode].flat();
