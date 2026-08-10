# Engine 11 — Scene Renderer — Place

> Band C — the scene engine. One responsibility: **figure + ground + spatial relation, the renderer that carries five topics**

---

## Objective

Render a figure positioned against a ground according to a spatial relation. This one renderer carries prepositions of place, articles, adjectives, number and nouns — five of the ten topics.

---

## Scope

**In scope**

- `place.renderer.ts` handling in, on, at, under, above, below, behind, in front of, between, near, beside, here, there
- Article state: indefinite draws a dashed outline, definite a solid one
- Number: one, two or three copies laid out in a centred row
- Adjective: colour changes fill, size changes scale
- Depth for `behind` and `in front of` via draw order, scale and shadow

**Out of scope**

- The other four renderers
- Animation — engine 20

---

## Dependencies

Engines 01, 06, 09, 10.

---

## Files to create

```text
src/common/scene/renderers/place.renderer.ts
src/common/scene/renderers/place.renderer.test.ts
```

## Files to modify

None.

---

## Implementation steps

1. Port the layout function from `ui-prototypes/assets/js/scene.js`, which was verified against forty scenes — the geometry is known-good. It stages **six** of the thirteen: `in`, `on`, `under`, `above`, `behind`, `beside`. The other seven — `at`, `below`, `in front of`, `between`, `near`, `here`, `there` — exist in the prototype only as reference icons in `icons-extra.js`, which are 48px diagrams, not stageable scenes. Porting gives you six; the remaining seven are new geometry and are the bulk of this engine.

   **The prototype stages eleven, not six.** `at`, `below`, `in front of`,
   `near` and `between` were staged there after this engine was written, each
   with a note saying what was tried and rejected — `below` as a lifted ground
   reads as a floating table; `at` centred under the ground reads as `under`.
   All eleven are ported. Only `here` and `there` are new, and they are new in
   a way the others are not: they have no ground at all, so there is nothing to
   be relative to. The speaker's own spot on the floor is what they are drawn
   against — the figure standing in it for `here`, a measured distance and a
   pointing arrow away from it for `there`.

   **`beside`, `near` and `below` are not ported verbatim.** The prototype
   offsets the figures a fixed distance from a ground fixed at the stage
   centre, which puts three of them off the right edge — the last edge case
   below. The ground and the row are centred as one assembly instead, which
   keeps the gap that carries the meaning and gives the row somewhere to be.
2. Implement each relation as a placement rule: `on` uses the ground's `surfaceY`; `in` uses its `inside` rectangle scaled to fit; `under` sits on the floor beneath it; `above` leaves a deliberate gap; `beside` sits adjacent; `between` needs two grounds.
3. Implement `behind` with the depth cue proven in the catalogue: draw the figure first, higher up and smaller, so the ground occludes most of it and only the head shows. A figure drawn beside the ground reads as "beside", not "behind" — this was found and fixed during prototyping.
4. Implement `in front of` as the mirror: drawn after, lower, larger, with a ground shadow.
5. Handle the indefinite article as a dashed ring and the definite as a solid one, plus a text label — colour alone is not an accessible signal.
6. Scale multiple figures to fit inside a container: three balls in a box must shrink, not overflow.
7. Emit a stable id per figure (`figure-0`, `figure-1`) so engine 20 can animate them individually.

---

## Acceptance criteria

- All thirteen place relations render correctly against every compatible ground — six ported, seven new
- `between` refuses to render with fewer than two grounds rather than drawing a wrong picture
- Any relation with no compatible ground is offered as a disabled option, never drawn
- `in` never overflows the container at any supported count
- `behind` occludes the figure; `in front of` occludes the ground
- Indefinite and definite are distinguishable without colour
- Node ids are stable as the relation changes, so figures animate rather than pop

---

## Edge cases

- `on` a ground with `surfaceY === null` (a tree) must fall back to a sensible height rather than placing the figure at the box top.
- `in` a ground with no `inside` is a content error — fail validation in engine 07, not at render.
- `between` requires two grounds; a spec with one must be rejected by the type, not handled at render.
- Three large figures beside a wide ground can exceed the stage; clamp scale rather than letting them run off.
- Adjective size and container fit interact — a `big` ball `in` a box must still fit.

**The last two are done as written. The middle two are done by the third
acceptance criterion instead, and are the same mechanism.**

Neither is reachable where this engine sends it. `validate.ts` checks that a
scene names props the lexicon knows; whether *this* relation can be drawn
against *that* ground is a fact about the drawings, and the drawings are engine
10 — engine 07 would have to import the prop registry to answer it, which is
the dependency the content layer is built to not have. And `PlaceSpec` is one
arm of the union with `ground2: PropId | null` on it; making the type refuse
`between` with one ground means splitting the arm per relation, in `types.ts`,
which this engine modifies nothing in.

Both are refused the way criterion 3 already asks for: `placeAllows` answers
whether a relation and a ground go together, so the knob offers the impossible
option disabled and it is never chosen; `placeProblem` says why, so a spec that
arrives anyway draws nothing rather than a wrong picture. One mechanism, asked
before the choice and again before the render.

**An adjective the renderer cannot draw is refused the same way.** `adjective`
is a free string. "Wooden" would leave the picture unchanged while the sentence
said *the wooden ball* — a picture contradicting its own sentence, which is the
one thing this product must never do. `PLACE_ADJECTIVES` is exported so the
knob offers only what can be drawn.

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

- One test per relation asserting the figure's position relative to the ground
- `in` with 1, 2 and 3 figures — all inside the container bounds
- `behind` — figure precedes ground in draw order; `in front of` — follows
- Indefinite emits the dashed outline and the label
- Figure ids are stable across a relation change

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

## What the renderer exposes

```ts
renderPlace(spec)                        // the node tree, or [] if refused
placeProblem(spec)                       // why it was refused, or null
placeAllows(relation, ground, ground2?)  // for the knob's disabled options
PLACE_ADJECTIVES                         // the adjectives that change a picture
```

`renderPlace` keeps the signature §4.2 of `architecture.md` gives every
renderer — a spec in, `SceneNode[]` out — so `registry.ts` in engine 16 can
switch on `kind` without a special case. Refusal is an empty tree rather than a
throw: a blank stage inside a render is visible and recoverable, and the reason
is a separate question with a separate answer.
