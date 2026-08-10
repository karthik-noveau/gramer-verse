# Engine 05 — Routing and Lazy Pages

> Band A — foundation. One responsibility: **the centralised route table with every page lazy-loaded**

---

## Objective

Define every route in one place, lazy-load every page, and handle unknown paths and unknown ids the way `architecture.md` §7 specifies — showing the bad path rather than redirecting away from it.

---

## Scope

**In scope**

- `common/constants/routes.ts` — the single route table
- React Router configuration in `App.tsx`
- `React.lazy` for all 7 pages, wrapped in `<Suspense>` with `Spinner`
- The `not-found` page
- An error boundary above the router

**Out of scope**

- Page content — engines 22 to 28. Each page is a placeholder here.
- Data loading of any kind

---

## Dependencies

Engines 01, 02, 03, 04.

---

## Files to create

```text
src/common/constants/routes.ts
src/pages/not-found/{index.tsx,styles.module.css}
src/pages/<each>/index.tsx   (placeholder for the other six)
src/common/components/ErrorBoundary/{ErrorBoundary.tsx,ErrorBoundary.test.tsx}
src/App.test.tsx
jest.setup.cjs
```

**The counts in this engine were stale.** It said "all eleven" pages here and
"twelve entries" in step 1; `architecture.md` §2.2 lists **seven** page folders,
which is also what its own scope line says ("React.lazy for all 7 pages"). The
route table has eight entries — `reference` appears twice, with and without a
`:tableId` — plus the two redirects for addresses that used to be pages.

`jest.setup.cjs` was not listed. jsdom exposes no `TextEncoder`, which
react-router needs at import time, so every test that touches routing threw
before its first assertion.

`Button` gained a `to` prop, rendering a router `Link`. Without it the three
ways out of the 404 were plain anchors that reloaded the whole application to
reach one page, which is the thing the router exists to avoid.

## Files to modify

`src/App.tsx` — router, suspense and error boundary.

---

## Implementation steps

1. Write `routes.ts` exporting a frozen route table: path, id and a lazy import for each of the twelve entries in `architecture.md` §7. Nothing else in the codebase may hardcode a path string.
2. Configure React Router from that table, with `AppShell` as the layout route.
3. Wrap the outlet in `<Suspense fallback={<Spinner/>}>` so a lazy chunk never shows a blank frame.
4. Build the `not-found` page from `ui-prototypes/pages/404.html`: it shows the attempted path and offers three ways out. It does **not** redirect.
5. Add `ErrorBoundary` above the router, rendering `ErrorState` with the error message.
6. Create a minimal placeholder for each page — a heading and nothing else. Later engines replace them one at a time.
7. Confirm each route produces a separate chunk in the build output.

---

## Acceptance criteria

- Every route in `architecture.md` §7 resolves
- Every page is a separate lazy chunk, verified in the build output
- An unknown path renders `not-found` with the attempted path visible, and the URL is unchanged
- A thrown render error is caught by the boundary and shown as `ErrorState`, not a white screen
- No path string appears outside `routes.ts`

---

## Edge cases

- `/topics/:topicId` with an unknown id is *not* a 404 — it renders the topic page's empty state. Same for `/lessons/:lessonId`. Do not conflate the two.
- A lazy chunk that fails to load (stale deploy, offline) must render an error state offering a reload, not hang on the spinner forever.
- Trailing slashes and mixed case in the URL must resolve to the same route.
- The error boundary must reset when the route changes, or one bad page poisons the whole session.

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

- `App.test.tsx` — each route renders its page
- Unknown path renders `not-found` and preserves the URL
- `ErrorBoundary.test.tsx` — catches a thrown error and renders `ErrorState`
- Suspense fallback appears while a lazy chunk resolves

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
