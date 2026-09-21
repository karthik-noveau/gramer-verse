import type { JSX } from 'react';
import type { TimeRelation } from 'common/scene/types';
import { LabIcon } from 'common/visual-learning/art';
import { PlaybackBar } from 'common/visual-learning/shared';
import { usePlayback } from 'common/visual-learning/usePlayback';
import { PrepositionPicture } from './components/PrepositionPicture/PrepositionPicture';
import type { SceneSpec } from 'common/scene/types';
import styles from './styles.module.css';

export function timeObservation(word: string, progress: number): string {
  if (word === 'before') return progress < .8 ? 'Earlier than 8 AM — this is before the reference time.' : 'At or after 8 AM — this is no longer before it.';
  if (word === 'after') return progress > .25 ? 'Later than lunch — this is after the reference event.' : 'Lunch has not finished yet — this is not after it.';
  if (word === 'by') return progress <= .8 ? 'Completion here meets the deadline: at or before 6 PM.' : 'Completion here misses the deadline: later than 6 PM.';
  if (word === 'until') return progress < .8 ? 'The waiting continues up to the arrival.' : 'The endpoint is reached. The waiting ends here.';
  if (word === 'since') return progress < .2 ? 'Before 2010: the situation shown has not started.' : progress < .8 ? 'Living here continues from 2010 towards now.' : 'Now: the situation has continued from 2010 to the present.';
  return progress < .2 ? 'Before the movie — outside the event.' : progress <= .8 ? 'Within the movie — something here happens during it.' : 'After the movie — outside the event.';
}

/** A point, a duration, and a boundary remain visually distinct at every frame. */
export function TimeRelationship({ word, progress = .5, deadline = false }: { word: string; progress?: number; deadline?: boolean }): JSX.Element {
  const after = word === 'after';
  const since = word === 'since';
  const during = word === 'during';
  const until = word === 'until';
  const duration = since || during || until;
  const start = after ? 191.25 : since || during ? 165 : 70;
  const end = 480;
  const cursor = 60 + progress * 525;
  const boundary = after ? 191.25 : end;
  const matches = word === 'by' ? progress <= .8 : word === 'before' ? progress < .8 : progress > .25;
  const title = since ? 'Living here' : during ? 'The movie' : until ? (deadline ? 'Working' : 'Waiting') : word === 'by' ? 'Work finished' : after ? 'Meet' : 'Arrive';
  return <svg viewBox="0 0 660 350" role="img" aria-label={deadline ? `${word}: ${until ? 'work continues until 6 PM' : 'finish work at or before 6 PM'}` : `${word}: ${timeObservation(word, progress)}`} className={styles.timeCanvas}>
    <defs><pattern id={`time-grid-${word}-${deadline}`} width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="var(--line-strong)" opacity=".5" /></pattern></defs>
    <rect width="660" height="350" fill={`url(#time-grid-${word}-${deadline})`} />
    <rect x={after ? boundary : start} y="124" width={after ? 390 : end - start} height="105" rx="16" fill="var(--accent-soft)" opacity=".75" />
    <text x="330" y="66" textAnchor="middle" fill="var(--muted)" fontSize="12" letterSpacing="2">{duration ? 'AN ACTION OVER TIME' : 'AN EVENT IN TIME'}</text>
    <text x="330" y="103" textAnchor="middle" fill="var(--accent)" fontSize="23" fontWeight="600">{title}</text>
    <path d="M55 208 H596 m-8-6 8 6-8 6" fill="none" stroke="var(--line-strong)" strokeWidth="2" />
    {duration ? <>
      <path d={`M${start} 185 H${end}`} stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" opacity=".22" />
      <path d={`M${start} 185 H${Math.max(start, Math.min(end, cursor))}`} stroke="var(--accent)" strokeWidth="9" strokeLinecap="round" />
      <circle cx={start} cy="185" r="6" fill="var(--accent)" />
      <text x={start} y="258" textAnchor="middle" fill="var(--soft)" fontSize="16">{since ? '2010' : during ? 'Movie starts' : 'Start'}</text>
      {during && <><circle cx="300" cy="185" r="12" fill="var(--surface)" stroke="var(--accent)" strokeWidth="3" /><text x="300" y="155" textAnchor="middle" fill="var(--ink)" fontSize="15">Sleeping</text></>}
    </> : <>
      <circle cx={deadline ? 280 : cursor} cy="185" r="13" fill={matches || deadline ? 'var(--accent)' : 'var(--surface)'} stroke="var(--accent)" strokeWidth="3" />
      <path d={`M${deadline ? 280 : cursor} 199 V207`} stroke="var(--accent)" strokeWidth="2" />
      <text x={after ? 415 : 240} y="258" textAnchor="middle" fill="var(--soft)" fontSize="16">{word === 'by' ? 'Completion' : 'Event'}</text>
    </>}
    <path d={`M${boundary} 119 V226`} stroke="var(--accent)" strokeWidth="2" strokeDasharray={until ? undefined : '4 5'} />
    <text x={boundary} y="258" textAnchor="middle" fill="var(--ink)" fontSize="16" fontWeight="600">{after ? 'Lunch ends' : since ? 'Now' : during ? 'Movie ends' : until ? (deadline ? '6 PM' : 'I arrive') : word === 'by' ? '6 PM' : '8 AM'}</text>
    {!deadline && <g aria-hidden="true"><path d={`M${cursor} 135 V225`} stroke="var(--accent)" strokeWidth="1" opacity=".3" strokeDasharray="3 4" /><path d={`M${cursor} 281 V303`} stroke="var(--accent)" strokeWidth="2" /><circle cx={cursor} cy="292" r="5" fill="var(--accent)" /></g>}
    <text x="330" y="329" textAnchor="middle" fill="var(--muted)" fontSize="13">{word === 'by' ? 'Completion at the boundary is allowed' : word === 'before' ? 'The reference moment itself is excluded' : until ? 'The activity continues to its endpoint' : since ? 'A starting point connected to now' : during ? 'Inside the event, not necessarily throughout it' : 'Later than the reference event'}</text>
  </svg>;
}

export function TimeExperiment({ word, spec, english, tamil }: { word: string; spec: SceneSpec; english?: string | undefined; tamil?: string | undefined }): JSX.Element {
  const playback = usePlayback(9000, .5);
  if (['in', 'on', 'at'].includes(word)) return <>
    <PrepositionPicture spec={spec} english={english} tamil={tamil} />
    <div className={styles.scaleNote}><LabIcon name="time" size={20} /><span><strong>{word === 'in' ? 'A period' : word === 'on' ? 'A day' : 'A moment'}</strong> · Zoom in: in a year → on a day → at a time. Use Compare to see the difference.</span></div>
  </>;
  return <div className={styles.timeExperiment}>
    <div className={styles.experimentHeading}><span>TIME EXPLORER</span><span>Drag the playhead to investigate</span></div>
    <TimeRelationship word={word as TimeRelation} progress={playback.progress} />
    <PlaybackBar playback={playback} label="Play timeline" />
    <p className={styles.observation}>{timeObservation(word, playback.progress)}</p>
  </div>;
}
