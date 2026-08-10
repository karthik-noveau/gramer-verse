# Grammer-Verse — Architecture

The complete implementation blueprint. Detailed enough to implement the project
without further clarification.

**Authority order.** [`codebase-guide.md`](codebase-guide.md) outranks this
document on anything it covers — folder structure, naming, boundaries, styling,
TypeScript, testing, forbidden practices. [`development.md`](development.md)
outranks it on workflow — engine order, stop rules, status tracking. This
document covers what neither does: what the product is, how its modules relate,
what the content looks like, and in what order it gets built.

The UI in [`ui-prototypes/`](ui-prototypes/README.md) is the final approved UI.
React pages must match it. No redesign without updating the prototype first.

---

## 1. Project overview

**Grammer-Verse teaches English grammar to Tamil speakers by drawing it.**

Every grammar point is a picture. Change a word and the picture changes with it,
because the grammar is the only thing moving anything. The learner does not read
a rule and then look at an example — the picture *is* the rule, and the sentence
underneath it is what that picture is called in English and in Tamil.

```text
   ┌─────────────────────────────────────────────────────────┐
   │  The ball is  [ in ]  the box.                          │
   │  பந்து பெட்டியில் உள்ளது.                                    │
   │                                                          │
   │            ┌───────────────┐                             │
   │            │   ╭─────╮     │   ← change "in" to "on"     │
   │            │   │  ◍  │     │     and the ball moves      │
   │            │   ╰─────╯     │     to the lid              │
   │            └───────────────┘                             │
   │                                                          │
   │   in    on    at    under   above   behind   between     │
   └─────────────────────────────────────────────────────────┘
```

### 1.1 Where the content comes from

The curriculum is the *Spoken English* notes — a Tamil-medium document covering
ten topics. It is the single content source and it fixes the vocabulary, the
examples and the Tamil glosses. Nothing is invented beyond it without being
recorded in `content/README.md` as an addition.

`curriculum.md` is that same data as a readable document — all ten topics,
all 152 lessons, the sixteen source tables and the corrections. It is generated
by `spec/tools/build-curriculum.cjs`, never hand-edited, so the document cannot drift
from what the app serves.

| # | Topic | Tamil | Scene kind |
|---|---|---|---|
| 1 | Tenses | காலங்கள் | `timeline` |
| 2 | Verbs — forms, auxiliary, modal, main | வினைச்சொல் | `actor` |
| 3 | Nouns & pronouns | பெயர்ச்சொல் | `actor`, `place` |
| 4 | Articles | | `place` |
| 5 | Prepositions | | `place`, `path`, `timeline`, `relation` |
| 6 | WH question words | | `actor` |
| 7 | Adjectives | | `place` |
| 8 | Adverbs | | `actor` |
| 9 | Conjunctions & sentence formation | | `relation`, `actor` |

### 1.2 Standing product constraints

These are fixed. Several structural decisions below exist only because of them.

1. **No backend.** Fully client-side, static-hosted. No accounts, no server, no
   database, no REST, no GraphQL. Curriculum data is local JSON read through
   `common/api`. Persistence is Browser Storage.
2. **No LLM, no network.** Every picture is drawn by deterministic code from a
   scene spec. The same lesson state always produces the same picture — this is
   what makes the renderers testable.
3. **Bilingual, always.** Every sentence, label, topic title and explanation
   ships with both English and Tamil. Tamil is not a translation layer bolted on
   later and not behind a toggle — a missing Tamil string is a content error that
   fails validation.
4. **Every lesson is drawn.** No prose-only lessons. If a sentence cannot be
   drawn, the app says so explicitly rather than degrading to text.
5. **No progress tracking.** The app does not record what has been seen, and
   there is nothing to resume. Every topic and lesson is reachable at any time,
   from the sidebar, at any point. Nothing is stored about the learner beyond
   their display preferences.
6. **Hand-built drawing.** No charting or animation library. The prop library and
   the scene renderers are the product.

### 1.3 Non-goals

- No backend, accounts, or cross-device sync.
- No mobile app — responsive web only.
- No full-document proofreading. One sentence at a time, for teaching.
- No gamification and no progress tracking: no streaks, XP, badges, completion
  percentages, or "continue where you left off".
- No speech recognition or pronunciation scoring.
- No monetization.

### 1.4 Target user

A Tamil speaker who can read some English but builds sentences by translating
from Tamil, and so gets caught by exactly the things Tamil handles differently:
articles (Tamil has none), prepositions (Tamil uses case suffixes, not separate
words), and word order (Tamil is subject-object-verb, English is
subject-verb-object). Those three are where the pictures earn their keep.

---

## 2. Technical architecture

Stack is fixed by [`codebase-guide.md`](codebase-guide.md): React, TypeScript
(strict), Vite, Zustand, React Router, CSS Modules, Jest + React Testing Library,
Browser Storage, no backend.

**No runtime dependency beyond React, React DOM, React Router and Zustand may be
added without explicit approval.** Specifically excluded: any UI kit, any
CSS-in-JS or utility-CSS library, any NLP library, any charting or animation
library, Axios.

Dev-only additions permitted: `@types/*`, `identity-obj-proxy`,
`jest-environment-jsdom`, `babel-jest` + Babel presets, `eslint` + `@eslint/js` +
`typescript-eslint`, and the build and test tools the stack names — `vite`,
`@vitejs/plugin-react`, `typescript`, `jest`, `@testing-library/react`.

React Router and Zustand are approved but are installed by the engine that first
needs them (05 and 08), not up front: an unused dependency is still a dependency.

### 2.1 Layer model

The controlling idea: **the renderers never read JSON, and the content never
knows React exists.** They meet only at the versioned `SceneSpec` type.

```text
   content/*.json          pure data — topics, lessons, props, verbs
        │
        ▼
   common/api/             read, validate, cache. The only JSON reader.
        │
        ▼
   store/*.store.ts        Zustand. Holds current lesson + knob state.
        │
        ▼
   pages/*/hooks/          derive a SceneSpec from knob state
        │
        ▼
   common/scene/           pure TypeScript. SceneSpec ──► SceneNode tree.
        │                  Knows no React, no store, no JSON.
        ▼
   pages/*/components/     render the tree, wire the knobs
        │
        ▼
   UI
```

Nothing skips a layer. A component that imports from `content/` directly, or a
renderer that imports from `store/`, is a boundary violation and fails review.

### 2.2 Source structure

```text
src/
  assets/
    logos/
    icons/
    fonts/                    Tamil webfont (subset)
  common/
    api/
      content.api.ts          topics, lessons
      props.api.ts            prop + verb lexicon
      storage.api.ts          Browser Storage wrapper
      validate.ts             schema validation for loaded JSON
    components/
      Button/  Card/  Chip/  Table/  Tabs/  Dialog/  Drawer/
      Dropdown/  Toast/  Spinner/  EmptyState/  ErrorState/
      Breadcrumbs/  BilingualText/
    constants/
      routes.ts
      storage-keys.ts
    hooks/
      useMediaQuery.ts  useFocusTrap.ts  useLocalStorage.ts  useReducedMotion.ts
    scene/
      types.ts                SceneSpec, PropId, all scene unions
      primitives.ts           rect, circle, path, text, arrow, marker defs
      props/
        index.ts              prop registry: PropId ──► Prop
        furniture.ts          table, box, chair, door, building, car
        actors.ts             man, woman, boy, girl, cat, dog, bird
        objects.ts            ball, book, cup, apple, gift, clock, tree
      renderers/
        place.renderer.ts
        path.renderer.ts
        timeline.renderer.ts
        actor.renderer.ts
        relation.renderer.ts
        registry.ts           SceneKind ──► renderer
      layout.ts               shared geometry: FLOOR, stage box, shadow, anchors
      sentence.ts             SceneSpec + knobs ──► bilingual sentence
    utils/
      tamil.ts                case-suffix selection
      classNames.ts
  store/
    content.store.ts
    lesson.store.ts
    visualizer.store.ts
    ui.store.ts
  pages/
    landing/  topics/  topic/  lesson/  visualizer/
    reference/  visualizer/  not-found/
  theme/
    colours.css
    fonts.css
    overrides.css
  content/
    topics.json
    lessons/*.json
    lexicon/props.json
    lexicon/verbs.json
    README.md
  App.tsx
```

`content/` sits under `src/` so Vite fingerprints it and TypeScript can type the
import. It is data, not code; only `common/api` may read it.

---

## 3. Module responsibilities

| Module | Owns | Must never |
|---|---|---|
| `common/api` | Reading and validating JSON, Browser Storage access | Hold state, know about React |
| `common/scene/primitives` | SVG node construction | Know what a lesson is |
| `common/scene/props` | One draw function per drawable thing | Position itself on the stage |
| `common/scene/renderers` | Turning one `SceneSpec` into a node tree | Read the store or the API |
| `common/scene/sentence` | Building the bilingual sentence from scene state | Render anything |
| `common/components` | Reusable presentational UI | Contain lesson logic |
| `store/*` | One domain each, actions only | Compute what a selector can derive |
| `pages/*` | Composition, page-local hooks and components | Import from another page |
| `theme/` | Colour, type, spacing tokens | Contain component styles |

### 3.1 The prop contract

Every prop draws itself into a local box and declares its own anchors. The
renderer positions the box; the prop never knows where it is on the stage.

```ts
type Prop = {
  readonly id: PropId;
  readonly box: { readonly w: number; readonly h: number };
  /** Where things sit ON it, relative to the prop box. Null if nothing can. */
  readonly surfaceY: number | null;
  /** Where things go IN it: [x, y, w, h]. Null if it is not a container. */
  readonly inside: readonly [number, number, number, number] | null;
  /** For actors: mouth, hand, foot, eye. Empty for objects. */
  readonly anchors: Readonly<Partial<Record<AnchorName, readonly [number, number]>>>;
  readonly draw: (fill?: string) => readonly SceneNode[];
  readonly word: PropWord;
};
```

This is what makes 40+ scenes come out of ~15 drawable things, and it is the
single most load-bearing type in the codebase.

### 3.2 Bilingual words are declined, not concatenated

English builds *the ball is in the box* by putting words in a row. Tamil builds
பந்து **பெட்டியில்** உள்ளது by changing the *end of the noun* — there is no
separate word for "in". So a Tamil sentence cannot be assembled by swapping one
slot the way the English one can.

Every prop therefore carries its declined forms, and every preposition declares
which case it governs:

```ts
type PropWord = {
  readonly en: { readonly singular: string; readonly plural: string };
  readonly ta: {
    readonly nominative: string;   // பெட்டி            the box
    readonly accusative: string;   // பெட்டியை          the box (object)
    readonly dative: string;       // பெட்டிக்கு         to the box
    readonly locative: string;     // பெட்டியில்         in / at the box
    readonly ablative: string;     // பெட்டியிலிருந்து    from the box
  };
};

type TamilCase = keyof PropWord['ta'];
```

`common/utils/tamil.ts` exposes `caseFor(prep: PrepId): TamilCase`. The Tamil
sentence template then reads its noun in the right case, and the whole sentence
stays correct as knobs change. Sentence *order* also differs — Tamil templates
carry their own slot order, and the two templates are built independently from
the same scene state.

```text
   scene state ─┬─► en template  [det][adj][figure][be][prep][the][ground]
                └─► ta template  [figure.nominative][ground.locative][be]
```

Getting this wrong produces sentences that are individually fine and
grammatically wrong the moment a knob moves, which is why it is specified here
rather than left to the content author.

---

## 4. The scene engine

Five renderers cover all ten topics. Adding a lesson is writing JSON; adding a
*renderer* is a rare, deliberate act that requires updating this document.

| Renderer | Shape | Teaches |
|---|---|---|
| `place` | figure + ground + spatial relation | prepositions of place, articles, adjectives, number, nouns |
| `path` | mover + landmark + arrow | prepositions of direction |
| `timeline` | axis + points, bands, boundary flags | all 12 tenses, prepositions of time |
| `actor` | actor + verb + patient | main verbs, modals, adverbs, WH questions, sentence types, voice |
| `relation` | two items + a relation glyph | conjunctions, `like`/`as`/`with`/`for`/`about`/`per` |

### 4.1 Why these five

They are not a taxonomy of grammar; they are a taxonomy of *pictures*. The same
three spatial ideas recur across topics, which is the pedagogical spine of the
whole product and the reason topics are ordered as they are:

```text
   in  = inside a container   ──►  the ball in the box   ──►  in 2000
   on  = touching a surface   ──►  the book on the table ──►  on Monday
   at  = a single point       ──►  she is at school      ──►  at 5 PM
        └──── place scene ────────────────┘  └── timeline scene ──┘
```

A learner who has seen `in` as a box does not have to relearn `in 2000`.

### 4.2 Render pipeline

```text
   knob state
       │
       ▼
   deriveScene(lesson, knobs) ──► SceneSpec        (page hook, pure)
       │
       ▼
   registry[spec.kind]        ──► renderer
       │
       ▼
   renderer(spec, layout)     ──► SceneNode[]      (pure, no React)
       │
       ▼
   <Stage>                    ──► <svg>            (the only React part)
```

`SceneNode` is a plain serialisable description, not an SVG string and not JSX:

```ts
type SceneNode = {
  readonly id: string;                 // stable across renders — drives animation
  readonly tag: 'g' | 'rect' | 'circle' | 'ellipse' | 'path' | 'line' | 'text';
  readonly attrs: Readonly<Record<string, string | number>>;
  readonly text?: string;
  readonly children?: readonly SceneNode[];
};
```

This is what lets renderers be unit-tested by asserting on structure rather than
on markup, and what lets the animation layer diff two trees.

### 4.3 Animation

Constraint 4 says every lesson is drawn; it does not say every lesson is a movie.
Motion here is **transition between two scene states**, not playback of a
timeline:

```text
   knob changes ──► new SceneSpec ──► new SceneNode[]
                                          │
             diff by node id ─────────────┤
                                          ▼
             nodes that moved    ──► CSS transform transition
             nodes that appeared ──► fade + scale in
             nodes that left     ──► fade out
```

Every node carries a stable `id` so the diff can match across renders. Honour
`prefers-reduced-motion`: when set, apply final positions with no transition.

### 4.4 When a sentence cannot be drawn

A first-class outcome, not an error. Practice mode accepts free text; the
resolver maps words to props and verbs, and any unmapped content word makes the
scene undrawable.

```text
   input ──► tokenize ──► resolve against lexicon
                              │
              ┌───────────────┴───────────────┐
          all resolved                  some unresolved
              │                               │
              ▼                               ▼
          render scene                  <CannotDraw>
                                        names the unknown words,
                                        offers the nearest drawable
                                        sentence as a substitute
```

---

## 5. Content model

```ts
type Topic = {
  readonly id: TopicId;
  readonly order: number;
  readonly title: Bilingual;
  readonly summary: Bilingual;
  readonly lessonIds: readonly LessonId[];
};

type Lesson = {
  readonly id: LessonId;
  readonly topicId: TopicId;
  readonly order: number;
  readonly title: Bilingual;
  readonly idea: Bilingual;              // the one-line spine of the lesson
  readonly scene: SceneSpec;             // the opening state
  readonly knobs: readonly Knob[];       // what the learner may change
  readonly predict: Predict | null;      // predict-then-reveal step
  readonly why: Bilingual;               // why the picture looks like that
  readonly sentence: SentenceTemplates;  // en + ta, independently ordered
};

type Bilingual = { readonly en: string; readonly ta: string };

type Knob = {
  readonly key: string;
  readonly label: Bilingual;
  readonly options: readonly { readonly value: string; readonly label: Bilingual }[];
};

type Predict = {
  readonly question: Bilingual;
  readonly options: readonly { readonly value: string; readonly label: Bilingual }[];
  readonly answer: string;
  readonly explain: Bilingual;
};
```

`SceneSpec` is a discriminated union on `kind`, one arm per renderer. Every arm
is exhaustively switched in `registry.ts`; adding an arm without adding a
renderer is a compile error, which is the intended pressure.

### 5.1 Validation

`common/api/validate.ts` runs on every load and rejects, with a named error:

- a missing or empty `ta` on any `Bilingual`
- a `PropId` or `VerbId` not present in the lexicon
- a `Knob.option.value` the scene spec cannot accept
- a `Predict.answer` not among its own options
- a lesson whose `topicId` has no matching topic
- a duplicate `LessonId`

Invalid content renders `<ErrorState>` naming the file and the failing rule. It
never renders a half-built scene.

---

## 6. Application lifecycle

```text
   index.html
       │
       ▼
   main.tsx ──► React root
       │
       ▼
   App.tsx
       ├─ theme CSS imported
       ├─ <ErrorBoundary>
       ├─ <RouterProvider>
              │
              ▼
   route matched ──► React.lazy page ──► <Suspense fallback={<Spinner/>}>
              │
              ▼
   page mount ──► content.store.load()  ← idempotent; cached after first call
              │
      ┌───────┴───────┬────────────┐
      ▼               ▼            ▼
   loading         error         ready
   <Spinner>     <ErrorState>   render page
```

Stores are module singletons. `content.store` loads once per session and is
never invalidated — the JSON is static and shipped with the bundle.

---

## 7. Routing architecture

Centralised in `common/constants/routes.ts`. Every page lazy-loaded.

| Route | Page | Notes |
|---|---|---|
| `/` | landing | The pitch, in one picture |
| `/topics` | topics | The way in: all ten, plus Practice and Reference |
| `/topics/:topicId` | topic | That topic's lessons |
| `/lessons/:lessonId` | lesson | **The product** |
| `/topics/prepositions/visualizer` | visualizer | Every preposition, drawn. `/practice` redirects here |
| `/reference` | reference | The source tables, browsable |
| `/reference/:tableId` | reference | Verb list, pronoun grid, modals |
| `*` | not-found | 404 |

```text
   /                    landing
   ├── /dashboard       ──► /topics   (redirect — the page was folded in)
   ├── /topics          ──► /topics/:topicId ──► /lessons/:lessonId
   │                                                  │
   │                                    next lesson ──┘ (within topic,
   │                                                     then next topic)
   ├── /topics/prepositions/visualizer
   ├── /reference/:tableId
   └── *                not-found
```

Unknown `:topicId` or `:lessonId` renders `<EmptyState>` with a link back to
`/topics` — not a redirect, so the bad URL stays visible and reportable.

---

## 8. Business workflows

### 8.1 Opening a lesson

```text
   User clicks a lesson card
        │
        ▼
   Route /lessons/:lessonId
        │
        ▼
   pages/lesson/index.tsx
        │
        ▼
   useLesson(lessonId) ──► content.store.getLesson(id)
        │                        │ miss
        │                        ▼
        │                  content.api.loadLessons() ──► validate() ──► cache
        ▼
   lesson.store.open(lesson)   ← seeds knob state from lesson.scene
        │
        ▼
   useScene() ──► deriveScene(lesson, knobs) ──► SceneSpec
        │
        ▼
   registry[kind](spec) ──► SceneNode[] ──► <Stage>
        │
        ▼
   <SentenceLine>  en + ta, built by common/scene/sentence
   <KnobBar>       one control group per lesson.knobs entry
   <WhyNote>       lesson.why, both languages
```

### 8.2 Turning a knob

```text
   Click option ──► lesson.store.setKnob(key, value)
                          │
                          ▼
                    knob state changes
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
      deriveScene() again        sentence rebuilt
             │                         │
             ▼                         ▼
      new SceneNode[]            en + ta lines
             │                         │
             ▼                         ▼
      diff vs previous            changed word
      animate moved nodes         flashes
```

No network, no async, no loading state. A knob turn is synchronous and must stay
under one frame — this is why renderers are pure functions over plain data.

### 8.3 Predict-then-reveal

```text
   Lesson has predict ≠ null
        │
        ▼
   Scene renders in "question" state — the knob under test is hidden
        │
        ▼
   Learner picks an option ──► lesson.store.answer(value)
        │
        ├── correct ──► reveal: knob snaps to the answer, scene animates,
        │               explain shown, knob bar unlocks
        │
        └── wrong   ──► scene animates to the *chosen* value first, so the
                        learner sees what they actually described, then to
                        the answer. Both sentences shown side by side.
```

Showing the wrong answer's picture before the right one is deliberate: the
mistake is more instructive than the correction.

### 8.4 Practice mode

```text
   Free text ──► visualizer.store.submit(text)
        │
        ▼
   tokenize ──► resolve against lexicon (props, verbs, preps, determiners)
        │
   ┌────┴────────────────────┐
   ▼                         ▼
   all resolved         unresolved words
   │                         │
   ▼                         ▼
   build SceneSpec       <CannotDraw words={…}>
   │                         │
   ▼                         ▼
   render + knobs        suggest nearest drawable sentence
```

---

## 9. Dependency graph

```text
                       theme/  (CSS only, no imports)
                          │
   common/constants ──────┼────────────┐
        │                 │            │
        ▼                 ▼            ▼
   common/utils ──► common/scene/primitives
        │                 │
        │                 ▼
        │          common/scene/props
        │                 │
        │                 ▼
        │          common/scene/renderers ──► common/scene/registry
        │                 │                          │
        ▼                 ▼                          │
   common/api ──────► store/ ◄────────────────────────┘
        │                 │
        ▼                 ▼
   common/hooks     common/components
        │                 │
        └────────┬────────┘
                 ▼
              pages/
                 │
                 ▼
              App.tsx
```

Arrows point *toward* the dependency. No cycles. `common/scene` never imports
from `store/`, `pages/`, or `common/api`.

---

## 10. Feature implementation plan

Twenty-nine engines in five bands. Each engine is one responsibility and depends
only on engines before it — with one flagged exception, engine 29, which is a
Band C component numbered last because it was specified after the bands were
fixed, and is built before the two Band E engines that render it. Full specifications live in
[`engines/`](engines/engine-status.md).

**Band A — foundation (01–05)**

| # | Engine | Delivers |
|---|---|---|
| 01 | project-setup | Vite + TS strict + ESLint + Jest, scripts green |
| 02 | theme-and-tokens | `theme/*.css`, Tamil font, colour + type scale |
| 03 | common-ui-components | Button, Card, Chip, Table, Tabs, Dialog, Drawer, Dropdown, Toast, Spinner, EmptyState, ErrorState, Breadcrumbs, BilingualText |
| 04 | app-shell-navigation | Header, sidebar, footer, mobile nav |
| 05 | routing-and-lazy-pages | Route table, lazy pages, 404, `<Suspense>` |

**Band B — content (06–08)**

| # | Engine | Delivers |
|---|---|---|
| 06 | content-schema | `types.ts` for Topic, Lesson, SceneSpec, Bilingual, Prop |
| 07 | content-api | `content.api`, `props.api`, `storage.api`, `validate.ts` |
| 08 | content-store | `content.store` — load once, select, error state |

**Band C — the scene engine (09–16)**

| # | Engine | Delivers |
|---|---|---|
| 09 | scene-primitives | rect/circle/path/text/arrow, marker defs, `SceneNode` |
| 10 | prop-library | ~15 props with box, anchors, declined words |
| 11 | scene-renderer-place | figure + ground + spatial relation |
| 12 | scene-renderer-path | mover + landmark + arrow |
| 13 | scene-renderer-timeline | axis, point, band, boundary flag |
| 14 | scene-renderer-actor | actor + verb + patient, anchor-driven |
| 15 | scene-renderer-relation | two items + relation glyph |
| 16 | scene-registry | exhaustive `SceneKind` dispatch + `<Stage>` |
| 29 | formation-diagram | word-order map, the alignment table, 8 roles — built here, numbered last |

**Band D — lesson mechanics (17–21)**

| # | Engine | Delivers |
|---|---|---|
| 17 | sentence-builder | bilingual sentence from scene state, Tamil cases |
| 18 | lesson-store | knob state, open/close, derived scene |
| 19 | knob-controls | `<KnobBar>`, keyboard support, changed-word flash |
| 20 | scene-animation | node diff, transitions, reduced-motion |
| 21 | predict-then-reveal | question state, wrong-answer-first reveal |

**Band E — pages (22–28)**

| # | Engine | Delivers |
|---|---|---|
| 22 | landing-page | `/` |
| 23 | topics-page | `/topics` — the only index |
| 24 | topic-page | `/topics/:topicId` |
| 25 | lesson-page | `/lessons/:lessonId` — the product |
| 26 | sentence-resolver | text → SceneSpec, `<CannotDraw>` |
| 27 | prepositions-visualizer | `/topics/prepositions/visualizer` |
| 28 | reference-page | `/reference`, `/reference/:tableId` |

Engine 29 (formation-diagram) sits in Band C above; engines 27 and 28 both render it.

### 10.1 Why this order

Band C before Band E is the load-bearing choice. The pages are thin wrappers
around a picture; if the renderers are built last, every page gets built twice.
Engine 25 (the lesson page) is the first point at which the product is real, and
everything before it exists to make that engine small.

---

## 11. Cross-cutting requirements

### 11.1 Accessibility

- Every scene carries an `aria-label` describing the picture in English, and a
  visually hidden Tamil description. A scene the screen reader cannot describe is
  an incomplete scene.
- Knob groups are `role="group"` with `aria-pressed` on options, operable by
  arrow keys.
- Focus is visible on every interactive element and never removed.
- Colour is never the only signal: the article lesson pairs dashed/solid outline
  with a text label, not green/grey alone.
- Tamil text carries `lang="ta"`, English `lang="en"`.

### 11.2 Performance

- Every page is `React.lazy`. The prop library and renderers ship in the main
  chunk — they are needed by the first lesson.
- Scene rendering is pure and memoised on `SceneSpec` identity.
- Tamil webfont is subset to the glyphs the content actually uses,
  `font-display: swap`, preloaded on the shell.
- A knob turn must not exceed one frame. Renderers may not allocate in a loop
  over anything larger than the prop count.

### 11.3 States

Every data-backed surface implements all four:

| State | Rendered as |
|---|---|
| Loading | `<Spinner>` inside the page frame, never a blank screen |
| Empty | `<EmptyState>` naming what is missing and offering the way out |
| Error | `<ErrorState>` naming the file and the failing validation rule |
| Success | the page |

`<CannotDraw>` is a fifth, product-specific state, and is not an error.

---

## 12. Open questions

Recorded rather than guessed. None blocks Band A–D.

1. ~~**Tamil font licensing.**~~ **Closed in Engine 02.** Noto Sans Tamil, SIL
   OFL 1.1 — redistribution and modification permitted, and the licence travels
   inside the font file as well as in `src/assets/fonts/LICENCE.md`. Shipped as
   a 68.7 KB woff2: the whole Tamil block, every shaping feature kept, weight
   axis variable 100–900, width axis pinned.
2. ~~**Verb coverage.**~~ **Closed in Engine 14: `<CannotDraw>`, never a generic
   action.** The source lists 47 main verbs and ten of them are an action a
   picture can show — `eat`, `drink`, `read`, `see`, `throw`, `give`, `open`,
   `kick`, `stand`, `laugh`. Every verb carries a `drawable` flag in
   `content/lexicon/verbs.json`; the undrawable ones keep their words and have
   no anchor and no cue, because those are facts about a drawing that does not
   exist. `validate.ts` refuses a lesson built on one, and `actor.renderer.ts`
   refuses it again by name. A generic animation was rejected: a picture that
   moves while meaning nothing teaches that `remember` and `force` look like
   whatever the engine had lying around, which is worse than saying so. The
   three groups and the reasoning are in `content/README.md`.
3. **Source errors.** The notes contain grammatical mistakes — the auxiliary
   table maps "has been / have been" to present perfect (it is present perfect
   continuous), and forms like "has been being" are not real usage. The content
   in `content/` follows correct English, and every deviation from the source is
   recorded in `content/README.md` with the reason.
