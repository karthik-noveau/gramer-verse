import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';

import { buildSentence, sentenceText, spaceBefore } from 'common/scene/sentence';
import type { Token } from 'common/scene/sentence';
import type { SceneSpec, SentenceTemplates } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   SentenceLine — the two lines under the picture.

   The point of showing both at once is that the same change
   lands in two different places: turn `in` into `on` and the
   English swaps a word in the middle while the Tamil changes an
   ending near the start. So the flash is matched by knob tag and
   never by position — the two words are rarely at the same
   index, and when they are it is a coincidence.
   ============================================================ */

export type SentenceLineProps = {
  readonly scene: SceneSpec;
  readonly templates: SentenceTemplates;
  /** The knob that moved last. Its words flash, in both lines. */
  readonly flash?: string | null;
  readonly className?: string | undefined;
};

/** Long enough to be seen, short enough not to be waited for. Matches the
 *  duration in the stylesheet; a flash that outlives its class would leave the
 *  word lit until the next turn. */
const FLASH_MS = 620;

export function SentenceLine({
  scene,
  templates,
  flash = null,
  className,
}: SentenceLineProps): JSX.Element {
  const sentence = useMemo(() => buildSentence(scene, templates), [scene, templates]);
  const lit = useFlash(flash, scene);

  return (
    <p className={classNames(styles.sentence, className)}>
      <span className={styles.line} lang="en">
        {sentence.en.map((token, index) => (
          <Word key={`${token.knob ?? 'fixed'}-${index}`} token={token} lit={lit} first={index === 0} />
        ))}
      </span>
      <span className={classNames(styles.line, styles.ta)} lang="ta">
        {sentence.ta.map((token, index) => (
          <Word key={`${token.knob ?? 'fixed'}-${index}`} token={token} lit={lit} first={index === 0} />
        ))}
      </span>
    </p>
  );
}

/**
 * One word.
 *
 * Real spaces between the words, not a CSS gap: a sentence spaced by layout
 * alone is one unbroken word to a screen reader and to anything reading
 * `textContent`.
 */
function Word({
  token,
  lit,
  first,
}: {
  readonly token: Token;
  readonly lit: string | null;
  readonly first: boolean;
}): JSX.Element {
  const bound = token.knob !== null;

  return (
    <>
      {first || !spaceBefore(token) ? null : ' '}
      <span
        className={classNames(
          bound && styles.bound,
          bound && token.knob === lit && styles.flash,
        )}
        data-knob={token.knob ?? undefined}
      >
        {token.text}
      </span>
    </>
  );
}

/**
 * Which knob is currently lit.
 *
 * Cleared on a timer, and the timer is restarted rather than queued: a learner
 * pressing the same chip repeatedly should see the word flash again each time,
 * not once for every press in a row afterwards.
 *
 * Keyed on the scene as well as the knob, because turning a knob back to a
 * value it already had leaves `flash` unchanged — the scene is what says
 * something actually moved.
 */
function useFlash(knob: string | null, scene: SceneSpec): string | null {
  const [lit, setLit] = useState<string | null>(null);

  useEffect(() => {
    if (knob === null) return undefined;

    setLit(knob);
    const timer = setTimeout(() => setLit(null), FLASH_MS);
    return () => clearTimeout(timer);
  }, [knob, scene]);

  return lit;
}

/** The sentence as text, for a caller that needs to read it rather than show
 *  it — the page title, or a test. */
export { sentenceText };
