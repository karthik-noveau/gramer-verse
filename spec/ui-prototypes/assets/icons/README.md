# Icons

The prototype uses unicode glyphs inline (☰ ✎ ◔ ▣ 🔔 ◐) so it stays dependency-free
and works from `file://`.

In the React app these become SVG files here, imported through `src/assets/icons/`
and named `kebab-case.svg` per the codebase guide. One icon per file, no sprite
sheet, no icon font.

Needed at engine 03:
menu, close, chevron-left, chevron-right, check, alert, search, book, pencil,
moon, sun, grid.

Dropped as the product narrowed: `bell` and `user` (no account, no
notifications), `settings` (no settings page), `chart` (no progress).
