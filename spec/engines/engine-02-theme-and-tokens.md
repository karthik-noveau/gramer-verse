# Engine 02 — Theme and Tokens

> Band A — foundation. One responsibility: **the colour, type and spacing tokens, plus the Tamil webfont**

---

## Objective

Port `ui-prototypes/assets/css/tokens.css` into `src/theme/` as the single source of colour, typography and spacing, and ship a subset Tamil webfont so Tamil text renders correctly on devices without a system Tamil family.

---

## Scope

**Theme: paper & green on a neutral ground.** Accent `#2f6f4f` light, `#7dc4a0`
dark, marking the changed word, the active chip and the primary button — nothing
decorative.

The page background must stay **neutral** (`#e9edeb`, cast −2), not cream. The
scene props are warm, and a warm page behind them flattens both. Do not restore a
cream background, and do not set `--bg` to pure white: `--surface` is white and
needs real separation from `--bg` or cards stop reading as raised. `#fafaf9` was
tried and rejected — 1.04 against white is a difference the eye cannot see, and
the page read as one flat sheet. The ground is 1.18 below white, and raised
surfaces carry a shadow as well.

**In scope**

- `theme/colours.css` — every custom property from the prototype's tokens, light and dark, with the verified contrast ratio recorded beside each text colour
- **The role palette.** One colour per grammatical job, used identically in the drawing, the picture-words, every sentence line and the word-order diagram. For a learner with no English the colour *is* the explanation — it is the only thing tying the picture to the words, so these are not decorative and must not be re-picked per component:

  | Token | Job | Tamil |
  |---|---|---|
  | `--r-figure` | the thing | பொருள் |
  | `--r-ground` | the place | இடம் |
  | `--r-rel` | the relation | தொடர்பு |
  | `--r-det` | which one | எது |
  | `--r-be` | is / are | வினை |
  | `--r-qual` | how it is or happens | எப்படி |
  | `--r-ask` | the question word | வினா |
  | `--r-join` | the joiner | இணைப்பு |

  The first five are the scene's own and are taught by the legend. The last three exist only in the word-order diagram, for the tables it reaches beyond the scene — an adjective or adverb, a question word, a conjunction. Ratios are recorded against `--bg`, the worst of the three grounds they appear on.
- `--fm-bg` — the opened word-order panel. It is a large flat block inside a white table, and only has to separate from the row above it; the tinted value tried first competed with the drawings beside it
- `theme/fonts.css` — the three font stacks, the type scale, and the `@font-face` for the Tamil subset
- `theme/overrides.css` — reset, document defaults, `[hidden]`, focus-visible, `.sr-only`
- The Tamil subset webfont in `src/assets/fonts/`, with its licence recorded
- `[lang="ta"]` sizing rule — Tamil renders at 1.06em because its glyphs read small at the same pixel value

**Out of scope**

- Any component styling — engine 03
- The app shell layout — engine 04

---

## Dependencies

Engine 01.

---

## Files to create

```text
src/theme/colours.css
src/theme/fonts.css
src/theme/overrides.css
src/assets/fonts/<tamil-subset>.woff2
src/assets/fonts/LICENCE.md
```

## Files to modify

`src/App.tsx` — import the three theme files, in the order colours → fonts → overrides.

---

## Implementation steps

1. Copy every custom property from `ui-prototypes/assets/css/tokens.css` into `colours.css`. **Light is the default and does not follow `prefers-color-scheme`** — dark lives under `:root[data-theme="dark"]` and is reached only through the toggle. Set `color-scheme` on both so native controls and scrollbars follow.
2. Move the font stacks, the `--fs-*` scale and the `--s-*` spacing scale into `fonts.css`. Keep spacing with type deliberately — they are one rhythm.
3. **Resolve open question 1 in `architecture.md`.** Choose one Tamil family, subset it to the glyphs the content uses, convert to `woff2`, and record the licence in `LICENCE.md`. An unlicensed font is a blocker, not a detail.
4. Declare `@font-face` with `font-display: swap` and add a `<link rel="preload">` for it in `index.html`.
5. Port the reset and document defaults from `base.css` into `overrides.css`, including `[hidden] { display: none !important; }` — without it, any component that sets its own `display` ignores the `hidden` attribute.
6. Add the `[lang="ta"]` rule setting the Tamil stack, `font-size: 1.06em` and `line-height: 1.75`.
7. Import all three from `App.tsx` and verify both colour schemes by toggling the OS setting.

---

## Acceptance criteria

- Every colour in the app resolves to a custom property in `colours.css`; a grep for hex literals outside that file returns nothing
- Every text token clears WCAG AA (4.5:1) against its own background in **both** schemes — assert this in a test, do not eyeball it
- `--accent` appears only on the changed word, the active chip and the primary button
- `--bg` is neutral (red and blue channels within 2 points) and keeps ≥1.04 separation from `--surface`
- Light and dark both render correctly, and `data-theme` on the root element overrides the system preference in both directions
- Tamil renders in the shipped webfont on a device with no system Tamil family
- `prefers-reduced-motion` zeroes the three duration tokens
- The font licence is recorded and permits redistribution

---

## Edge cases

- Tamil has combining glyphs; an over-aggressive subset drops them and words render with visible boxes. Subset by the actual content strings, not by a Unicode range guess.
- `font-display: swap` causes a visible reflow when the Tamil font loads. Size the fallback stack to match so the swap does not move the sentence line.
- A `[hidden]` rule without `!important` loses to any component `display` rule — this exact bug was found and fixed in the prototype.
- Dark mode must not simply invert: the drawing props use fixed illustrative colours (wood, brick) that stay constant across schemes while the surface behind them changes.

---

## Validation checklist

- [ ] Folder structure matches `codebase-guide.md`
- [ ] File and folder naming follows the convention
- [ ] Import order correct; no unused imports; no circular imports
- [ ] No cross-page imports
- [ ] Zustand: one domain per file, derived values computed not stored
- [ ] Components never read JSON directly — always through `common/api`
- [ ] CSS Modules only; every colour from `theme/colours.css`
- [ ] Accessibility: semantic HTML, keyboard support, visible focus, ARIA
- [ ] Error handling: loading, empty, error and success states all present
- [ ] Performance: no needless re-renders, expensive work memoised
- [ ] Documentation updated where behaviour changed
- [ ] Tests written and passing

---

## Test cases

- `theme.test.ts` — asserts every token named in the prototype exists in the built CSS
- `contrast.test.ts` — computes the ratio for every text token against its background in both schemes and fails below 4.5:1
- Visual check against `ui-prototypes/pages/components.html`, colour and type sections

---

## Completion checklist

- [ ] Implementation complete
- [ ] Acceptance criteria satisfied
- [ ] `npm run build` passes
- [ ] TypeScript passes with zero errors
- [ ] `npm run lint` passes with zero warnings
- [ ] `npm test` passes
- [ ] No `any`, `console.log`, `debugger`, TODO, FIXME, dead code or unused files
- [ ] `engine-status.md` updated to Complete
- [ ] `engine-status.md` updated; next engine started
