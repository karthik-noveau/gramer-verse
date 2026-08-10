import { useMemo } from 'react';
import type { FormEvent, JSX } from 'react';

import { Breadcrumbs } from 'common/components/Breadcrumbs/Breadcrumbs';
import { Chip } from 'common/components/Chip/Chip';
import { Formation, fromScene } from 'common/components/Formation/Formation';
import { EmptyState } from 'common/components/EmptyState/EmptyState';
import { Stage } from 'common/components/Stage/Stage';
import { paths } from 'common/constants/routes';
import { buildSentence, sentenceText } from 'common/scene/sentence';
import type { PlaceSpec, SentenceTemplates } from 'common/scene/types';
import { CannotDraw } from 'pages/visualizer/components/CannotDraw/CannotDraw';
import { WORDS, knobAllows, modeOf, selectScene, useVisualizerStore } from 'store/visualizer.store';
import type { PlaceKnobs } from 'store/visualizer.store';

import styles from './styles.module.css';

/* ============================================================
   /topics/prepositions/visualizer — every preposition, drawn.

   Under Prepositions rather than at the top level, because the
   scene engine draws a figure against a ground and that is what
   a preposition of place is. No other topic has anything for it
   to stage.

   Two columns. Reading on the left — what was typed, and the
   sentence in both languages. Doing on the right — the picture
   with the controls that move it directly under it.
   ============================================================ */

/** The five tables the source itself groups the prepositions into, which is
 *  the grouping the pictures here are keyed to. */
const GROUPS: readonly { readonly id: string; readonly en: string; readonly ta: string }[] = [
  { id: 'prep-place', en: 'Place', ta: 'இடம்' },
  { id: 'prep-dir', en: 'Direction', ta: 'திசை' },
  { id: 'prep-time', en: 'Time', ta: 'காலம்' },
  { id: 'prep-other', en: 'Other roles', ta: 'மற்றவை' },
];

const EXAMPLES: readonly string[] = [
  'the ball is in the box',
  'a red apple is under the table',
  'three cups are on the table',
  'the cat is behind the chair',
];

/** The sentence under the picture, for a place scene. The lessons carry their
 *  own templates; this page has one sentence to say and says it the same way
 *  every time. */
const TEMPLATE: SentenceTemplates = {
  en: [
    { slot: 'det' },
    { slot: 'adj' },
    { slot: 'figure' },
    { slot: 'be' },
    { slot: 'relation' },
    { slot: 'text', text: 'the' },
    { slot: 'ground' },
    { slot: 'text', text: '.' },
  ],
  ta: [
    { slot: 'det' },
    { slot: 'adj' },
    { slot: 'figure', case: 'nominative' },
    { slot: 'ground', case: 'locative' },
    { slot: 'be' },
    { slot: 'text', text: '.' },
  ],
};

const KNOBS: readonly {
  readonly key: keyof PlaceKnobs;
  readonly en: string;
  readonly ta: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
}[] = [
  {
    key: 'figure',
    en: 'The thing',
    ta: 'பொருள்',
    options: [
      { value: 'ball', label: 'ball' },
      { value: 'apple', label: 'apple' },
      { value: 'cup', label: 'cup' },
      { value: 'book', label: 'book' },
      { value: 'cat', label: 'cat' },
    ],
  },
  {
    key: 'ground',
    en: 'The place',
    ta: 'இடம்',
    options: [
      { value: 'box', label: 'box' },
      { value: 'table', label: 'table' },
      { value: 'chair', label: 'chair' },
      { value: 'tree', label: 'tree' },
    ],
  },
  {
    key: 'determiner',
    en: 'Which one',
    ta: 'எது',
    options: [
      { value: 'a', label: 'a' },
      { value: 'the', label: 'the' },
    ],
  },
  {
    key: 'count',
    en: 'How many',
    ta: 'எத்தனை',
    options: [
      { value: '1', label: 'one' },
      { value: '2', label: 'two' },
      { value: '3', label: 'three' },
    ],
  },
  {
    key: 'adjective',
    en: 'What kind',
    ta: 'எப்படி',
    options: [
      { value: '', label: '—' },
      { value: 'red', label: 'red' },
      { value: 'green', label: 'green' },
      { value: 'big', label: 'big' },
      { value: 'small', label: 'small' },
    ],
  },
];

export default function VisualizerPage(): JSX.Element {
  const typed = useVisualizerStore((state) => state.typed);
  const cannot = useVisualizerStore((state) => state.cannot);
  const group = useVisualizerStore((state) => state.group);
  const word = useVisualizerStore((state) => state.word);
  const setTyped = useVisualizerStore((state) => state.setTyped);
  const submit = useVisualizerStore((state) => state.submit);
  const choose = useVisualizerStore((state) => state.choose);
  const setGroup = useVisualizerStore((state) => state.setGroup);
  const setKnob = useVisualizerStore((state) => state.setKnob);
  const state = useVisualizerStore();

  const scene = useMemo(() => selectScene(state), [state]);
  const mode = modeOf(word, group);
  const words = WORDS[group] ?? [];

  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submit();
  };

  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Topics', href: paths.topics() },
          { label: 'Prepositions', href: paths.topic('prepositions') },
          { label: 'Visualizer' },
        ]}
      />

      <h1 className={styles.title}>Preposition visualizer</h1>

      {/* Above the thing it navigates rather than inside it. */}
      <nav className={styles.groups} aria-label="Preposition group">
        {GROUPS.map((entry) => (
          <Chip
            key={entry.id}
            label={entry.en}
            ta={entry.ta}
            pressed={entry.id === group}
            onClick={() => setGroup(entry.id)}
          />
        ))}
      </nav>

      <div className={styles.columns}>
        <div className={styles.reading}>
          {/* No submit button: a form with a single text field submits on Enter
              by itself, so a button is a second control for the one action the
              field already performs. */}
          <form className={styles.form} role="search" onSubmit={onSubmit}>
            <label className="sr-only" htmlFor="sentence">
              Sentence to draw
            </label>
            <input
              className={styles.input}
              id="sentence"
              type="text"
              value={typed}
              placeholder="the ball is in the box"
              autoComplete="off"
              onChange={(event) => setTyped(event.target.value)}
            />
          </form>

          <p className={styles.examples}>
            {EXAMPLES.map((example) => (
              <Chip
                key={example}
                label={example}
                onClick={() => {
                  setTyped(example);
                  submit(example);
                }}
              />
            ))}
          </p>

          {cannot ? (
            <CannotDraw
              className={styles.cannot}
              unknown={cannot.unknown}
              gaps={cannot.gaps}
              verb={cannot.verb}
              suggestion={cannot.suggestion}
              onTry={(sentence) => {
                setTyped(sentence);
                submit(sentence);
              }}
            />
          ) : null}

          {scene?.kind === 'place' ? <Lines spec={scene} /> : null}

          {/* How the two languages order it. The scene sentence needs no
              authored alignment: it was built slot by slot, so every token
              already knows its job. */}
          {scene?.kind === 'place' ? (
            <Formation className={styles.formation} spec={fromScene(scene, TEMPLATE)} />
          ) : null}
        </div>

        <aside className={styles.doing}>
          <div className={styles.stage}>
            {scene ? (
              <Stage spec={scene} />
            ) : (
              <EmptyState
                title="Nothing to draw"
                body="Choose a preposition, or type a sentence."
                icon="alert"
              />
            )}
          </div>

          <div className={styles.picker} role="group" aria-label="Preposition">
            {words.map((candidate) => (
              <Chip
                key={candidate}
                label={candidate}
                pressed={candidate === word}
                onClick={() => choose(candidate)}
              />
            ))}
          </div>

          {mode === 'scene' ? (
            <section className={styles.build} aria-labelledby="build-head">
              <h2 className={styles.buildHead} id="build-head">
                Change the picture
              </h2>
              <div className={styles.knobs}>
                {KNOBS.map((knob) => (
                  <div className={styles.knob} key={knob.key} role="group" aria-label={`${knob.en} ${knob.ta}`}>
                    <span className={styles.knobLabel}>
                      <span lang="en">{knob.en}</span>
                      <span className={styles.ta} lang="ta">
                        {knob.ta}
                      </span>
                    </span>
                    <div className={styles.knobOptions}>
                      {knob.options.map((option) => (
                        <Chip
                          key={option.value || 'none'}
                          label={option.label}
                          pressed={String(state.place[knob.key] ?? '') === option.value}
                          disabled={!knobAllows(state, knob.key, option.value)}
                          onClick={() => setKnob(knob.key, option.value)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            /* Said, rather than shown as a picker that does nothing. A knob
               that changes nothing is worse than no knob. */
            <p className={styles.diagramNote}>
              <b>This one is a diagram, not a scene.</b> The picture shows what the word means;
              the knobs move a figure against a ground, which is what a preposition of place is.
              <span className={styles.ta} lang="ta">
                {' '}
                இது படவிளக்கம் — மாற்ற முடியாது.
              </span>
            </p>
          )}

        </aside>
      </div>
    </>
  );
}

/**
 * The sentence, in both languages.
 *
 * Neither line is labelled: which language it is in is legible from the
 * script, and the label was the widest thing in a column with none to spare.
 * `lang` is on the line itself, so it is still announced correctly.
 */
function Lines({ spec }: { readonly spec: PlaceSpec }): JSX.Element {
  const sentence = useMemo(() => buildSentence(spec, TEMPLATE), [spec]);

  return (
    <div className={styles.lines}>
      <p className={styles.lineTa} lang="ta">
        {sentenceText(sentence.ta)}
      </p>
      <p className={styles.lineEn} lang="en">
        {sentenceText(sentence.en)}
      </p>
    </div>
  );
}
