# Engine 22 — Landing Page

> Band E — pages. One responsibility: **the route `/`, the branded front door**

---

## Objective

Build the home screen from `ui-prototypes/index.html`. It is the only route that does **not** render inside `AppShell` — no sidebar, no topic nav, no breadcrumbs. It carries the brand and one clear way in, and its pitch is a working scene rather than a screenshot.

---

## Scope

**In scope**

- Its own brand bar and footer, outside `AppShell`: mark, wordmark, theme toggle, "Open the app"
- The brand mark as an inline SVG so it can read the theme's custom properties
- Hero with the bilingual tagline and one call to action
- A live `Stage` rendering the ball-in-box scene
- The three-move band — predict, reveal, turn the knobs — one line each, no worked example
- One call to action, `Start`, going to `/topics`. The same destination as "Open the app" in the bar

**Out of scope**

- A second demonstration under the hero. The hero is the product running; anything below it is a caption, not a repeat
- Any list of topics. The eyebrow quotes the topic and lesson counts from content; the names themselves are one click away, and `/topics` is the page that renders them
- A brand identity band. The mark, palette, type and voice live in `theme-lab.html` and `components.html`
- Marketing analytics of any kind

---

## Dependencies

Engines 01–05, 16.

---

## Files to create

```text
src/pages/landing/{index.tsx,styles.module.css}
src/pages/landing/index.test.tsx
```

## Files to modify

`src/pages/landing/index.tsx` — replace the engine 05 placeholder.

---

## Implementation steps

1. Register `/` as a route **outside** the `AppShell` layout route, since the home screen has its own chrome. This is the one exception to the shell and must be explicit in `routes.ts`.
2. Port the layout and copy from the prototype, both languages.
3. Extract the brand mark into `common/components/BrandMark` as inline SVG, and use it in both the home screen and the app header so the two can never drift.
4. Render the hero scene through `Stage`, with the preposition knobs live. It cycles on its own until the visitor touches a knob, so it proves the engine works without asking them to do anything, and rewards them if they do. Honour `prefers-reduced-motion`: no cycling.
5. Read the topic and lesson counts from `content.store` for the eyebrow, so the one number the page quotes cannot drift from the real topic list.
4. Handle the content loading state: the eyebrow count waits, the hero scene does not depend on content and renders immediately.
5. Check the layout at all five widths, especially the hero collapsing to one column below 900px.

---

## Acceptance criteria

- Matches the prototype at every breakpoint
- The hero scene renders through the real engine
- The eyebrow counts come from content, not a hardcoded number
- Both languages present throughout
- The hero renders before content finishes loading

---

## Edge cases

- Unknown id renders the empty state with a way back — not a redirect, so the bad URL stays visible.
- The hero must not wait on content — a blank hero during load defeats the purpose of the page.

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

- Renders the hero and its single call to action
- The eyebrow renders the topic and lesson counts from the store
- The hero scene renders while content is still loading
- Bilingual text present in hero and cards

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
