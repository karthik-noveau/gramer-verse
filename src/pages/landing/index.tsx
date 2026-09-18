import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router';

import { BrandLockup, BrandMark } from 'common/components/BrandMark/BrandMark';
import { Button } from 'common/components/Button/Button';
import { Chip } from 'common/components/Chip/Chip';
import { Icon } from 'common/components/Icon/Icon';
import { paths } from 'common/constants/routes';
import { useUiStore } from 'store/ui.store';

import styles from './styles.module.css';

/* ============================================================
   The front door.

   The only route outside the app shell: no sidebar, no topic
   nav, no breadcrumbs. It carries the brand and one way in.

   Its pitch is an interactive sentence, not a screenshot. One
   changed word updates both languages and keeps the grammar
   visible without an automatic animation competing for attention.
   ============================================================ */

const EXAMPLES = {
  in: { ground: 'the box', ta: 'பந்து பெட்டியில் உள்ளது.' },
  on: { ground: 'the box', ta: 'பந்து பெட்டியின் மேல் உள்ளது.' },
  under: { ground: 'the table', ta: 'பந்து மேசைக்குக் கீழே உள்ளது.' },
  behind: { ground: 'the box', ta: 'பந்து பெட்டிக்குப் பின்னால் உள்ளது.' },
  beside: { ground: 'the box', ta: 'பந்து பெட்டியின் அருகில் உள்ளது.' },
} as const;

type DemoWord = keyof typeof EXAMPLES;
const WORDS = Object.keys(EXAMPLES) as readonly DemoWord[];

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
          Explore topics
        </Button>
      </div>
    </header>
  );
}

/* ---- the hero ---------------------------------------------- */

function Hero(): JSX.Element {
  return (
    <section className={styles.hero}>
      <div className={styles.heroCopy}>
        <Eyebrow />
        <h1 className={styles.headline}>
          See how English <em>is built.</em>
        </h1>
        <p className={styles.tagline}>
          Patterns, word roles, and Tamil guidance—together in one calm learning space.
          <span lang="ta">வாக்கிய அமைப்பும் தமிழ் விளக்கமும் ஒரே இடத்தில்.</span>
        </p>
        {/* One way in. Two calls to action asked a visitor who has never seen
            the product to choose between a lesson and practice; /topics is
            where that choice belongs, with the ten of them in front of them. */}
        <p className={styles.cta}>
          <Button variant="primary" size="lg" to={paths.topics()}>
            Start learning
          </Button>
        </p>
        <p className={styles.meta}>Free to learn · no sign-up · nothing locked</p>
      </div>

      <Demo />
    </section>
  );
}

function Eyebrow(): JSX.Element {
  return (
    <p className={styles.eyebrow}>
      <span className={styles.dot} aria-hidden="true" />
      <span>English grammar · <span lang="ta">தமிழ் வழியில்</span></span>
    </p>
  );
}

/* ---- the pitch, working ------------------------------------ */

function Demo(): JSX.Element {
  const [relation, setRelation] = useState<DemoWord>('in');
  const example = EXAMPLES[relation];

  return (
    <div className={styles.demo}>
      <div className={styles.demoIntro}>
        <strong>Build the sentence</strong>
        <span lang="ta">வாக்கியத்தை அமைக்கவும்</span>
      </div>

      <div className={styles.demoBuild} aria-live="polite">
        <p
          className={styles.pieces}
          lang="en"
          aria-label={`The ball is ${relation} ${example.ground}.`}
        >
          <span className={styles.piece}>
            <strong>The ball</strong>
            <small>Subject</small>
          </span>
          <span className={styles.piece}>
            <strong>is</strong>
            <small>Verb</small>
          </span>
          <span className={`${styles.piece} ${styles.activePiece}`}>
            <strong>{relation}</strong>
            <small>Preposition</small>
          </span>
          <span className={styles.piece}>
            <strong>{example.ground}.</strong>
            <small>Object</small>
          </span>
        </p>
        <p className={styles.demoTa} lang="ta">{example.ta}</p>
      </div>

      <div className={styles.demoKnobs} role="group" aria-label="Preposition">
        <span className={styles.hint}>Try another preposition</span>
        {WORDS.map((word) => (
          <Chip
            key={word}
            label={word}
            pressed={word === relation}
            onClick={() => setRelation(word)}
          />
        ))}
      </div>
    </div>
  );
}

/* ---- what a lesson does ------------------------------------ */

const STEPS: readonly { readonly en: string; readonly ta: string; readonly says: string }[] = [
  {
    en: 'Predict',
    ta: 'யூகியுங்கள்',
    says: 'See the situation first and choose the word that fits.',
  },
  {
    en: 'Understand',
    ta: 'புரிந்துகொள்ளுங்கள்',
    says: 'Compare both languages and see how the sentence is formed.',
  },
  {
    en: 'Explore',
    ta: 'மாற்றிப் பாருங்கள்',
    says: 'Change one word and notice what changes around it.',
  },
];

function Steps(): JSX.Element {
  return (
    <section className={styles.band}>
      <div className={styles.bandInner}>
        <div className={styles.bandHead}>
          <p className={styles.sectionLabel}>The learning rhythm</p>
          <h2>From first guess to real understanding.</h2>
          <p lang="ta">பதிலை மட்டும் அல்ல, வாக்கிய அமைப்பையும் புரிந்துகொள்ளுங்கள்.</p>
        </div>
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
