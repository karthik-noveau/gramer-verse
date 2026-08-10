import { useEffect, useMemo, useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router';

import { BrandLockup, BrandMark } from 'common/components/BrandMark/BrandMark';
import { Button } from 'common/components/Button/Button';
import { Chip } from 'common/components/Chip/Chip';
import { Icon } from 'common/components/Icon/Icon';
import { Stage } from 'common/components/Stage/Stage';
import { paths } from 'common/constants/routes';
import { useContent } from 'common/hooks/useContent';
import { useReducedMotion } from 'common/hooks/useReducedMotion';
import { placeAllows } from 'common/scene/renderers/place.renderer';
import { buildSentence, spaceBefore } from 'common/scene/sentence';
import type { Token } from 'common/scene/sentence';
import type { PlaceRelation, PlaceSpec, PropId, SentenceTemplates } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';
import { useUiStore } from 'store/ui.store';

import styles from './styles.module.css';

/* ============================================================
   The front door.

   The only route outside the app shell: no sidebar, no topic
   nav, no breadcrumbs. It carries the brand and one way in.

   Its pitch is the product running, not a screenshot of it —
   the scene beside the headline is the real renderer with the
   real sentence builder under it, and the words that change it
   are the real controls. Anything that needed a second
   demonstration belongs on the pages that exist for it.
   ============================================================ */

/** The five the demo cycles. `above` is deliberately absent: it needs so much
 *  headroom that the frame would sit mostly empty for every other word. It is
 *  in the lesson, where the stage is full height. */
const WORDS: readonly PlaceRelation[] = ['in', 'on', 'under', 'behind', 'beside'];

/** How long each word holds. Slow enough to read the sentence under it, and
 *  the whole cycle short enough to be seen through before a visitor scrolls. */
const CYCLE_MS = 2200;

/** The part of the stage this card shows. Every position the demo cycles
 *  through sits between y=112 and y=336; the full stage would leave the top
 *  third of the card empty on every word. */
const CROP: readonly [number, number, number, number] = [196, 100, 384, 252];

const id = (value: string): PropId => value as PropId;

const SENTENCE: SentenceTemplates = {
  en: [
    { slot: 'det' },
    { slot: 'figure' },
    { slot: 'be' },
    { slot: 'relation' },
    { slot: 'text', text: 'the' },
    { slot: 'ground' },
    { slot: 'text', text: '.' },
  ],
  ta: [
    { slot: 'figure', case: 'nominative' },
    { slot: 'ground', case: 'locative' },
    { slot: 'be' },
    { slot: 'text', text: '.' },
  ],
};

/** A box has nothing beneath it, so `under` swaps the ground rather than
 *  drawing a lie. The renderer is asked; there is no second list of what fits
 *  under what. */
const sceneFor = (relation: PlaceRelation): PlaceSpec => ({
  kind: 'place',
  figure: id('ball'),
  ground: id(placeAllows(relation, 'box') ? 'box' : 'table'),
  ground2: null,
  relation,
  determiner: 'the',
  count: 1,
  adjective: null,
});

export default function LandingPage(): JSX.Element {
  return (
    <div className={styles.home}>
      <BrandBar />
      <main id="main">
        <Hero />
        <Steps />
      </main>
      <Foot />
    </div>
  );
}

/* ---- the bar ----------------------------------------------- */

function BrandBar(): JSX.Element {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const [stuck, setStuck] = useState(false);

  /* The border only appears once the page has moved under the bar, so the bar
     is a line on a scrolled page and nothing at all on an unscrolled one. */
  useEffect(() => {
    const onScroll = (): void => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={styles.brandbar} data-stuck={String(stuck)}>
      <div className={styles.barInner}>
        <Link className={styles.lockup} to={paths.landing()} aria-label="Grammer-Verse home">
          <BrandLockup size={30} />
        </Link>
        <span className={styles.spacer} />
        <Button
          variant="ghost"
          iconOnly
          aria-label={theme === 'dark' ? 'Switch to the light theme' : 'Switch to the dark theme'}
          onClick={toggleTheme}
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
        </Button>
        <Button variant="primary" to={paths.topics()}>
          Open the app
        </Button>
      </div>
    </header>
  );
}

/* ---- the hero ---------------------------------------------- */

function Hero(): JSX.Element {
  return (
    <section className={styles.hero}>
      <div>
        <Eyebrow />
        <h1 className={styles.headline}>
          English grammar,
          <br />
          <em>drawn</em>.
        </h1>
        <p className={styles.tagline}>
          Change a word, the picture changes.
          <span lang="ta">ஒரு சொல்லை மாற்றுங்கள், படம் மாறும்.</span>
        </p>
        {/* One way in. Two calls to action asked a visitor who has never seen
            the product to choose between a lesson and practice; /topics is
            where that choice belongs, with the ten of them in front of them. */}
        <p className={styles.cta}>
          <Button variant="primary" size="lg" to={paths.topics()}>
            Start
          </Button>
        </p>
        <p className={styles.meta}>Free · works offline · nothing to sign up for</p>
      </div>

      <Demo />
    </section>
  );
}

/**
 * The one number this page quotes, read from the curriculum.
 *
 * It waits for content and the hero does not: a blank hero during load defeats
 * the purpose of the page, and a missing count for half a second is a chip
 * that arrives, not a page that is broken.
 */
function Eyebrow(): JSX.Element {
  const content = useContent();
  const counted =
    content.status === 'ready'
      ? `${content.topics.length} topics · ${content.lessons.length} lessons`
      : null;

  return (
    <p className={styles.eyebrow}>
      <span className={styles.dot} aria-hidden="true" />
      <span>
        {counted ?? 'English grammar, drawn'} · English &amp; <span lang="ta">தமிழ்</span>
      </span>
    </p>
  );
}

/* ---- the pitch, working ------------------------------------ */

function Demo(): JSX.Element {
  const reduced = useReducedMotion();
  const [relation, setRelation] = useState<PlaceRelation>('in');
  const [touched, setTouched] = useState(false);

  /* Cycles gently until the visitor takes over, so the page demonstrates
     itself without needing a click — and rewards them if they do. Never
     starts for a visitor who asked for reduced motion. */
  useEffect(() => {
    if (touched || reduced) return undefined;

    const timer = setInterval(() => {
      setRelation((current) => {
        const next = WORDS[(WORDS.indexOf(current) + 1) % WORDS.length];
        return next ?? current;
      });
    }, CYCLE_MS);

    return () => clearInterval(timer);
  }, [touched, reduced]);

  const scene = useMemo(() => sceneFor(relation), [relation]);
  const sentence = useMemo(() => buildSentence(scene, SENTENCE), [scene]);

  return (
    <div className={styles.demo}>
      <div className={styles.demoHead}>
        <span className={styles.live}>Live</span>
        <span className={styles.spacer} />
        <span>Prepositions · lesson 1</span>
      </div>

      <div className={styles.demoStage}>
        <Stage spec={scene} viewBox={CROP} />
      </div>

      <div className={styles.demoSay}>
        <p className={styles.demoEn} lang="en">
          {sentence.en.map((token, index) => (
            <Word key={`en-${index}`} token={token} first={index === 0} />
          ))}
        </p>
        <p className={styles.demoTa} lang="ta">
          {sentence.ta.map((token, index) => (
            <Word key={`ta-${index}`} token={token} first={index === 0} />
          ))}
        </p>
      </div>

      <div className={styles.demoKnobs} role="group" aria-label="Preposition">
        <span className={styles.hint}>Tap a word</span>
        {WORDS.map((word) => (
          <Chip
            key={word}
            label={word}
            pressed={word === relation}
            onClick={() => {
              setTouched(true);
              setRelation(word);
            }}
          />
        ))}
      </div>
    </div>
  );
}

/** One word of the demo sentence. The preposition is picked out, because it is
 *  the word the chips change. Real spaces between the words — and none in
 *  front of the full stop, which is a token like any other. */
function Word({ token, first }: { readonly token: Token; readonly first: boolean }): JSX.Element {
  return (
    <>
      {first || !spaceBefore(token) ? null : ' '}
      <span className={classNames(token.knob === 'relation' && styles.said)}>{token.text}</span>
    </>
  );
}

/* ---- what a lesson does ------------------------------------ */

const STEPS: readonly { readonly en: string; readonly ta: string; readonly says: string }[] = [
  {
    en: 'Predict',
    ta: 'யூகியுங்கள்',
    says: 'A situation, four words, no hint. Being wrong here is the point.',
  },
  {
    en: 'Reveal',
    ta: 'சரியான பதில்',
    says: 'What you said, beside what is true, and one line saying why.',
  },
  {
    en: 'Turn the knobs',
    ta: 'சொல்லை மாற்றுங்கள்',
    says: 'Every word is a control. Change one, the drawing changes with it.',
  },
];

function Steps(): JSX.Element {
  return (
    <section className={styles.band}>
      <div className={styles.bandInner}>
        <ol className={styles.steps}>
          {STEPS.map((step, index) => (
            <li className={styles.step} key={step.en}>
              <span className={styles.n}>{index + 1}</span>
              <h2 className={styles.stepTitle}>
                {step.en}{' '}
                <span className={styles.stepTa} lang="ta">
                  {step.ta}
                </span>
              </h2>
              <p className={styles.stepSays}>{step.says}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---- the foot ---------------------------------------------- */

function Foot(): JSX.Element {
  return (
    <footer className={styles.foot}>
      <div className={styles.footInner}>
        <span className={styles.footLockup}>
          <BrandMark size={18} />
          Grammer-Verse
        </span>
        <span className={styles.spacer} />
        <nav aria-label="Footer">
          <Link to={paths.topics()}>Topics</Link>
          <Link to={paths.visualizer()}>Visualizer</Link>
        </nav>
      </div>
    </footer>
  );
}
