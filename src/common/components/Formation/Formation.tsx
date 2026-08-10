import { useMemo } from 'react';
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

/** A repeat carries a trailing digit — two places in one sentence — and it is
 *  stripped before anything is looked up. */
export const baseRole = (role: string): string => role.replace(/\d+$/, '');

const colourOf = (role: string): string => COLOUR[baseRole(role)] ?? 'var(--muted)';

/* ---- the geometry ------------------------------------------ */

const WIDTH = 760;
const HEIGHT = 172;
const PAD = 20;
const TA_Y = 40;
const EN_Y = 142;

type Placed = { readonly x: number; readonly token: FormationToken };

/** Spread evenly across the width, both rows on the same rule, so a word's
 *  place on the line means its place in the sentence and nothing else. */
const layOut = (tokens: readonly FormationToken[]): readonly Placed[] =>
  tokens.map((token, index) => ({
    x: Math.round((PAD + ((WIDTH - 2 * PAD) / (tokens.length + 1)) * (index + 1)) * 10) / 10,
    token,
  }));

/** A vertical-tangent bezier, so lines that cross stay readable where they
 *  overlap: leaving each word straight down and arriving straight up means two
 *  curves meet at an angle rather than running together. */
const curve = (from: number, to: number): string =>
  `M${from},${TA_Y + 12} C${from},${TA_Y + 52} ${to},${EN_Y - 56} ${to},${EN_Y - 20}`;

export type FormationProps = {
  readonly spec: FormationSpec;
  readonly className?: string | undefined;
};

export function Formation({ spec, className }: FormationProps): JSX.Element {
  const tamil = useMemo(() => layOut(spec.taTokens), [spec]);
  const english = useMemo(() => layOut(spec.enTokens), [spec]);
  const note = useMemo(() => noteParts(spec), [spec]);

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
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${spec.en} — ${spec.ta}`}
          focusable="false"
        >
          {tamil.flatMap((from) =>
            from.token.roles.flatMap((role) => {
              const to = english.find((candidate) => candidate.token.roles.includes(role));
              if (!to) return [];

              return [
                <path
                  key={`${role}-${from.x}`}
                  d={curve(from.x, to.x)}
                  fill="none"
                  stroke={colourOf(role)}
                  strokeWidth={2.5}
                  opacity={0.55}
                />,
              ];
            }),
          )}

          {tamil.map((placed, index) => (
            <Word key={`ta-${index}`} placed={placed} y={TA_Y} lang="ta" captioned />
          ))}
          {english.map((placed, index) => (
            <Word key={`en-${index}`} placed={placed} y={EN_Y} lang="en" />
          ))}
        </svg>
      </div>
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
