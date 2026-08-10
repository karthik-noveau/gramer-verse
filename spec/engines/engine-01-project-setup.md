# Engine 01 — Project Setup

> Band A — foundation. One responsibility: **a Vite + TypeScript + React project whose four scripts pass on an empty app**

---

## Objective

Stand up the toolchain and nothing else. At the end of this engine `npm run dev`, `npm run build`, `npm run lint` and `npm test` all succeed against a placeholder App, with TypeScript in strict mode and zero warnings. No product code, no routes, no styling.

---

## Scope

**In scope**

- Vite + React + TypeScript scaffold
- `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`, absolute imports from `src/`
- ESLint with `typescript-eslint`, configured to fail on `any`, unused vars, and `console`
- Jest + React Testing Library + `jest-environment-jsdom` + `identity-obj-proxy` for CSS Modules
- `src/App.tsx` rendering a single placeholder element
- One smoke test proving the harness runs

**Out of scope**

- Any routing, theme, component or content — those are engines 02 onward
- Any dependency beyond React, React DOM, React Router, Zustand and the dev-only list in `architecture.md` §2

---

## Dependencies

None. This is the first engine.

---

## Files to create

```text
package.json
tsconfig.json
tsconfig.node.json
vite.config.ts
eslint.config.js
jest.config.cjs
index.html
.gitignore
src/main.tsx
src/App.tsx
src/App.test.tsx
```

Two names differ from what this engine originally listed, both because the
toolchain moved on:

- `eslint.config.js`, not `.eslintrc.cjs`. `.eslintrc` needs ESLint 8, which is
  end-of-life and takes no security fixes; ESLint 9 reads flat config only.
  The rules are the same rules.
- `.gitignore` was not listed. Without it `node_modules/` and `dist/` are
  untracked noise in every `git status` from here on.

## Files to modify

None.

---

## Implementation steps

1. Scaffold Vite with the `react-ts` template; delete every demo asset, style and component it generates.
2. Set `strict: true` in `tsconfig.json` plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. Make absolute imports resolve from `src` — `"paths": { "*": ["./src/*"] }`, because TypeScript 6 deprecates `baseUrl` and TypeScript 7 stops honouring it — and mirror the alias in `vite.config.ts` and `jest.config.cjs`.
3. Install and configure ESLint (flat config) with `typescript-eslint`. Turn `@typescript-eslint/no-explicit-any`, `no-unused-vars`, `no-console` and `no-debugger` into errors, not warnings.
4. Configure Jest: `jest-environment-jsdom`, `babel-jest` with the React and TypeScript presets, and `identity-obj-proxy` mapped to `\\.module\\.css$`.
5. Reduce `App.tsx` to a single `<main>` with the product name. Reduce `main.tsx` to `createRoot(...).render(<App />)`.
6. Write `App.test.tsx` asserting the product name renders — this proves the whole test harness, not the component.
7. Add the four scripts to `package.json`: `dev`, `build`, `lint`, `test`. Run all four and fix everything they report.

---

## Acceptance criteria

- `npm run dev` serves the placeholder app
- `npm run build` completes with zero warnings
- `npm run lint` reports zero errors and zero warnings
- `npm test` passes with at least one real assertion
- `tsc --noEmit` reports zero errors
- `package.json` contains no dependency outside the approved list

---

## Edge cases

- A Vite template dependency that pulls in a forbidden library must be removed, not left unused — an unused dependency is still a dependency.
- If `identity-obj-proxy` is not wired, the first CSS Module import in engine 03 fails at test time rather than here. Prove the mapping now with a throwaway `.module.css` import in the smoke test, then delete it.
- Absolute imports must resolve identically in Vite, TypeScript and Jest. Two of three passing is the common failure and it surfaces much later.

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

- `App.test.tsx` — renders the placeholder and asserts on visible text
- Harness proof — a CSS Module import resolves under Jest without throwing

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
