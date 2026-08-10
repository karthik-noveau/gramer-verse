# Engine 14 — Scene Renderer — Actor

> Band C — the scene engine. One responsibility: **actor + verb + patient, anchored to the body**

---

## Objective

Render who does what to what. The verb decides where the patient goes — at the mouth, in the hand, at the foot, or in the air — using the anchors each actor prop declares. This renderer carries verbs, adverbs, WH questions, sentence types and voice.

---

## Scope

**In scope**

- `actor.renderer.ts` — actor, verb, optional patient
- The verb lexicon: which anchor each verb uses and what cue it draws
- Cues: chomp, gaze, arc, impact
- Voice: active and passive change which participant is ringed, not the picture
- Negation, question and imperative as overlays on the same scene

**Out of scope**

- The other renderers
- Resolving free text to a scene — engine 26

---

## Dependencies

Engines 01, 06, 09, 10.

---

## Files to create

```text
src/common/scene/renderers/actor.renderer.ts
src/common/scene/renderers/actor.renderer.test.ts
src/content/lexicon/verbs.json
```

## Files to modify

None.

---

## Implementation steps

1. Port the actor scene from `ui-prototypes/pages/scene-demo.html`, which proved the anchor approach.
2. Define each verb as an anchor plus a cue plus a patient scale. `eat` is mouth and chomp; `read` is hand and gaze; `throw` is air and arc; `kick` is foot and impact.
3. Position the patient at the actor's anchor, scaled by the verb — this is why props declare anchors rather than renderers guessing.
4. Render voice as a ring around whichever participant the sentence is about. Active and passive draw the *same picture* — only the ring moves. That is the teaching point and it must not be diluted by also changing the layout.
5. Render negation as a struck-through cue, questions with a leading marker, imperatives with the actor de-emphasised — the addressee is outside the frame.
6. **Resolve open question 2 in `architecture.md`.** Verbs with no drawable action (`remember`, `force`) are marked undrawable in the lexicon and route to `CannotDraw` rather than getting a vague generic animation. Record the decision in `content/README.md`.
7. Support an absent patient for intransitive verbs (`sleep`, `laugh`).

---

## Acceptance criteria

- Each drawable verb places the patient at the correct anchor with its cue
- Active and passive produce identical geometry and differ only in the ring
- Intransitive verbs render with no patient and no empty space where one would be
- Undrawable verbs are flagged in the lexicon, never rendered vaguely
- Every actor prop works with every drawable verb

---

## Edge cases

- Swapping actor and patient must produce an absurd picture, not a broken one — that absurdity is the lesson about word order.
- A patient larger than the actor at a mouth anchor looks wrong; clamp the patient scale per verb.
- Mirrored actors need mirrored anchors, or the object appears behind the head.
- An intransitive verb given a patient is a content error and must fail validation in engine 07.
- Passive with no stated agent still needs someone to ring — ring the patient and leave the actor faded.

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

- One test per drawable verb asserting the patient's anchor position
- Active and passive produce the same node geometry, different ring target
- Intransitive verb renders without a patient node
- Undrawable verb is reported, not drawn
- Actor/patient swap produces a valid scene

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
