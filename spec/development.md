# DEVELOPMENT WORKFLOW

This document defines the complete implementation workflow after the project specification has been approved.
Every implementation must strictly follow this workflow.
Coding standards, performance, accessibility and error-handling rules live in codebase-guide.md.
That document is authoritative — this one covers workflow only.

---

# Development Lifecycle

Project → Generate Specification → User Approval → Engine 01 → Validation → Testing → Engine 02 → Repeat
No engine may begin until the previous engine has been fully completed. Completion
is proved by the checklist, not by asking: an engine that builds, typechecks,
lints, passes its tests and satisfies its acceptance criteria is done, and the
next one starts immediately.

---

# Implementation Order

## Phase 1

Generate the complete `spec/` directory.
Required
  - architecture.md
  - codebase-guide.md
  - ui-prototypes/
  - engines/
Do not generate any application source code.
Wait for approval. This is the only approval gate in the project — everything
after it is a consequence of the specification, so this is the point at which a
wrong direction is cheap to correct.

---

## Phase 2

Implement Engine 01.
Requirements
  - Complete implementation
  - Validation
  - Build verification
  - Unit tests
  - Integration tests
  - Documentation updates
  - Status update
Continue straight to Engine 02.

---

## Phase 3

Implement Engine 02.
Repeat the same workflow.
Continue until every engine has been completed.

---

# Engine Development Rules

Each engine represents exactly one responsibility.
Examples
  ✔ Project Setup
  ✔ Routing
  ✔ Dashboard Layout
  ✔ Authentication Store
  ✔ Product Listing
  ✔ Product Details
  ✘ Dashboard + Routing
  ✘ Authentication + Users
  ✘ Products + Orders
Never merge responsibilities.

---

# Engine Completion Flow

Read Engine Specification → Implement → Validate → Run Tests → Update Status → Verify Acceptance Criteria → Next Engine

---

# Engine Status Tracking

Maintain a single shared status file.
Directory
  spec/
  └── engines/
      ├── engine-status.md
      ├── engine-01-...
      ├── engine-02-...
      └── ...
Never create multiple status files.

---

# Status Update Frequency

Update engine-status.md when the engine starts, when it becomes blocked, and when it completes.
Do not report guessed completion percentages.

---

# Status File Responsibilities

The file always represents the CURRENT engine.
When a new engine begins
replace
  Current Engine
  Current Status
  Current Phase
  Remaining Work
  Files Modified
  Validation
while preserving
  Completed Engines.

---

# engine-status.md Format

# Engine Status

---

## Current Engine

Engine
Engine Number
Status (Not Started / In Progress / Blocked / Complete)
Current Phase
Example
  Engine 04
  Products
  In Progress
  Building Product Table

---

## Completed Functionality

Keep concise.
Example
  - Product routes
  - Product layout
  - Filters
  - Table
  - Pagination
  - Zustand store

---

## Remaining Work

Example
  - Sorting
  - Empty state
  - Tests
  - Documentation

---

## Files Modified

Example
  pages/products/index.tsx
  pages/products/components/ProductTable.tsx
  store/products.store.ts
  common/api/products.ts

---

## Validation

Build ✔
TypeScript ✔
ESLint ✔
Unit Tests ⏳
Integration Tests ⏳

---

## Last Updated

YYYY-MM-DD HH:mm

---

## Completed Engines

✔ Engine 01
✔ Engine 02
✔ Engine 03

---

# Engine Completion Criteria

An engine is complete only if
  ✔ Implementation completed
  ✔ Acceptance criteria satisfied
  ✔ Validation completed
  ✔ Build passed
  ✔ TypeScript passed
  ✔ ESLint passed
  ✔ Unit tests passed
  ✔ Integration tests passed
  ✔ engine-status.md marked Complete
Only then may the next engine begin.

---

# Validation Checklist

Every engine must verify
  - Folder structure
  - File naming
  - Imports
  - Routing
  - Zustand
  - API layer
  - Component boundaries
  - Styling
  - Accessibility
  - Error handling
  - Performance
  - Documentation
  - Tests

---

# Testing Requirements

Each engine must include
  Component Tests
  Hook Tests
  Store Tests
  Utility Tests (where applicable)
  Integration Tests
Every test must pass.

---

# Build Verification

Before moving to the next engine
Verify
  npm run build : Pass
  npm run test : Pass
  npm run lint : Pass
  TypeScript : Pass
No warnings.
No unused files.
No dead code.

---

# Documentation Rules

Update documentation whenever
  - Architecture changes
  - Folder structure changes
  - Engine scope changes
  - Shared modules change
Documentation must remain synchronised with implementation.

---

# Stop Rules

Engines run one after another without interruption. Do not stop to ask whether
to continue, and do not summarise after each one — the status file is the record.

STOP only when continuing would build on something broken:
  - A build, TypeScript, ESLint or test failure that the engine cannot fix
  - An acceptance criterion that cannot be satisfied as specified
  - A dependency an earlier engine was supposed to provide and did not
  - An open question in architecture.md that this engine must close and cannot
  - Work that would contradict the specification rather than implement it

When stopping, mark the engine Blocked in engine-status.md, state what is
blocking it and what is needed, and stop — do not carry on into the next engine
with the previous one unfinished.

Report at the end of the run, not between engines: completed functionality,
validation results, test results, and the final engine-status.md.

---

# Forbidden (Workflow)

Never
  - Skip engines
  - Merge engines
  - Partially implement engines
  - Generate future engine code
  - Ignore failing tests
  - Ignore TypeScript errors
  - Ignore ESLint errors
  - Leave TODOs
  - Leave FIXMEs
  - Leave unused code
  - Leave dead files
  - Leave incomplete documentation

---

# Project Completion

The project is complete only when
  ✔ Every engine is approved
  ✔ Every specification is satisfied
  ✔ All tests pass
  ✔ Build passes
  ✔ TypeScript passes
  ✔ ESLint passes
  ✔ Documentation is complete
  ✔ engine-status.md shows all engines completed
  ✔ No remaining work exists
Only then is the project considered finished.
