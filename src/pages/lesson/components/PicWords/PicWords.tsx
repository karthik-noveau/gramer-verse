import { useMemo, useState } from 'react';
import type { CSSProperties, JSX } from 'react';

import { Art, hasArt } from 'common/art/Art';
import { buildSentence } from 'common/scene/sentence';
import type { Token } from 'common/scene/sentence';
import { canTranslit, translitPhrase } from 'common/scene/translit';
import type { SceneSpec, SentenceTemplates } from 'common/scene/types';
import { useSpeech } from 'common/hooks/useSpeech';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   PicWords — the sentence as a row of images.

   For a learner with no English, a word is not a label, it is a
   picture. So the sentence is shown as pictures first and text is
   layered on top a step at a time: Tamil, then how to say the
   English, then the English itself. A learner can stop at whatever
   step they are at and the row still says something.

   Built from the same tokens the sentence line and the formation
   diagram are built from — the sentence is assembled slot by slot,
   so every word already knows its job, and a card cannot disagree
   with the line above it.
   ============================================================ */

/** How much text sits on the pictures. */
export const STEPS = ['Pictures', '+ Tamil', '+ Pronunciation', '+ English'] as const;

const COACH = [
  { en: 'Look at the pictures. Tap each one to hear its English word.', ta: 'படங்களைப் பாருங்கள். ஆங்கிலச் சொல்லைக் கேட்க ஒவ்வொரு படத்தையும் தொடுங்கள்.' },
  { en: 'Now connect each picture to its Tamil meaning.', ta: 'இப்போது ஒவ்வொரு படத்தையும் அதன் தமிழ் பொருளுடன் இணைத்துப் பாருங்கள்.' },
  { en: 'Listen, then say the English sound aloud.', ta: 'உச்சரிப்பைக் கேட்டு, ஆங்கிலச் சொல்லை வாய்விட்டுச் சொல்லுங்கள்.' },
  { en: 'Read the English sentence from left to right.', ta: 'இப்போது ஆங்கில வாக்கியத்தை இடமிருந்து வலமாக வாசியுங்கள்.' },
] as const;

export type PicWordsProps = {
  readonly scene: SceneSpec;
  readonly templates: SentenceTemplates;
  readonly className?: string | undefined;
};

type Card = {
  readonly knob: string | null;
  readonly en: string;
  readonly ta: string;
  /** The word the picture is of. Not always the English word: "the box" is
   *  drawn as a box. */
  readonly word: string;
};

/**
 * English "the box" is two tokens and one idea.
 *
 * Merging the bare article into the ground keeps the cards aligned one to one
 * with the Tamil; left split, the article would dangle with no counterpart and
 * read as a missing word rather than a merged one. The same merge the
 * formation diagram makes, for the same reason.
 */
const merge = (tokens: readonly Token[]): readonly Token[] => {
  const out: Token[] = [];
  let skip = false;

  tokens.forEach((token, index) => {
    if (skip) {
      skip = false;
      return;
    }
    const next = tokens[index + 1];
    if (token.knob === null && token.text === 'the' && next?.knob === 'ground') {
      out.push({ text: `the ${next.text}`, knob: 'ground' });
      skip = true;
      return;
    }
    out.push(token);
  });
  return out;
};

const real = (token: Token): boolean =>
  token.text.trim().length > 0 && !/^[.,?!]+$/.test(token.text);

/** The cards, paired by the knob that owns the word. */
export function cardsOf(scene: SceneSpec, templates: SentenceTemplates): readonly Card[] {
  const sentence = buildSentence(scene, templates);
  const en = merge(sentence.en).filter(real);
  const ta = sentence.ta.filter(real);

  return en.map((token, index) => {
    /* By knob where both sides have one, and by position otherwise: the two
       languages order the same jobs differently, so position alone would pair
       the verb with the place. */
    const match = token.knob !== null ? ta.find((t) => t.knob === token.knob) : ta[index];
    /* "the box" is drawn as a box: the picture is of the noun, not of the
       phrase, and the article has a drawing of its own only when it is the
       word being taught. */
    const bare = token.text.replace(/^(the|a|an)\s+/i, '');

    return {
      knob: token.knob,
      en: token.text,
      ta: match?.text ?? '',
      word: hasArt(bare) ? bare : token.text,
    };
  });
}

export function PicWords({ scene, templates, className }: PicWordsProps): JSX.Element {
  /* Pictures first. A learner meeting the lesson has not asked for the English
     yet, and showing it straight away makes the pictures decoration. */
  const [step, setStep] = useState(0);
  const cards = useMemo(() => cardsOf(scene, templates), [scene, templates]);
  const speech = useSpeech();
  const coach = COACH[step] ?? COACH[0];

  return (
    <div className={classNames(styles.wrap, className)}>
      <section className={styles.coach} aria-live="polite">
        <span className={styles.coachStep}>{step + 1}/4</span>
        <p className={styles.coachCopy}>
          <strong className={styles.coachTa} lang="ta">{coach.ta}</strong>
          <span>{coach.en}</span>
        </p>
      </section>

      <div className={styles.steps} role="group" aria-label="How much to show">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={classNames(styles.step, index === step && styles.stepOn)}
            aria-pressed={index === step}
            onClick={() => setStep(index)}
          >
            {label}
          </button>
        ))}
      </div>

      <ol className={styles.row}>
        {cards.map((card, index) => {
          /* The pronunciation row is tagged Tamil, so it is only shown when
             every word of it really is Tamil — a half-transliterated line is
             worse than none. */
          const say = step >= 2 && canTranslit(card.en) ? translitPhrase(card.en) : null;

          return (
            <li
              key={`${card.en}-${index}`}
              className={styles.card}
              style={{ '--card-index': index } as CSSProperties}
              {...(card.knob ? { 'data-knob': card.knob } : {})}
            >
              <button
                type="button"
                className={styles.cardTap}
                aria-label={`Hear “${card.en}”`}
                disabled={!speech.supported}
                onClick={() => speech.speak(card.en, step === 2 ? 'slow' : 'normal')}
              >
                <span className={styles.art}>
                  {hasArt(card.word) ? (
                    <Art word={card.word} size={44} />
                  ) : (
                    /* `is` has no picture and needs none: it is the one word in
                       the sentence that is not a thing. */
                    <span className={styles.glyph} aria-hidden="true">
                      =
                    </span>
                  )}
                </span>

                {step >= 1 && card.ta ? (
                  <span className={classNames(styles.ta, styles.reveal)} lang="ta">
                    {card.ta}
                  </span>
                ) : null}
                {say ? (
                  <span className={classNames(styles.say, styles.reveal)} lang="ta">
                    {say}
                  </span>
                ) : null}
                {step >= 3 ? <span className={classNames(styles.en, styles.reveal)}>{card.en}</span> : null}
                <span className={styles.tapHint} aria-hidden="true">▶</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
