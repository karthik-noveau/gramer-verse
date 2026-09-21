import { useMemo, useState } from 'react';
import type { JSX } from 'react';

import { buildSentence } from 'common/scene/sentence';
import type { Token } from 'common/scene/sentence';
import type { FormationSpec, FormationToken, SceneSpec, SentenceTemplates } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   Formation — how the sentence is built, drawn.

   English and Tamil say the same thing in a different order, and
   sometimes with a different number of words. Telling a learner
   that is a rule to be believed. Drawing a line from each
   English word to the Tamil word that does its job makes it
   something they can see:

     - the lines cross, because the verb moves to the end
     - two lines land on one Tamil word, because English needs
       `in` + `the box` where Tamil fuses both into பெட்டியில்
     - some English words have no line at all, because Tamil has
       no article

   Colour is the word's job, not its language: the same roles are
   used here and in the scene, so "orange is the thing" holds
   everywhere.
   ============================================================ */

/** The eight jobs, and the token each one is drawn in. Every one is a custom
 *  property from `theme/colours.css`, so the diagram follows the theme. */
const COLOUR: Readonly<Record<string, string>> = {
  det: 'var(--r-det)',
  figure: 'var(--r-figure)',
  rel: 'var(--r-rel)',
  ground: 'var(--r-ground)',
  be: 'var(--r-be)',
  qual: 'var(--r-qual)',
  ask: 'var(--r-ask)',
  join: 'var(--r-join)',
};

/** What each job is called, for the one caption on the picture. Tamil only:
 *  it is said to the reader who needs it. */
const LABEL_TA: Readonly<Record<string, string>> = {
  det: 'எது',
  figure: 'பொருள்',
  rel: 'தொடர்பு',
  ground: 'இடம்',
  be: 'வினை',
  qual: 'எப்படி',
  ask: 'வினா',
  join: 'இணைப்பு',
};

const LABEL_EN: Readonly<Record<string, string>> = {
  det: 'Determiner',
  figure: 'Subject',
  rel: 'Preposition',
  ground: 'Object',
  be: 'Verb',
  qual: 'Modifier',
  ask: 'Question word',
  join: 'Conjunction',
};

/** A repeat carries a trailing digit — two places in one sentence — and it is
 *  stripped before anything is looked up. */
export const baseRole = (role: string): string => role.replace(/\d+$/, '');

const colourOf = (role: string): string => COLOUR[baseRole(role)] ?? 'var(--muted)';

const QUESTION = /^(what|when|where|why|who|whose|which|how(?:\s+(?:much|many|long|far|old|often))?)$/i;
const ARTICLE = /^(a|an|the)$/i;
const PRONOUN = /^(i|we|you|he|she|it|they)$/i;
const MODAL = /^(can|could|will|would|may|might|must|shall|should|ought to)$/i;
const AUXILIARY = /^(am|is|are|was|were|be|been|being|has|have|had|do|does|did|will)$/i;
const TIME_PHRASE = /\b(now|today|tonight|yesterday|tomorrow|hour|day|week|month|year|morning|evening|since|ago)\b/i;

/** A readable English grammar pattern derived from the diagram's own tokens. */
export const sentencePattern = (tokens: readonly FormationToken[]): readonly {
  readonly label: string;
  readonly role: string;
}[] =>
  tokens.map((token, index) => {
    const explicit = token.roles[0];
    const text = token.text.trim();
    const inferred = ARTICLE.test(text) ? 'det' : PRONOUN.test(text) ? 'figure' : '';
    const role = baseRole(explicit ?? inferred);
    const firstWord = tokens[0]?.text.trim() ?? '';
    const invertedQuestion = MODAL.test(firstWord) || AUXILIARY.test(firstWord);
    const imperativeObject = role === 'figure' && index > 0 && !invertedQuestion &&
      baseRole(tokens[0]?.roles[0] ?? '') === 'be';

    let label = LABEL_EN[role] ?? 'Word';
    if (QUESTION.test(text)) label = 'Question Word';
    else if (MODAL.test(text) || role === 'be') label = 'Verb';
    else if (imperativeObject) label = 'Object';
    else if (role === 'qual' && TIME_PHRASE.test(text)) label = 'Time Phrase';
    else if (role === '' && AUXILIARY.test(text)) label = 'Verb';

    return { label, role };
  });

/* ---- the geometry ------------------------------------------ */

const WIDTH = 760;
const PAD = 20;
const TA_Y = 35;
const PATTERN_HEIGHT = 22;
const patternWidth = (label: string): number => Math.max(54, label.length * 6 + 24);

type Placed = { readonly x: number; readonly token: FormationToken };
type Connection = { readonly role: string; readonly from: Placed; readonly to: Placed };
type RoutedConnection = Connection & {
  readonly fromX: number;
  readonly toX: number;
  readonly bend: number;
};

/** Reserve space for the whole phrase, including Tamil vowel signs, before
 *  adding the gaps. Fused place phrases can be much longer
 *  than the words on either side of them. */
const tokenWidth = (token: FormationToken): number => Math.max(
  96,
  Array.from(token.text).reduce((width, letter) =>
    width + (/\s/u.test(letter) ? 5 : /[\u0B80-\u0BFF]/u.test(letter) ? 12 : 10), 0),
);

const rowWidth = (tokens: readonly FormationToken[]): number =>
  2 * PAD + tokens.reduce((width, token) => width + tokenWidth(token), 0) + (tokens.length + 1) * 28;

const layOut = (tokens: readonly FormationToken[], width: number): readonly Placed[] => {
  const occupied = tokens.reduce((total, token) => total + tokenWidth(token), 0);
  const gap = Math.min(48, (width - 2 * PAD - occupied) / (tokens.length + 1));
  let edge = PAD;

  return tokens.map((token) => {
    const span = tokenWidth(token);
    const x = Math.round((edge + span / 2) * 10) / 10;
    edge += span + gap;
    return { x, token };
  });
};

const CONNECTION_TOP = TA_Y + 14;
const PORT_GAP = 12;

/** Separate the ports beneath a fused word, ordered by their destination.
 *  Each role remains traceable instead of merging into one shared stem. */
const connectionPorts = (tamil: readonly Placed[], english: readonly Placed[]): readonly RoutedConnection[] => {
  const links: Connection[] = tamil.flatMap((from) => from.token.roles.flatMap((role) => {
    const to = english.find((candidate) => candidate.token.roles.includes(role));
    return to ? [{ role, from, to }] : [];
  }));

  return links.map((link, index) => {
    const outgoing = links.filter((other) => other.from === link.from)
      .sort((a, b) => a.to.x - b.to.x);
    const incoming = links.filter((other) => other.to === link.to)
      .sort((a, b) => a.from.x - b.from.x);
    return {
      ...link,
      fromX: link.from.x + (outgoing.indexOf(link) - (outgoing.length - 1) / 2) * PORT_GAP,
      toX: link.to.x + (incoming.indexOf(link) - (incoming.length - 1) / 2) * PORT_GAP,
      bend: links.length > 1 ? .3 + .4 * index / (links.length - 1) : .5,
    };
  });
};

/** Curves leave and arrive vertically, directly beneath their words. Varying
 *  their bend heights spreads crossings without pushing endpoints sideways. */
const connectionPath = (from: number, to: number, bend: number, bottom: number): string => {
  if (from === to) return `M${from},${CONNECTION_TOP} V${bottom}`;
  const controlY = Math.round((CONNECTION_TOP + (bottom - CONNECTION_TOP) * bend) * 10) / 10;
  return `M${from},${CONNECTION_TOP} C${from},${controlY} ${to},${controlY} ${to},${bottom}`;
};

export type FormationProps = {
  readonly spec: FormationSpec;
  readonly className?: string | undefined;
  readonly showPattern?: boolean | undefined;
  readonly onTogglePattern?: (() => void) | undefined;
  readonly showPatternToggle?: boolean | undefined;
};

export function Formation({
  spec,
  className,
  showPattern,
  onTogglePattern,
  showPatternToggle = true,
}: FormationProps): JSX.Element {
  const width = useMemo(() => Math.max(WIDTH, rowWidth(spec.taTokens), rowWidth(spec.enTokens)), [spec]);
  const tamil = useMemo(() => layOut(spec.taTokens, width), [spec, width]);
  const english = useMemo(() => layOut(spec.enTokens, width), [spec, width]);
  const connections = useMemo(() => connectionPorts(tamil, english), [tamil, english]);
  const connectionBottom = CONNECTION_TOP + 92 + Math.min(40, Math.max(0, connections.length - 4) * 8);
  const englishY = connectionBottom + 22;
  const patternTop = englishY + 28;
  const height = patternTop + PATTERN_HEIGHT + 16;
  const note = useMemo(() => noteParts(spec), [spec]);
  const pattern = useMemo(() => sentencePattern(spec.enTokens), [spec]);
  const [internalPattern, setInternalPattern] = useState(true);
  const patternShown = showPattern ?? internalPattern;
  const togglePattern = onTogglePattern ?? (() => setInternalPattern((shown) => !shown));

  return (
    <div className={classNames(styles.formation, className)}>
      {/* One line, Tamil only, and nothing at all when the row has nothing to
          report. It is the one thing on the card written for a reader with no
          English — the rest is the English sentence and a diagram of it. */}
      {note.length > 0 ? (
        <p className={styles.note} lang="ta">
          {note.map((part, index) =>
            part.en ? (
              <b key={index} className={styles.noteEn} lang="en">
                {part.text}
              </b>
            ) : (
              <span key={index}>{part.text}</span>
            ),
          )}
        </p>
      ) : null}

      {/* The diagram scrolls, not the card: on a phone the drawing is wider
          than the screen and the note above it is not, so scrolling the whole
          card would drag the sentence sideways with the picture. */}
      <div className={styles.scroll}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${width} ${height}`}
          style={{
            minWidth: `calc(${width}px * var(--formation-scale, 1))`,
            maxWidth: `max(${width}px, var(--formation-max-width, 760px))`,
          }}
          role="img"
          aria-label={`${spec.en} — ${spec.ta}`}
          focusable="false"
        >
          {connections.map(({ role, from, to, fromX, toX, bend }) => {
            const d = connectionPath(fromX, toX, bend, connectionBottom);
            const colour = colourOf(role);
            return (
              <g key={`${role}-${from.x}`} aria-hidden="true">
                {/* The canvas-coloured outline separates crossing paths without
                    changing their meaning or introducing another colour. */}
                <path
                  className={styles.connectionHalo}
                  d={d}
                  fill="none"
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                <path
                  data-connection-role={role}
                  data-source-x={from.x}
                  data-target-x={to.x}
                  d={d}
                  fill="none"
                  stroke={colour}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                {[[fromX, CONNECTION_TOP], [toX, connectionBottom]].map(([x, y], index) => (
                  <circle
                    key={index}
                    className={styles.connectionPort}
                    cx={x}
                    cy={y}
                    r={2.5}
                    fill={colour}
                    strokeWidth={1}
                  />
                ))}
              </g>
            );
          })}

          {tamil.map((placed, index) => (
            <Word key={`ta-${index}`} placed={placed} y={TA_Y} lang="ta" captioned />
          ))}
          {english.map((placed, index) => (
            <Word key={`en-${index}`} placed={placed} y={englishY} lang="en" />
          ))}

          {patternShown ? (
            <g
              aria-label={pattern.map((part) => part.label).join(' + ')}
              data-testid="sentence-formation"
            >
              {english.map((placed, index) => {
                const part = pattern[index];
                const label = part?.label ?? 'Word';
                const colour = colourOf(part?.role ?? '');
                const chipWidth = patternWidth(label);
                const previous = english[index - 1];
                const previousWidth = patternWidth(pattern[index - 1]?.label ?? 'Word');
                const connectorX = previous
                  ? (previous.x + previousWidth / 2 + placed.x - chipWidth / 2) / 2
                  : 0;
                return (
                  <g key={`pattern-${index}`}>
                    {previous ? <text
                      x={connectorX}
                      y={patternTop + PATTERN_HEIGHT / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="var(--font)"
                      fontSize={15}
                      fontWeight={400}
                      fill="var(--muted)"
                      opacity={0.75}
                      aria-hidden="true"
                    >+</text> : null}
                    <rect
                      x={placed.x - chipWidth / 2}
                      y={patternTop}
                      width={chipWidth}
                      height={PATTERN_HEIGHT}
                      rx={6}
                      fill={`color-mix(in srgb, ${colour} 10%, var(--surface))`}
                      stroke={colour}
                      strokeOpacity={0.35}
                      strokeWidth={0.75}
                      aria-hidden="true"
                    />
                    <text
                      className={styles.patternLabel}
                      x={placed.x}
                      y={patternTop + PATTERN_HEIGHT / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="var(--font)"
                      fontSize={11}
                      fontWeight={600}
                      fill={colour}
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
            </g>
          ) : null}
        </svg>
      </div>

      {showPatternToggle ? (
        <button
          type="button"
          className={styles.patternToggle}
          aria-expanded={patternShown}
          onClick={togglePattern}
        >
          {patternShown ? 'Hide' : 'Show'} sentence formation
        </button>
      ) : null}
    </div>
  );
}

function Word({
  placed,
  y,
  lang,
  captioned = false,
}: {
  readonly placed: Placed;
  readonly y: number;
  readonly lang: 'en' | 'ta';
  readonly captioned?: boolean;
}): JSX.Element {
  const roles = placed.token.roles;
  const first = roles[0];

  return (
    <>
      {/* Only the fused token is captioned, and only in Tamil: it is the one
          thing on the picture that needs saying. */}
      {captioned && roles.length > 1 ? (
        <text
          className={styles.caption}
          x={placed.x}
          y={y - 17}
          textAnchor="middle"
          fontFamily="var(--tamil)"
          fontSize={11}
          fill="var(--muted)"
          xmlLang="ta"
        >
          {roles.map((role) => LABEL_TA[baseRole(role)] ?? role).join(' + ')}
        </text>
      ) : null}

      <text
        className={styles.word}
        x={placed.x}
        y={y}
        textAnchor="middle"
        fontFamily={lang === 'ta' ? 'var(--tamil)' : 'var(--serif)'}
        fontSize={15}
        fontWeight={roles.length > 0 ? 600 : 400}
        opacity={roles.length > 0 ? 1 : 0.55}
        fill={first ? colourOf(first) : 'var(--muted)'}
        xmlLang={lang}
      >
        {placed.token.text}
      </text>
    </>
  );
}

/**
 * What the picture is trying to say, in one line.
 *
 * Derived from the alignment rather than written per row, so it can never
 * drift from what is actually drawn. Nothing is said about the verb moving to
 * the end: it is true of every row here, so it printed on every card — and the
 * crossing lines say it better than a sentence repeated a hundred times.
 */
/** A run of the note, and whether it is one of the English words the note is
 *  about. The line is Tamil and the English words inside it are its subject,
 *  so they are set apart rather than left to blend into the sentence. */
export type NotePart = { readonly text: string; readonly en: boolean };

export function noteParts(spec: FormationSpec): readonly NotePart[] {
  const fused = spec.taTokens.find((token) => token.roles.length > 1);
  const orphans = spec.enTokens.filter((token) => token.roles.length === 0);
  const parts: NotePart[] = [];

  if (fused) {
    const pair = spec.enTokens
      .filter((token) => token.roles.some((role) => fused.roles.includes(role)))
      .map((token) => token.text)
      .join(' + ');
    parts.push(
      { text: 'ஆங்கிலத்தில் இரண்டு சொல் — ', en: false },
      { text: pair, en: true },
      { text: `. தமிழில் ஒரே சொல் — ${fused.text}.`, en: false },
    );
  }
  if (orphans.length > 0) {
    if (parts.length > 0) parts.push({ text: ' ', en: false });
    parts.push(
      { text: orphans.map((token) => token.text).join(', '), en: true },
      { text: ' — தமிழில் தனிச் சொல் இல்லை.', en: false },
    );
  }

  return parts;
}

export function noteFor(spec: FormationSpec): string {
  return noteParts(spec)
    .map((part) => part.text)
    .join('');
}

/* ---- from a live scene ------------------------------------- */

/** Which job each knob's word does. The table rows need authored alignments
 *  because nothing in the source says which Tamil word carries `in`; a scene
 *  sentence needs none, because it was built slot by slot and every token
 *  already knows its job. */
function rolesOf(knob: string | null, lang: 'en' | 'ta'): readonly string[] {
  if (knob === 'figure') return ['figure'];
  if (knob === 'ground') {
    /* In English `in` is its own word; in Tamil the relation is an ending on
       the place, so the Tamil token carries both jobs and takes two lines.
       That fusion is the point of the picture. */
    return lang === 'ta' ? ['rel', 'ground'] : ['ground'];
  }
  if (knob === 'relation') return ['rel'];
  if (knob === 'determiner' || knob === 'count' || knob === 'adjective') return ['det'];
  return ['be'];
}

/**
 * The same diagram for a live scene, with no authored alignment.
 *
 * One formation renderer rather than a second copy that drifts.
 */
export function fromScene(spec: SceneSpec, templates: SentenceTemplates): FormationSpec {
  const sentence = buildSentence(spec, templates);

  /* English "the box" is two tokens and one idea. Merging the bare article
     into the ground keeps the rows aligned one to one; left split, the article
     would dangle with no Tamil counterpart and read as a missing word rather
     than a merged one. */
  const merged: Token[] = [];
  let skip = false;
  sentence.en.forEach((token, index) => {
    if (skip) {
      skip = false;
      return;
    }
    const next = sentence.en[index + 1];
    if (token.knob === null && token.text === 'the' && next?.knob === 'ground') {
      merged.push({ text: `the ${next.text}`, knob: 'ground' });
      skip = true;
      return;
    }
    merged.push(token);
  });

  const asTokens = (tokens: readonly Token[], lang: 'en' | 'ta'): readonly FormationToken[] =>
    tokens
      .filter((token) => token.text.trim().length > 0 && !/^[.,?!]+$/.test(token.text))
      .map((token) => ({ text: token.text, roles: rolesOf(token.knob, lang) }));

  const said = (tokens: readonly FormationToken[]): string =>
    tokens.map((token) => token.text).join(' ');

  const enTokens = asTokens(merged, 'en');
  const taTokens = asTokens(sentence.ta, 'ta');

  return { en: said(enTokens), ta: said(taTokens), enTokens, taTokens };
}
