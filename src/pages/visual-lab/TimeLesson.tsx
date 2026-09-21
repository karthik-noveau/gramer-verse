import { useState } from 'react';
import type { JSX } from 'react';
import { Kitchen, LabIcon } from 'common/visual-learning/art';
import { MOMENTS } from 'common/visual-learning/data';
import { Insight, PlaybackBar, Sentence } from 'common/visual-learning/shared';
import { usePlayback } from 'common/visual-learning/usePlayback';
import styles from 'common/visual-learning/styles.module.css';

export default function TimeLesson({ showTamil }: { showTamil: boolean }): JSX.Element {
  const playback = usePlayback(12000, .5, true);
  const index = Math.min(2, Math.floor(playback.progress * 3));
  const moment = MOMENTS[index]!;
  const [guess, setGuess] = useState<number | null>(null);
  return <div className={styles.workspace}>
    <div className={styles.visualColumn}>
      <div className={styles.stageHeading}><span><span className={styles.liveDot} /> SAME KITCHEN. A DIFFERENT TIME.</span><span>02 / 03</span></div>
      <div className={styles.kitchenStage}>
        <div className={styles.timeBadge} key={moment.id}><span>{moment.label}</span><i />{moment.cue}</div>
        <Kitchen moment={index} progress={playback.progress} reduced={playback.reduced} />
      </div>
      <PlaybackBar playback={playback} label="Play timeline" scrub={false} caption="Yesterday → now → tomorrow" />
      <div className={styles.timeline}>
        <label htmlFor="time-travel" className="sr-only">Travel through time</label>
        <input id="time-travel" type="range" min="0" max="2" step="1" value={index} aria-valuetext={moment.label} onChange={(event) => playback.seek(MOMENTS[Number(event.target.value)]!.position)} />
        <div className={styles.timeStops}>{MOMENTS.map((item, i) => <button type="button" key={item.id} aria-pressed={index === i} onClick={() => playback.seek(item.position)}><span>{item.label}</span><small>{['Before now', 'Right now', 'After now'][i]}</small></button>)}</div>
      </div>
      <Sentence english={moment.sentence} tamil={moment.ta} showTamil={showTamil}>She <mark key={moment.id}>{moment.verb}</mark> {moment.label.toLowerCase()}.</Sentence>
    </div>
    <aside className={styles.lessonControls}>
      <span className={styles.eyebrow}>FOLLOW THE ACTION</span><h2>When does it happen?</h2>
      <p className={styles.controlIntro}>Slide through time. Watch the kitchen and the action words change together.</p>
      <div className={styles.tenseCard} aria-live="polite"><span className={styles.tenseNumber}>0{index + 1}</span><span className={styles.eyebrow}>{moment.name}</span><h3>{moment.verb}</h3><p>{moment.meaning}</p></div>
      <Insight>{moment.scene}</Insight>
      <div className={styles.challenge}>
        <span className={styles.eyebrow}>YOUR TURN</span><p>The cooking is happening <strong>right now</strong>. Which words fit?</p>
        <div className={styles.quizOptions}>{MOMENTS.map((item, i) => <button type="button" key={item.id} onClick={() => setGuess(i)} aria-pressed={guess === i} data-result={guess === i ? (i === 1 ? 'correct' : 'retry') : undefined}>{item.verb}{guess === i && i === 1 && <LabIcon name="check" size={16} />}</button>)}</div>
        <p className={styles.feedback} role="status">{guess === null ? 'Look for an action still in progress.' : guess === 1 ? 'Exactly. “Is cooking” means it is happening now.' : guess === 0 ? '“Cooked” puts the action in the past. Try again.' : '“Will cook” puts the action in the future. Try again.'}</p>
      </div>
    </aside>
  </div>;
}
