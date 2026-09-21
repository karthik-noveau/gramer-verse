import type { JSX, ReactNode } from 'react';
import { useSpeech } from 'common/hooks/useSpeech';
import { LabIcon } from './art';
import type { Playback } from './usePlayback';
import styles from './styles.module.css';

export function PlaybackBar({ playback, label = 'Play animation', scrub = true, caption = 'Watch all five positions' }: { playback: Playback; label?: string; scrub?: boolean; caption?: string }): JSX.Element {
  return <div className={styles.playback}>
    <button type="button" className={styles.playButton} onClick={playback.toggle} aria-label={playback.running ? 'Pause animation' : label} title={playback.running ? 'Pause' : label}><LabIcon name={playback.running ? 'pause' : 'play'} size={17} /></button>
    <button type="button" className={styles.iconButton} onClick={playback.replay} aria-label="Replay animation" title="Replay"><LabIcon name="replay" size={17} /></button>
    {scrub ? <input className={styles.progress} type="range" min="0" max="100" step=".1" value={playback.progress * 100} onChange={(event) => playback.seek(Number(event.target.value) / 100)} aria-label="Animation progress" /> : <span className={styles.playLabel}>{caption}</span>}
    <button type="button" className={styles.speedButton} aria-label="Slow animation" aria-pressed={playback.slow} onClick={playback.toggleSlow}>{playback.slow ? '0.5×' : '1×'}</button>
  </div>;
}

export function Sentence({ children, english, tamil, showTamil }: { children: ReactNode; english: string; tamil: string; showTamil: boolean }): JSX.Element {
  const speech = useSpeech();
  return <div className={styles.sentenceBar}>
    <div aria-live="polite" aria-atomic="true">
      <div className={styles.sentence}>{children}</div>
      {showTamil && <p className={styles.tamil} lang="ta">{tamil}</p>}
    </div>
    <button type="button" className={styles.listenButton} disabled={!speech.supported} onClick={() => speech.speaking ? speech.stop() : speech.speak(english)} aria-label={speech.speaking ? 'Stop listening' : 'Listen to the sentence'} title="Listen to the sentence"><LabIcon name={speech.speaking ? 'pause' : 'sound'} size={19} /></button>
  </div>;
}

export function Insight({ children, label = 'Notice this' }: { children: ReactNode; label?: string }): JSX.Element {
  return <div className={styles.insight}><span className={styles.insightIcon} aria-hidden="true">✧</span><div><strong>{label}</strong><p>{children}</p></div></div>;
}
