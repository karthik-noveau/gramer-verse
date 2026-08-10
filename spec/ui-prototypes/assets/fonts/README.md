# Fonts

The prototype uses the system Tamil stack — `Noto Sans Tamil`, `Nirmala UI`,
`Latha` — declared in `assets/css/tokens.css` as `--tamil`.

The React app must ship a subset webfont instead, because the system stack is not
present on every device and Tamil rendering silently degrades to boxes.

Required before engine 02 completes:
- one Tamil family, subset to the glyphs the content actually uses
- `font-display: swap`, preloaded on the shell
- the licence recorded here

This is open question 1 in `architecture.md`.
