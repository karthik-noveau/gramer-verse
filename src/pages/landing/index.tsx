import { useEffect, useRef, useState } from 'react';
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
  const [motionPaused, setMotionPaused] = useState(false);
  return (
    <div className={styles.home} data-motion-paused={motionPaused}>
      <BrandBar />
      <main id="main">
        <Hero motionPaused={motionPaused} onToggleMotion={() => setMotionPaused((paused) => !paused)} />
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
        <Link className={styles.practiceLink} to={paths.practice()}>Practice</Link>
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

function Hero({ motionPaused, onToggleMotion }: {
  readonly motionPaused: boolean;
  readonly onToggleMotion: () => void;
}): JSX.Element {
  return (
    <section className={styles.hero}>
      <HeroBackdrop />
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
      <button
        type="button"
        className={styles.motionToggle}
        onClick={onToggleMotion}
        aria-label={motionPaused ? 'Resume animations' : 'Pause animations'}
      >
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
          {motionPaused
            ? <path d="m5 3 7 5-7 5Z" fill="currentColor" />
            : <path d="M5 4v8M11 4v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
        </svg>
        {motionPaused ? 'Resume motion' : 'Pause motion'}
      </button>
    </section>
  );
}

function HeroBackdrop(): JSX.Element {
  const wave = 'M1030 -100 C650 160 1280 280 1050 500 S520 740 720 1040';
  return (
    <div className={styles.heroBackdrop} aria-hidden="true">
      <div className={styles.waveStage}>
        <svg className={styles.waveArt} viewBox="0 0 1440 900" preserveAspectRatio="none" focusable="false">
          <path className={`${styles.waveLayer} ${styles.waveBack}`} d={`${wave} H1600 V-100Z`} />
          <g className={styles.waveParallax}>
            <path className={`${styles.waveLayer} ${styles.waveFront}`} d={`${wave} H1600 V-100Z`} transform="translate(120 -40)" />
          </g>
          <path className={styles.waveEdge} d={wave} />
          <path className={styles.waveTrace} d={wave} pathLength="1" />
        </svg>
      </div>
      <span className={styles.boxPattern} />
    </div>
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
      <span className={`${styles.orbitRing} ${styles.orbitRingOuter}`}>
        <svg className={styles.orbitPaths} viewBox="0 0 400 400" focusable="false">
          <circle className={styles.orbitEcho} cx="200" cy="200" r="230" pathLength="1" />
          <circle className={styles.orbitLine} cx="200" cy="200" r="200" pathLength="1" />
        </svg>
      </span>
      <span className={styles.orbitPulse} />
      <span className={`${styles.orbitTrack} ${styles.orbitTrackOne}`}><span className={styles.orbitDot} /></span>
      <span className={`${styles.orbitTrack} ${styles.orbitTrackTwo}`}><span className={styles.orbitDot} /></span>
      <span className={`${styles.orbitTrack} ${styles.orbitTrackThree}`}><span className={styles.orbitDot} /></span>
      <span className={`${styles.orbitLabel} ${styles.orbitTenses}`}>
        <svg className={styles.orbitIcon} viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></svg>
        Tenses
      </span>
      <span className={`${styles.orbitLabel} ${styles.orbitVerbs}`}>
        <svg className={styles.orbitIcon} viewBox="0 0 24 24" focusable="false"><path d="m13 3-8 11h6l-1 7 9-12h-6z" /></svg>
        Verbs
      </span>
      <span className={`${styles.orbitLabel} ${styles.orbitNouns}`}>
        <svg className={styles.orbitIcon} viewBox="0 0 24 24" focusable="false"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9zM4 7.5l8 4.5 8-4.5M12 12v9" /></svg>
        Nouns
      </span>
      <span className={`${styles.orbitLabel} ${styles.orbitSentences}`}>
        <svg className={styles.orbitIcon} viewBox="0 0 24 24" focusable="false"><path d="M5 6h14M5 12h14M5 18h9" /></svg>
        Sentences
      </span>
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
  const section = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!section.current || typeof IntersectionObserver === 'undefined') {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      setRevealed(true);
      observer.disconnect();
    }, { threshold: 0.08 });
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={section} className={styles.band} data-revealed={revealed}>
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
          <Link to={paths.practice()}>Practice</Link>
          <Link to={paths.visualizer()}>Visualizer</Link>
        </nav>
      </div>
    </footer>
  );
}
