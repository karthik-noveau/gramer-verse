# CODEBASE ARCHITECTURE

This document defines the mandatory architecture, coding standards, folder structure, implementation boundaries and quality rules for the entire project.
The implementation must strictly follow this guide.

---

# Technology Stack

Framework : React
Language : TypeScript
Build Tool : Vite
State Management : Zustand
Routing : React Router
Styling : CSS Modules
Testing : Jest + React Testing Library
Persistence : Browser Storage (if required)
Backend : None
Data Source
  - Local JSON
  - Static Assets
  - Zustand
  - Browser Storage

---

# Source Structure

src/
  assets/
    logos/
    icons/
    <page-name>/
  common/
    api/
    components/
    constants/
    hooks/
    utils/
  store/
    <domain>.store.ts
  pages/
    <page-name>/
      index.tsx
      components/
      hooks/
      mocks/
      constants.ts
      types.ts
      utils.ts
      styles.module.css
  theme/
    colours.css
    fonts.css
    overrides.css
  App.tsx

---

# Folder Responsibilities

spec/
Source of truth.
Contains
  - Architecture
  - Engines
  - UI Prototype
  - Development rules
Never place application code here.

---

assets/
Contains
  - Images
  - Logos
  - Icons
  - Fonts
  - Static media

---

common/
Contains reusable modules shared across multiple pages.
Must never contain page-specific logic.

---

common/api/
Responsibilities
  - Read Local JSON
  - Browser Storage
  - Mock API abstraction
Components must never access JSON directly.

---

common/components/
Reusable UI only.
Examples
  - Button
  - Modal
  - Table
  - Card
  - Badge
  - Avatar
  - Spinner
Never create page-specific components here.

---

common/hooks/
Reusable hooks only.
Examples
  - useDebounce
  - usePagination
  - useModal

---

common/constants/
Global constants only.

---

common/utils/
Shared helper functions.

---

store/
One Zustand store per domain.
Examples
  user.store.ts
  dashboard.store.ts
  settings.store.ts
  cart.store.ts
Never combine unrelated domains.

---

pages/
Every page is completely self-contained.
Allowed
  pages/products/components/
  pages/products/hooks/
  pages/products/utils.ts
Forbidden
  pages/products importing
  pages/orders/components/
Cross-page imports are not allowed.

---

theme/
Contains only global theme.
Examples
  colours.css
  fonts.css
  overrides.css

---

App.tsx
Responsibilities
  - Bootstrap
  - Providers
  - Routing
Nothing else.

---

# Import Rules

Order
  1 React
  2 Third-party libraries
  3 Common modules
  4 Store
  5 Page modules
  6 Relative imports
  7 CSS Modules
Use absolute imports whenever possible.
Remove unused imports.

---

# Naming Convention

Folders
  kebab-case
Pages
  kebab-case
Components
  PascalCase.tsx
Hooks
  useCamelCase.ts
Utilities
  camelCase.ts
Stores
  <domain>.store.ts
Types
  types.ts
Constants
  constants.ts
JSON
  kebab-case.json
Icons
  kebab-case.svg
CSS Modules
  styles.module.css

---

# TypeScript Rules

Strict Mode
  Enabled
Never use
  any
Prefer
  type instead of interface.
Exported functions require explicit return types.
Use readonly whenever appropriate.
Use exhaustive switch statements.
Avoid implicit typing where clarity improves maintainability.

---

# React Rules

Functional components only.
Hooks only.
No classes.
No HOCs unless required.
No render props unless justified.
index.tsx performs composition only.
Business logic belongs inside
  - hooks
  - stores
Avoid unnecessary re-renders.
Memoize expensive calculations.
Use React.lazy() for pages.

---

# Component Rules

Maximum
  200 lines/component
Maximum
  60 lines/function
One component/file
One responsibility/component
No prop drilling beyond two levels.
Use Zustand instead.

---

# Routing

React Router only.
Centralised route configuration.
Every page lazy-loaded.
Required
  - 404
  - Redirect handling
  - Nested routes (if applicable)

---

# Data Flow

Component → Hook → API → Local JSON → Store → UI
Components never access JSON directly.

---

# Data Fetching

Frontend only.
No backend.
No REST.
No GraphQL.
No Axios unless specifically required.
Use common/api abstraction.
Support
  - Loading
  - Success
  - Empty
  - Error
Validate loaded data.

---

# Zustand Rules

One domain per file.
Derived values
  Computed
  Never stored.
Mutations only through actions.
No direct mutation.
Reset state on page unmount where necessary.

---

# Styling Rules

CSS Modules only.
Forbidden
  - Tailwind
  - Styled Components
  - Emotion
  - Inline styles
Colours
  Only from
    theme/colours.css
Never hardcode colours.
Class names
  camelCase

---

# Accessibility

Semantic HTML
Keyboard support
ARIA
Visible focus
Colour contrast
Labels
Screen reader friendly
Accessible navigation

---

# Performance

Lazy loading
Memoization
Avoid unnecessary renders
Avoid unnecessary state
Split large components
Code splitting
Optimised assets

---

# Error Handling

Never fail silently.
Every feature supports
  - Loading
  - Empty
  - Error
  - Success
Display meaningful user messages.
Provide validation messages and recovery options where applicable.

---

# Testing

Framework
  Jest
  React Testing Library

---

Unit Tests
  Co-located
Example
  UserAvatar.tsx
  UserAvatar.test.tsx

---

Hook Tests
  useProducts.ts
  useProducts.test.ts

---

Store Tests
  dashboard.store.ts
  dashboard.store.test.ts

---

Integration Tests
  __tests__/

---

Testing Rules
Every feature includes
  - Component tests
  - Hook tests
  - Store tests
Tests must pass before engine completion.

---

# Documentation

Prefer self-documenting code.
Comment only complex business logic.
Avoid redundant comments.

---

# Build Requirements

The project must
Pass
  - Build
  - TypeScript
  - ESLint
  - Jest
Contain
  - Zero warnings
  - Zero dead code
  - Zero unused files
  - Zero unused imports

---

# Code Quality

Follow
  - DRY
  - KISS
  - SOLID
  - Single Responsibility Principle
Prefer
  - Composition
  - Early returns
Avoid
  - Deep nesting
  - Duplicate logic

---

# Forbidden

any
console.log
debugger
TODO
FIXME
Hardcoded colours
Magic numbers
Magic strings
Dead code
Circular imports
Cross-page imports
Duplicate logic
Unused imports
Unused variables
Barrel exports (unless explicitly requested)
Framework-specific styling libraries

---

# Completion Criteria

The codebase is considered compliant only when
  - Folder structure matches this guide.
  - All naming rules are followed.
  - All boundaries are respected.
  - All tests pass.
  - Build passes.
  - TypeScript passes.
  - ESLint passes.
  - No forbidden practices remain.
