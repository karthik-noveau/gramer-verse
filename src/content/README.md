# Content

Everything the app teaches. Only `common/api` may read this folder — a component
that imports from here is a boundary violation and fails review.

## What is generated and what is authored

```text
topics.json        generated   node spec/tools/build-content.cjs
curriculum.json    generated   the same
lessons/*.json     authored    by hand
lexicon/*.json     authored    by hand
```

The generated half comes from `spec/ui-prototypes/assets/js/content.js`, which
was itself extracted from the *Spoken English* source notes rather than retyped,
and is checked against that document by `spec/tools/verify-curriculum.cjs`. **Do
not hand-edit the generated files.** Change `content.js` and regenerate, or the
document and the app fall out of step — which is the exact failure the tooling
exists to prevent.

`topics.json` takes each topic's `lessonIds` from whatever is authored in
`lessons/`, so a topic with no lessons yet carries an empty list. That is an
empty state on its page, not an error.

**Thirty-two lines of the outline in `curriculum.json` have no Tamil**, and
that is the source's own gap: those rows are English example sentences the
notes never glossed — *This is a pen*, *He is a student.* Constraint 3's rule
that a missing Tamil string is a content error is about the strings this app
wrote; this file is a transcription of somebody else's, and inventing a gloss
here would be putting words into the notes' mouth. `validateCurriculum` carries
them as `titleTa: null` and the topic page renders the English alone.

## Deviations from the source notes

### Additions this app wrote

The source names the ten topics, their groups and their lessons, and gives
example sentences. It never says **when** a form is used — so a learner who has
read a topic's table still does not know when the topic is theirs to reach for.

`USAGE` in `common/api/content.api.ts` adds one sentence per topic saying
exactly that, in both languages. It is this app's writing, not a transcription:

- **English and Tamil are both authored here.** Nothing was glossed from the
  notes, so nothing has been put into their mouth.
- **The Tamil is deliberately plain.** The reader is learning English; a line
  that explains English must not itself need explaining.
- It is shown on the topic page only. The topic cards stay at the question and
  the source's own summary, so ten of them still scan.

The other line the app writes is the question that leads each description —
"What are Tenses?" — assembled in `describeTopic` from the source's own title
and summary plus the words `What are` / `என்றால் என்ன`.

### Corrections carried over from the source

The notes contain mistakes. The app teaches the correct form and records where
it departed; these are rendered at the foot of the reference page.

| # | Where | The notes say | The app teaches |
|---|---|---|---|
| 1 | Tense forms | "He has been writing for an hour" is labelled present perfect. | That is present perfect continuous. Present perfect is has/have + past participle — "he has written". The row is left as the notes wrote it and flagged here; rewriting it would mean inventing an English and a Tamil sentence the notes do not contain. |
| 2 | Auxiliary verb forms | "has been being", "had been being", "will have been being". | Not real English usage. Kept, because it is what the notes say and removing a row would hide the error rather than name it — the perfect continuous is has/have been + -ing. |
| 3 | Modal verbs | may = fewer possibilities, might = more possibilities. | Reversed. "may" is the more likely of the two; "might" is the more tentative. |
| 4 | Prepositions of place | below example glossed "வெப்பநிலை சுழற்சி புள்ளியின் கீழே". | Corrected to "வெப்பநிலை பூஜ்ஜியத்திற்கு கீழே" — zero, not "cycle point". |
| 5 | Main verbs | cried → அழைத்தேன். | அழைத்தேன் means "called". Corrected to அழுதேன். |
| 6 | Conjunctions | the third column is headed "Conjunction", the same as the first. | It holds the English example sentence. Headed "English Example". |
| 7 | Adjectives | "English Example" heads both the third and fourth columns. | The fourth is the Tamil rendering. Headed "Tamil Example". |
| 8 | Tense forms | three column headings above rows of four cells. | The fourth column is the Tamil example. Heading supplied. |
| 9 | Personal pronouns | columns headed "Subjust" and "Possesive". | Spelled Subject and Possessive. |
| 10 | Prepositions of direction | "He run across the road" and "His came from the office". | "He ran across the road" and "He came from the office". |
| 11 | Articles | "She eat an apple." | "She eats an apple." — third person singular takes -s. |
| 12 | Personal pronouns | rows drop the repeated Persons and Numbers labels, and "Third Person / singular" is typed on She — three rows into its own group. | Every row carries its own Persons and Numbers. He, She and It are all Third Person singular. |
| 13 | Personal pronouns | reflexives written as two words — "Him self", "Them selves-" — and "My" for the first person. | Myself, Ourselves, Yourself, Yourselves, Himself, Herself, Itself, Themselves. |
| 14 | Personal pronouns | "Then அவர்களுடைய" in the adjective column. | "Their" — a possessive adjective, not "then". |
| 15 | Sentence formation | each Example cell runs the pattern, the English sentence and the Tamil together with no separator — "Subject + Main Verb + ObjectI play cricketநான் cricket விளையாடுறேன்". | Split into three columns. The port had kept only the pattern and the English, dropping every Tamil sentence in the topic. |
| 16 | Sentence formation | the Yes / No present-tense row is glossed "நீ எங்கே cricket விளையாடுறா ?" — a where-question. | That Tamil belongs to the WH row above it. Left as written and flagged; correcting it would mean writing a Tamil sentence the notes do not contain. |
| 17 | Exclamatory sentences | the second row, "Wow! It's amazing / வாவ்! இது அருமை!", was missing from the port. | Restored. The topic has 20 rows, not 19. |
| 18 | Prepositions — other | `as` is glossed போல, and `like` போன்ற. | போல *is* "like". Glossing `as` with the word for `like` teaches the one confusion the relation scene exists to prevent, and the notes' own example uses the -ஆக ending — *டிரைவராக*. The app teaches `as` = ஆக. The source row is unchanged on the reference page. |

### Decisions taken while authoring the place lessons

These are ours, not the source's, and they are listed because the claim
"generated from the source, not retyped" has to stay true of everything else.

- **The example scenes are chosen for drawability.** The source illustrates
  `below` with *the temperature is below zero*, which is not a picture this
  engine can draw. The lesson uses a ball below a table instead. The source
  sentence is still shown on the reference page, unchanged.
- **`here` and `there` have no ground.** The source pairs them with *he is
  standing here / there*. Nothing is drawn for them to be near, so the scene
  carries `ground: null` rather than inventing a second thing.
- **Tamil `on` uses the locative, not the genitive.** The source writes
  *புத்தகம் மேசையின் மீது உள்ளது*. The five cases in `architecture.md` §3.2 do
  not include a genitive, and *புத்தகம் மேசையில் உள்ளது* is correct Tamil for
  the same picture. The source sentence is unchanged on the reference page.
- **Living things take `-இடம்`, not `-இல்`.** `cat`, `dog`, `man` and `woman`
  decline as `பூனையிடம்` / `பூனையிடமிருந்து`. Using `-இல்` for an animate noun
  is the kind of mistake the app exists to stop a learner making.
- **`in front of` is lower-cased.** The source table capitalises `In front of`,
  `There` and `Here` because they begin a cell, not a sentence.

### Which verbs can be drawn, and which are refused

Open question 2 in `architecture.md`, closed in engine 14. The source lists 47
main verbs. A verb drives an `actor` scene only if its action is a visible
change at one of the four anchors a prop declares — a mouth, a hand, a foot or
an eye. Ten are:

```text
eat drink            mouth, chomp    something goes in
read see             hand / eye, gaze  something is looked at
throw give           hand, arc       something leaves the hand
open kick            hand / foot, impact  something is acted on
stand                foot, impact    intransitive
laugh                mouth, chomp    intransitive
```

Every other verb carries `"drawable": false` with its words and no anchor and
no cue. `validate.ts` refuses a lesson whose scene names one, and the renderer
refuses it a second time; the page shows `<CannotDraw>`. **A generic animation
was rejected.** Something moving on the stage while meaning nothing teaches
that `remember` looks like whatever the engine had to hand, and this app exists
to stop a learner drawing the wrong conclusion from a picture.

Three kinds of verb are refused, and they are refused for different reasons:

- **Nothing happens where a body can be seen.** `remember`, `like`, `force`,
  `get`, `work` — the event is inside somebody. No anchor is where it happens.
- **The action is a posture, and every prop is drawn standing.** `sit`,
  `sleep`. A standing figure captioned *the man sits* is exactly the picture
  this product must never draw. `stand` is drawable for the same reason they
  are not: it is what the props already show.
- **The verb needs a second person, and only one is on the stage.** `give` is
  drawn as the thing leaving the hand rather than arriving in another, which is
  as far as one actor goes.

Two verbs sharing a cue is not a defect and is not avoidable: `eat` and `drink`
are both the mouth, and *the man eats* with no object draws what *the man
laughs* draws. The cue is a class of action; the sentence beside the picture is
what names the verb.

## The lexicon

`props.json` carries everything about a prop except its drawing — a function
cannot live in JSON, so engine 10 supplies `draw` and joins the two by id.
Every prop declines in all five cases; `validate.ts` refuses one that does not,
because a missing case is a sentence that cannot be built the moment a knob
asks for it.

The eleven connectives are the exception. They have no lexicon file: a
connective is not a thing that can be drawn, it is the relation itself, and its
two words are what the scene is labelled with — so they live beside the
schematic in `common/scene/renderers/relation.renderer.ts`, the way a prop's
words live beside its drawing. The Tamil is the source's own, with the one
correction in row 18 above.

`verbs.json` is split the same way and for the same reason. It carries the two
languages, whether the verb takes a patient, whether it can be drawn at all,
and which anchor and cue it uses; where the patient sits at that anchor and how
large it is drawn are geometry, and live with the drawing in
`common/scene/renderers/actor.renderer.ts`. The scene engine may not read
`content/`, so the two lists are held to each other by a test in
`common/api/content.api.test.ts` — the one module allowed to see both.
