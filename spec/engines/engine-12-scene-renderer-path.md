# Engine 12 — Scene Renderer — Path

> Band C — the scene engine. One responsibility: **mover + landmark + arrow, for the eight direction prepositions**

---

## Objective

Render movement: a mover, a landmark and an arrow whose start, end and completeness carry the meaning. To, into, towards, along, across, over, past and from differ only in that arrow.

---

## Scope

**In scope**

- `path.renderer.ts` for the eight direction prepositions
- Arrow shapes: straight, arc, curve-into, and solid-then-dashed for `towards`
- Landmark kinds: building, container, road band, river band, city skyline
- The distinction between arriving (`to`) and not arriving (`towards`)

**Out of scope**

- The other renderers
- Animating the arrow drawing itself — engine 20

---

## Dependencies

Engines 01, 06, 09, 10.

---

## Files to create

```text
src/common/scene/renderers/path.renderer.ts
src/common/scene/renderers/path.renderer.test.ts
```

## Files to modify

`src/common/scene/types.ts` — `PathRelation` was the wrong eight.

It was written in engine 06 as ten guessed from the topic name: `to`,
`towards`, `into`, `out of`, `from`, `through`, `across`, `along`, `around`,
`onto`. The curriculum teaches eight, and this engine names the same eight:
`to`, `into`, `towards`, `along`, `across`, `over`, `past`, `from`. Four of the
ten are in no lesson; two of the eight were missing.

`LandmarkKind` is the evidence that this was a slip rather than a decision: it
has a `city` in it, and the only sentence in the entire curriculum with a city
in it is *the plane flew over the city* — the `over` that `PathRelation` did
not have. The type is now the eight, in the curriculum's own order. Nothing
else in the codebase referenced the four that went.

---

## Implementation steps

1. Port the eight scenes from `ui-prototypes/pages/scenes-catalogue.html`, which were visually verified.
2. Model the arrow as start point, end point, shape and an `arrives` flag. That is the whole semantic difference between `to` and `towards`, and it should be expressed as data rather than eight bespoke drawings.
3. `into` curves over the container edge and terminates inside its `inside` rectangle — it must visibly cross a boundary.
4. `along` follows the landmark's own curve offset outward; `across` crosses it perpendicular.
5. `over` arcs above the landmark with clear space between; `past` continues beyond it, with a marker showing it did not stop.
6. `from` reverses the arrow and places the mover at the destination end.
7. Render `towards` as a solid segment plus a dashed continuation with the landmark faded — the journey, not the arrival.

---

## Acceptance criteria

- All eight prepositions render with a visually distinct arrow
- `to` terminates at the landmark; `towards` visibly does not reach it
- `into` terminates inside the container's `inside` rectangle
- `across` is perpendicular to the landmark band; `along` is parallel
- `from` originates at the landmark

---

## Edge cases

- An arrow that ends exactly on the landmark edge reads as ambiguous between `to` and `into` — overlap deliberately for `into`.
- Arrowheads on curved paths must orient to the tangent, not the chord.
- `past` needs the landmark roughly centred or "kept going" has nowhere to go.
- A mover and a landmark that overlap at the start make the arrow unreadable; enforce a minimum separation.

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

- One test per preposition asserting arrow start, end and shape
- `to` end point is at the landmark boundary; `towards` end point is short of it
- `into` end point is within the container's `inside` rect
- `from` — arrow direction is reversed
- Arrowhead marker is emitted once

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

**Two of the five landmarks are props.** A building is the `shop` and a
container is the `box`. Drawing a second box here would give a learner who has
just met *the ball is in the box* a different box in *the dog ran into the
box*, and `into` needs an `inside` rectangle, which the box already declares.
A road, a river and a city are not props — a road is not a thing you can put on
a table — and are drawn in this file.

**`arrives` and `arrow` are checked, not obeyed.** `PathSpec` carries both, and
both are decided by the relation: `to` is a straight arrow that arrives,
`towards` is the same arrow that does not. A spec saying `to` with
`arrives: false` describes no preposition, so `pathProblem` refuses it rather
than drawing a journey that stops short under a sentence saying it got there.
`PATH_ARROWS` is exported so content and knobs can read what each word needs.

**`pathAllows` is the same mechanism engine 11 uses.** `into` needs a
container, `across` and `along` need a band to cut or to follow, and the other
five need something that is not a band — you cannot arrive at a road. The knob
disables the impossible pairing; the renderer refuses it if it arrives anyway.

**`past` draws its arrow in front of the scene, not at travelling height.** At
the height everything else uses it goes straight through the car and the
building it is meant to be going past.

**Nothing in the prop library flies.** The curriculum's `over` lesson is *the
plane flew over the city*, and the mover is a `PropId`. The renderer draws
whatever mover it is given at the top of the arc — it was checked with a ball —
but the lesson as the curriculum words it needs a prop that does not exist yet.
That is a prop-library gap for whichever engine authors the direction lessons,
not a gap in this renderer.
