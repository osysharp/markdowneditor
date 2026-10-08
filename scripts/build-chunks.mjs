// Build this control's CHUNK assets from the installed packages — the parts a document only pays for if it uses them.
//
// A chunk comes in two shapes, and which one an asset wants is decided by whether it loads anything of its own:
//
//   Math     — ONE FILE. temml.mjs bundled to a single ESM module (esbuild --bundle); temml has no deps.
//   MathCss  — ONE FILE. Temml-Local.css with its FONT INLINED as a data: URI.
//   Diagrams — a PACKAGE. mermaid loads its diagram engines itself, at run time, by relative path.
//
// A single-file chunk is served at its own content address with no directory around it, so registration refuses a
// relative specifier inside one — it would have nothing to resolve against. A package chunk is served under a real
// base, so those specifiers resolve exactly as they do on a static host. Bundling to escape the first case is what
// the second one exists to stop being necessary.
//
// The font is the subtle part. `Temml-Local.css` is the variant that renders through fonts the OS already has
// (Cambria Math / STIX Two / Noto Math), which is why Temml is used rather than KaTeX — KaTeX ships 296 KB of
// webfonts whose stylesheet names them by RELATIVE url, which a chunk cannot resolve. But Temml-Local.css is not
// entirely font-free: it carries ONE `@font-face` with `url('Temml.woff2')`, a 9 KB clone of KaTeX_Script-Regular
// remapped to the Unicode Mathematical Script Capitals (1D49C–1D4B5) — i.e. `\mathscr{A}`.
//
// Inlining that one font as base64 costs ~12.5 KB and buys a chunk with no URL in it at all — no second request, no
// resolution problem, and no need for the app to `osy font add` a face just to get script capitals. Dropping the
// @font-face instead would silently render `\mathscr{A}` in the wrong glyphs, which is the kind of degradation that
// looks like a rendering bug rather than a missing asset.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, '..');
const dist = join(app, 'node_modules', 'temml', 'dist');
// Straight into the directory the chunks are PINNED at, so there is exactly one temml.js in the tree — building
// anywhere else leaves a second copy of a 207 KB asset and an unanswerable question about which one is real. In a
// KIT that directory is the kit root itself: the kit's own `osyrin.lock` pins `temml.js`, not `model/controls/`.
const out = app;
mkdirSync(out, { recursive: true });

// ── Math: one self-contained ESM module ──────────────────────────────────────────────────────────────────────
const esbuild = join(app, 'node_modules', '.bin', 'esbuild');
execFileSync(esbuild, [
  join(dist, 'temml.mjs'),
  '--bundle', '--format=esm', '--minify',
  `--outfile=${join(out, 'temml.js')}`,
], { stdio: 'inherit' });

// ── MathCss: the local-font stylesheet, with its one webfont inlined ──────────────────────────────────────────
const css = readFileSync(join(dist, 'Temml-Local.css'), 'utf8');
const woff2 = readFileSync(join(dist, 'Temml.woff2')).toString('base64');
const inlined = css.replace(
  "url('Temml.woff2') format('woff2')",
  `url(data:font/woff2;base64,${woff2}) format('woff2')`);

// Fail LOUD rather than ship a stylesheet with a URL that will 404 from a content-addressed origin. A silent miss
// here degrades to wrong glyphs for `\mathscr`, which reads as a Temml bug and is not one.
if (inlined === css) throw new Error('Temml-Local.css: the @font-face url did not match — check the package version');

// Scan for a url() that would leave the origin. Data URIs must come OUT FIRST, because this stylesheet embeds an
// inline SVG whose own markup contains `marker-end='url(%23a)'` — a FRAGMENT reference (`#a`) into that same SVG.
// A naive scan reads those two as external and fails a build that is perfectly self-contained; enumerating the
// forms of the target is the only reliable way to write a text scan like this.
const withoutData = inlined
  .replace(/url\((["'])data:[\s\S]*?\1\)/g, '')   // quoted   — may contain ')' inside the payload
  .replace(/url\(data:[^)]*\)/g, '');             // unquoted — the font we just inlined
const leftover = [...withoutData.matchAll(/url\(\s*(['"]?)([^)'"]+)\1\s*\)/g)]
  .map((m) => m[2].trim())
  .filter((u) => !u.startsWith('#'));             // a fragment stays inside the document
if (leftover.length) throw new Error(`chunk CSS still references external url(): ${leftover.join(', ')}`);

writeFileSync(join(out, 'temml.css'), inlined);

// ── Diagrams: mermaid as a PACKAGE chunk ────────────────────────────────────────────────────────────────────────
//
// NOT one bundled file, and the difference is large. `mermaid.esm.min.mjs` is a 29 KB entry that lazy-imports its
// diagram implementations by RELATIVE path. Flattening it with `--bundle` gives ONE 3.44 MB module — every parser,
// dagre, cytoscape and d3 — which the browser downloads in full the first time any document contains any diagram.
//
// With `--splitting` the same input becomes a 28.7 KB entry plus ~100 sibling chunks (3.6 MB on disk), and a
// document pays for the entry plus only the chunks its own diagram type reaches. Those relative imports resolve
// because a package chunk is served under a real base — which is what package chunks are for.
//
// `--outdir` and NOT node_modules: `node_modules/mermaid/dist` is 83 MB across 1167 files (three build flavours and
// a full .d.ts tree). `osy control add --chunk-package` refuses a node_modules path by name for exactly this reason.
const diagramsDir = join(out, 'diagrams');
rmSync(diagramsDir, { recursive: true, force: true });   // a package is its WHOLE file set — never merge a stale build
execFileSync(esbuild, [
  join(app, 'node_modules', 'mermaid', 'dist', 'mermaid.esm.min.mjs'),
  '--bundle', '--format=esm', '--minify', '--splitting',
  `--outdir=${diagramsDir}`,
], { stdio: 'inherit' });

const kb = (p) => (readFileSync(p).length / 1024).toFixed(1);
console.log(`Math     ${kb(join(out, 'temml.js'))} KB  (temml.js)`);
console.log(`MathCss  ${kb(join(out, 'temml.css'))} KB  (temml.css, font inlined)`);
const files = readdirSync(diagramsDir);
const totalKb = files.reduce((n, f) => n + statSync(join(diagramsDir, f)).size, 0) / 1024;
console.log(`Diagrams ${totalKb.toFixed(1)} KB across ${files.length} files  (diagrams/, `
  + `entry ${kb(join(diagramsDir, 'mermaid.esm.min.js'))} KB)`);
