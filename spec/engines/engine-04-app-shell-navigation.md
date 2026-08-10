# Engine 04 — App Shell and Navigation

> Band A — foundation. One responsibility: **the header, sidebar, footer and mobile navigation frame**

---

## Objective

Build the persistent frame every page renders inside, matching the prototype shell: header with primary nav and menus, sidebar listing the ten topics, footer, and the drawer plus bottom bar that replace them below 900px.

---

## Scope

**In scope**

- `AppShell` composing `Header`, `Sidebar`, `Footer`, `MobileNav`
- Sidebar collapse on desktop; sidebar-as-drawer below 900px with a scrim
- A theme toggle in the header. No settings link, no account menu and no notification panel: there is no account, nothing to configure, and content ships with the app rather than to it
- Theme toggle writing `data-theme` to the root element
- `ui.store.ts` — sidebar collapsed, drawer open, theme
- `useMediaQuery` hook
- The full responsive behaviour table from the prototype

**Out of scope**

- Route definitions — engine 05
- Anything the pages render inside the frame

---

## Dependencies

Engines 01, 02, 03.

---

## Files to create

```text
src/common/components/AppShell/{AppShell.tsx,AppShell.test.tsx,styles.module.css}
src/common/components/AppShell/{Header.tsx,Sidebar.tsx,Footer.tsx,MobileNav.tsx}
src/common/components/BrandMark/{BrandMark.tsx,BrandMark.test.tsx,styles.module.css}
src/assets/logos/brand-mark.svg
src/common/hooks/useMediaQuery.ts
src/store/ui.store.ts
```

`BrandMark` was not listed, but `ui-prototypes/assets/js/logo.js` says the mark
"becomes common/components/BrandMark" in React, and the header cannot render
without it. It is inline SVG rather than an `<img>` because the frame is
`--ink` and the ball `--accent`: a linked file cannot read the page's custom
properties and would stay light while the page went dark. The `.svg` is the
record and the favicon.

The prototype drew the Tamil wordmark as outlines because it shipped no Tamil
webfont. Engine 02 ships one, so it is live text again.

## Files to modify

`src/App.tsx` — wrap the outlet in `<AppShell>`.

---

## Implementation steps

1. Port the CSS grid from `base.css`: named areas for header, sidebar, main and footer, collapsing to a single column below 900px.
2. Build `Header`: brand, collapse button, primary nav, theme toggle. The hamburger appears only below 900px and the collapse button only above it. The header holds no dropdowns.
3. Build `Sidebar` listing the ten topics with their numbers, plus the Tools group. English only — the sidebar is chrome, and translating a topic name the learner is about to meet in English teaches nothing. Mark the active entry with `aria-current="page"`.
4. Build `MobileNav` as a fixed bottom bar below 900px, and give the footer bottom padding so it clears it.
5. Write `ui.store.ts` holding `sidebarCollapsed`, `drawerOpen` and `theme`. Actions only; no derived state stored.
6. Wire Escape to close the drawer and any open menu, and close the drawer automatically when the viewport grows past 900px.
7. Add the skip link as the first focusable element, targeting `#main`.
8. Check every breakpoint in the prototype's responsive table.

---

## Acceptance criteria

- Every page is reachable from the header, the sidebar and the mobile bar
- The shell matches the prototype at all five widths
- The skip link is the first tab stop and moves focus to main content
- Theme toggle overrides the system preference in both directions and persists
- Escape closes the drawer and any open menu
- The sidebar's active topic is marked with `aria-current`

---

## Edge cases

- Resizing from mobile to desktop with the drawer open must not leave a hidden scrim capturing clicks.
- The sidebar is scrollable independently — ten topics plus tools overflow a short viewport.
- Collapsing the sidebar hides labels but must keep the icons and their accessible names.
- The theme toggle must read the *effective* theme, not just the stored one, or the first click appears to do nothing when following the system preference.

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

- `AppShell.test.tsx` — renders header, sidebar, footer; skip link focuses main
- `ui.store.test.ts` — toggles are actions, no derived state stored
- Drawer — opens, closes on Escape, closes on scrim click, closes on viewport growth
- `useMediaQuery.test.ts` — responds to `matchMedia` changes

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
