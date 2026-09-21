import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, JSX, KeyboardEvent, PointerEvent } from 'react';
import { Ball, Crate, LabIcon, SpaceRoom, Table } from 'common/visual-learning/art';
import { nearestPosition, POSITIONS } from 'common/visual-learning/data';
import type { Point, Position } from 'common/visual-learning/data';
import { Insight, PlaybackBar, Sentence } from 'common/visual-learning/shared';
import { usePlayback } from 'common/visual-learning/usePlayback';
import styles from 'common/visual-learning/styles.module.css';

const CHALLENGES = [POSITIONS[2], POSITIONS[3], POSITIONS[4], POSITIONS[0], POSITIONS[1]] as const;

export default function SpaceLesson({ showTamil }: { showTamil: boolean }): JSX.Element {
  const [position, setPosition] = useState<Position>(POSITIONS[1]);
  const [drag, setDrag] = useState<Point | null>(null);
  const [challenge, setChallenge] = useState<number | null>(null);
  const [result, setResult] = useState<'correct' | 'retry' | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const pointer = useRef<number | null>(null);
  const playback = usePlayback(12500);
  const tourIndex = Math.min(4, Math.floor(playback.progress * 5));
  const tourFinished = playback.progress === 1;

  useEffect(() => {
    if (playback.running || tourFinished) { setPosition(POSITIONS[tourIndex]!); setResult(null); }
  }, [tourIndex, playback.running, tourFinished]);

  const choose = (next: Position): void => {
    playback.seek(0);
    setPosition(next);
    setResult(null);
  };
  const pointOf = (event: PointerEvent<SVGGElement>): Point => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix || !svg.current) return position;
    const point = svg.current.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const local = point.matrixTransform(matrix.inverse());
    return { x: Math.max(45, Math.min(675, local.x)), y: Math.max(130, Math.min(360, local.y)) };
  };
  const startDrag = (event: PointerEvent<SVGGElement>): void => {
    if (event.button !== 0 || pointer.current !== null) return;
    playback.seek(0);
    pointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag(pointOf(event));
    setResult(null);
  };
  const finishDrag = (event: PointerEvent<SVGGElement>): void => {
    if (pointer.current !== event.pointerId) return;
    const point = pointOf(event);
    const closest = nearestPosition(point);
    if (Math.hypot(point.x - closest.x, point.y - closest.y) < 95) choose(closest);
    pointer.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const cancelDrag = (): void => { pointer.current = null; setDrag(null); };
  const keyboardMove = (event: KeyboardEvent<SVGGElement>): void => {
    const index = POSITIONS.findIndex((item) => item.id === position.id);
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', ' '].includes(event.key)) {
      event.preventDefault();
      choose(POSITIONS[(index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? 4 : 1)) % 5]!);
    }
  };
  const point = drag ?? position;
  const target = challenge === null ? null : CHALLENGES[challenge];
  const isFinished = challenge === CHALLENGES.length - 1 && result === 'correct';
  const description = `The ball is ${position.id} ${position.ending}`;

  return <div className={styles.workspace}>
    <div className={styles.visualColumn}>
      <div className={styles.stageHeading}><span><span className={styles.liveDot} /> THE WORD BECOMES A PLACE</span><span>01 / 03</span></div>
      <div className={styles.spaceStage} style={{ '--position-duration': playback.slow ? '1800ms' : '900ms' } as CSSProperties}>
        <div className={styles.stageHint}><LabIcon name="space" size={14} /> Drag the ball. See what changes.</div>
        <svg ref={svg} viewBox="0 0 720 420" className={styles.spaceSvg} aria-label="Interactive room: move the ball around the boxes and table">
          <SpaceRoom />
          <Crate x={160} /><Crate x={575} /><Table />
          <ellipse cx={point.x} cy={position.id === 'on' && !drag ? 226 : 343} rx="29" ry="7" fill="var(--lab-shadow)" className={styles.ballShadow} />
          {drag && POSITIONS.map((item) => <g key={item.id} className={styles.dropTarget} data-nearest={nearestPosition(drag).id === item.id} pointerEvents="none"><circle cx={item.x} cy={item.y} r="30" /><text x={item.x} y={item.y - 37} textAnchor="middle">{item.id}</text></g>)}
          <g className={styles.movingBall} data-dragging={Boolean(drag)} style={{ transform: `translate(${point.x}px, ${point.y}px)` } as CSSProperties}>
              <g role="button" tabIndex={0} aria-label={`Ball: ${description} Use arrow keys to move it.`} aria-describedby="ball-instructions" className={styles.draggableBall} onPointerDown={startDrag} onPointerMove={(event) => { if (pointer.current === event.pointerId) setDrag(pointOf(event)); }} onPointerUp={finishDrag} onPointerCancel={cancelDrag} onLostPointerCapture={cancelDrag} onKeyDown={keyboardMove}>
                <circle r="35" fill="transparent" /><g key={position.id} className={drag ? undefined : styles.ballLanding}><Ball /></g>
              </g>
          </g>
          <g pointerEvents="none" opacity={drag ? .55 : 1}>{position.id === 'behind' && !drag && <Crate x={575} />}<Crate x={160} front /><Crate x={575} front /></g>
          {position.id === 'behind' && !drag && <circle cx={position.x} cy={position.y} r="25" fill="none" stroke="var(--lab-ball-dark)" strokeWidth="1.5" strokeDasharray="4 5" opacity=".65" pointerEvents="none" />}
          <g className={styles.roomLabels} aria-hidden="true"><text x="162" y="379" textAnchor="middle">BOX</text><text x="391" y="379" textAnchor="middle">TABLE</text><text x="575" y="379" textAnchor="middle">BOX</text></g>
        </svg>
      </div>
      <PlaybackBar playback={playback} label="Play all positions" scrub={false} />
      <Sentence english={description} tamil={position.ta} showTamil={showTamil}>The ball is <mark key={position.id}>{position.id}</mark> {position.ending}</Sentence>
    </div>
    <aside className={styles.lessonControls}>
      <span className={styles.eyebrow}>TRY A LITTLE CHANGE</span>
      <h2>Where is the ball?</h2>
      <p className={styles.controlIntro} id="ball-instructions">Drag it in the scene, or choose a word below. Arrow keys work on the ball, too.</p>
      <div className={styles.wordChoices} role="group" aria-label="Ball position">{POSITIONS.map((item) => <button type="button" key={item.id} aria-pressed={position.id === item.id} onClick={() => choose(item)}><span>{item.id}</span>{showTamil && <span lang="ta">{({ in: 'உள்ளே', on: 'மேலே', under: 'கீழே', behind: 'பின்னால்', between: 'இடையில்' })[item.id]}</span>}{position.id === item.id && <LabIcon name="check" size={15} />}</button>)}</div>
      <Insight>{position.hint}</Insight>
      <div className={styles.challenge}>
        <span className={styles.eyebrow}>YOUR TURN {challenge !== null ? `· ${challenge + 1} / ${CHALLENGES.length}` : ''}</span>
        {target ? <>
          <p>Put the ball <strong>{target.id}</strong> {target.ending}</p>
          <div className={styles.feedback} role="status">{result === 'correct' ? (isFinished ? 'All five explored. You’ve got this!' : 'That’s right. The scene matches the sentence.') : result === 'retry' ? `${target.short}. Try another position.` : 'Make the scene match the sentence.'}</div>
          {result === 'correct' ? <button type="button" className={styles.primaryButton} onClick={() => { setChallenge(isFinished ? null : (challenge ?? 0) + 1); setResult(null); }}>{isFinished ? 'Back to exploring' : 'Next challenge'}<LabIcon name="arrow" size={16} /></button> : <button type="button" className={styles.primaryButton} onClick={() => setResult(position.id === target.id ? 'correct' : 'retry')}>Check position<LabIcon name="check" size={16} /></button>}
        </> : <><p>Can you build a sentence with the ball?</p><button type="button" className={styles.textButton} onClick={() => { playback.seek(0); setChallenge(0); setResult(null); }}>Try a challenge <LabIcon name="arrow" size={16} /></button></>}
      </div>
    </aside>
  </div>;
}
