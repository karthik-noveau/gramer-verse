# Engine 13 — Scene Renderer — Timeline

> Band C — the scene engine. One responsibility: **an axis with points, bands and boundary flags — twelve tenses and nine time prepositions**

---

## Objective

Render time as a line. The same renderer carries all twelve tense forms and the nine prepositions of time, because they are the same three pictures: a point, a stretch, and a boundary.

---

## Scope

**In scope**

- `timeline.renderer.ts` — axis, `now` marker, past and future labels
- Marks: point, band, boundary flag, and a container box for `in`
- All twelve tense forms as combinations of position and aspect
- The nine time prepositions

**Out of scope**

- The other renderers
- Tense content authoring — that is lesson JSON

---

## Dependencies

Engines 01, 06, 09.

---

## Files to create

```text
src/common/scene/renderers/timeline.renderer.ts
src/common/scene/renderers/timeline.renderer.test.ts
```

## Files to modify

`src/common/scene/types.ts` — `TimeRelation` had a `for` in it and no `until`.

The curriculum's time prepositions are `in`, `at`, `on`, `before`, `after`,
`by`, `since`, `during` and `until / till`. Step 4 below names the same nine
and never mentions `for`: *the gift is for you* is in the last group of
prepositions, not the time one, and `for` is already a `Connective`. The same
slip as `PathRelation` in engine 12, one word wide.

---

## Implementation steps

1. Draw the axis with a fixed `now` marker and past and future labels at the ends. `now` never moves — everything else is positioned relative to it.
2. Implement four mark kinds: `point` (a moment), `band` (a stretch), `flag` (a boundary, optionally a hard stop), and `container` (a labelled box of time).
3. Map tense to marks: time chooses position (past, present, future); aspect chooses the mark. Simple is a point, continuous is a band, perfect adds a completion flag, perfect continuous is a band plus a flag.
4. Map the time prepositions onto the same vocabulary: `at` is a point, `on` is a day resting on the axis like a surface, `in` is a container, `before` and `after` are bands bounded by a flag, `by` is a band with a hard stop, `since` runs from a flag to `now`, `during` is a band containing a point, `until` is a band ending at a stop.
5. Make the shared vocabulary explicit in code, because the pedagogical claim in `architecture.md` §4.1 — that `in`, `on` and `at` mean the same three things in place and in time — only holds if the pictures really are the same.
6. Keep labels off the axis so long band labels never collide with the marks.

---

## Acceptance criteria

- All twelve tense forms render distinguishably
- All nine time prepositions render
- `at` is a point, `on` rests on the axis, `in` contains the event — mirroring the place renderer
- `now` is at a fixed position in every scene
- Band labels never overlap the axis or the flags

---

## Edge cases

- A band crossing `now` must not hide the `now` marker — draw the marker last.
- `since` runs to `now` by definition and must recompute if `now` moves.
- Very long band labels overflow narrow bands; place them above and centre on the band, clamped to the stage.
- Perfect continuous carries both a band and a flag and is the densest scene — check it does not collide at the smallest supported width.

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

- Twelve tests, one per tense form, asserting mark kind and position
- Nine tests, one per time preposition
- `now` is at the same x in every scene
- `during` — the point falls inside the band's bounds
- A band crossing `now` still renders the marker

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

---

## Decisions

**Two lanes, not one.** The tense is drawn on the axis and the marks in a lane
below it. Step 6 asks for labels off the axis and the edge case asks for them
above their band; above the band is where the tense picture is, so a label that
dodged a band would land on the event it belongs to. Below the lane there is
nothing else at any width, so a label of any length has the room.

**Every stretch is projected back onto the axis** by two dashed drops at its
edges. A box in a lane of its own is a box; a box whose edges are marked on the
timeline is a stretch *of* the timeline, and an event standing between those
edges is visibly inside it. Without them §4.1's claim — that `in`, `on` and
`at` mean the same three things in place and in time — would be a claim about
two unrelated drawings.

**The perfects finish BY their reference time, not after it.** The prototype
put the completion flag a fixed distance to the right of the event, which drew
present perfect as something finishing in the future. The event is earlier and
the boundary is at the reference time, which is what *finished by here* means.

**`since` computes its own end.** It runs to `now` by definition, so the
renderer overrides whatever fraction the content gave rather than leaving a
stretch that stops in the past when `now` moves.

**The relation is checked, not obeyed.** `TIME_RELATIONS` says which marks each
preposition's picture is made of, and `timelineProblem` refuses a scene whose
marks are not those — the same mechanism as engines 11 and 12. It is exported
so content and knobs can read it.
