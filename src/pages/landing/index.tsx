import { useEffect, useState } from 'react';
import type { JSX } from 'react';
import { Link } from 'react-router';

import { BrandLockup, BrandMark } from 'common/components/BrandMark/BrandMark';
import { Button } from 'common/components/Button/Button';
import { Icon } from 'common/components/Icon/Icon';
import { paths } from 'common/constants/routes';
import { useUiStore } from 'store/ui.store';

import styles from './styles.module.css';

/* ============================================================
   The front door.

   The only route outside the app shell: no sidebar, no topic
   nav, no breadcrumbs. It carries the brand and one way in.

   The first screen is deliberately editorial rather than a demo:
   one promise, one way in, then a short account of how learning works.
   ============================================================ */

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
      <GrammarOrbit />
      <CurriculumRibbon />
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

function GrammarOrbit(): JSX.Element {
  return (
    <div className={styles.orbit} aria-hidden="true">
      <span className={`${styles.orbitRing} ${styles.orbitRingOuter}`} />
      <span className={`${styles.orbitRing} ${styles.orbitRingInner}`} />
      <span className={`${styles.orbitDot} ${styles.orbitDotOne}`} />
      <span className={`${styles.orbitDot} ${styles.orbitDotTwo}`} />
      <span className={`${styles.orbitDot} ${styles.orbitDotThree}`} />
      <span className={`${styles.orbitLabel} ${styles.orbitTenses}`}>Tenses</span>
      <span className={`${styles.orbitLabel} ${styles.orbitVerbs}`}>Verbs</span>
      <span className={`${styles.orbitLabel} ${styles.orbitNouns}`}>Nouns</span>
      <span className={`${styles.orbitLabel} ${styles.orbitSentences}`}>Sentences</span>
      <span className={styles.orbitCore}>
        <BrandMark className={styles.orbitMark ?? ''} size={112} />
        <small>Grammar, connected</small>
      </span>
    </div>
  );
}

const FOUNDATIONS = [
  { en: 'Tenses', ta: 'காலங்கள்' },
  { en: 'Verbs', ta: 'வினைச்சொல்' },
  { en: 'Nouns', ta: 'பெயர்ச்சொல்' },
  { en: 'Prepositions', ta: 'இடைச்சொல்' },
  { en: 'Sentence formation', ta: 'வாக்கிய அமைப்பு' },
] as const;

function CurriculumRibbon(): JSX.Element {
  return (
    <ul className={styles.curriculum} aria-label="Curriculum preview">
      {FOUNDATIONS.map((topic) => (
        <li key={topic.en}>
          <span>{topic.en}</span>
          <span lang="ta">{topic.ta}</span>
        </li>
      ))}
    </ul>
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
        <ol className={styles.steps} aria-label="How learning works">
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
