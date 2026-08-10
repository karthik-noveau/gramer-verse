# Engine 03 — Common UI Components

> Band A — foundation. One responsibility: **the fifteen reusable components, each matching the prototype gallery**

---

## Objective

Build every reusable presentational component in `common/components/`, matching `ui-prototypes/pages/components.html` exactly. Presentation only — no component here knows what a lesson is.

---

## Scope

**In scope**

- `Button`, `Chip`, `Badge`, `Card`, `Table`, `Tabs`, `Dialog`, `Drawer`, `Dropdown`, `Toast`, `Spinner`, `EmptyState`, `ErrorState`, `Breadcrumbs`, `BilingualText`
- One folder per component: `Component.tsx`, `Component.test.tsx`, `styles.module.css`
- Full keyboard support and ARIA on every interactive component
- The SVG icon set listed in `ui-prototypes/assets/icons/README.md`

**Out of scope**

- The app shell that arranges them — engine 04
- `CannotDraw`, which is product-specific and belongs to engine 26
- Any component that reads a store or an API

---

## Dependencies

Engines 01, 02.

---

## Files to create

```text
src/common/components/Button/{Button.tsx,Button.test.tsx,styles.module.css}
src/common/components/Chip/…  Badge/…  Card/…  Table/…  Tabs/…
src/common/components/Dialog/…  Drawer/…  Dropdown/…  Toast/…
src/common/components/Spinner/…  EmptyState/…  ErrorState/…
src/common/components/Breadcrumbs/…  BilingualText/…
src/common/components/Icon/…
src/common/hooks/useFocusTrap.ts
src/common/utils/classNames.ts
src/assets/icons/*.svg
```

Two additions to what this engine originally listed:

- **`Icon`.** The icon set had no way to be used. An `<img>` cannot take
  `currentColor`, so it cannot follow the text beside it into dark mode, and
  inlining the markup would mean shipping artwork inside the JS bundle and
  injecting raw HTML to render it. `Icon` renders a block of `currentColor`
  masked by the SVG file — the files stay on disk, one per icon, and they tint.
- **`classNames`.** Named in `architecture.md` §2.2 already. Fifteen private
  copies of `[a, b].filter(Boolean).join(' ')` is fifteen places to get it
  subtly wrong.

## Files to modify

None.

---

## Implementation steps

1. Build `BilingualText` first — it is used by nearly every other component. Props: `en`, `ta`, `as` and `inline`. It emits `lang="en"` and `lang="ta"` and refuses to render with an empty `ta`, because a silent English-only fallback is exactly the failure mode the product cannot have.
2. Build the primitives: `Button`, `Chip`, `Badge`, `Card`, `Spinner`. Port variants and sizes from `components.css`.
3. Build `Table` with sortable headers (`aria-sort`), a sticky head and a horizontally scrollable wrapper. Wide content scrolls inside its own container; the page body never scrolls sideways.
4. Build the overlays: `Dialog`, `Drawer`, `Dropdown`, `Toast`. Each closes on Escape; `Dropdown` also closes on outside click. Write `useFocusTrap` and use it in `Dialog` and `Drawer`.
5. Build the state components: `EmptyState`, `ErrorState`. `ErrorState` takes a `detail` prop and renders it as `<code>` — it must be able to name the file and the failing rule.
6. Build `Tabs` with roving tabindex and arrow-key navigation between tabs.
7. Convert the prototype's unicode glyphs to SVG files in `src/assets/icons/`, one per file, kebab-case.
8. Compare each component side by side with `components.html` and reconcile any difference in the prototype's favour.

---

## Acceptance criteria

- Every component in the gallery exists with the same variants and states
- No component exceeds 200 lines; no function exceeds 60
- Dialog and Drawer trap focus, restore it on close, and close on Escape
- Tabs are operable entirely by keyboard
- `BilingualText` renders both languages with correct `lang` attributes
- Every component has a passing test file beside it

---

## Edge cases

- `Toast` must not steal focus — it is `aria-live="polite"`, not a dialog.
- `Dropdown` closing on outside click must not swallow the click that opened it.
- A `Table` with one very long Tamil cell must scroll its wrapper, not stretch the page.
- Focus restoration after `Dialog` close fails silently when the trigger has unmounted; fall back to the page heading.
- `BilingualText` with an empty `ta` should throw in development and render the English with a visible marker in production — never fail silently.

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

- Per component: renders, applies variants, respects `disabled`
- `Dialog` — traps focus, closes on Escape, restores focus to the trigger
- `Dropdown` — closes on outside click and on Escape
- `Tabs` — arrow keys move selection and update `aria-selected`
- `BilingualText` — emits both `lang` attributes; throws on empty `ta`
- `Table` — clicking a sortable header toggles `aria-sort`

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
