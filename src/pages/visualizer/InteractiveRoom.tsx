import { memo, useEffect, useId, useRef, useState } from 'react';
import type { CSSProperties, JSX, KeyboardEvent, PointerEvent } from 'react';
import { Ball, Crate, LabIcon, SpaceRoom, Table } from 'common/visual-learning/art';
import { POSITIONS } from 'common/visual-learning/data';
import type { Point, Position } from 'common/visual-learning/data';
import { roomPositionAt } from './room';
import type { RoomPreview } from './room';
import styles from './InteractiveRoom.module.css';

const RoomBack = memo(function RoomBack(): JSX.Element {
  return <g data-room-layer="back" pointerEvents="none" aria-hidden="true"><SpaceRoom /><Crate x={160} /><ellipse cx="577" cy="342" rx="68" ry="12" fill="var(--lab-shadow)" /><Table layer="back" /></g>;
});

const RoomFront = memo(function RoomFront(): JSX.Element {
  return <g data-room-layer="front" pointerEvents="none" aria-hidden="true"><Table layer="front" /><Crate x={160} front /><Crate x={575} shadow={false} /><Crate x={575} front /></g>;
});

const DropGuides = memo(function DropGuides({ active }: { active: Position['id'] | undefined }): JSX.Element {
  return <g className={styles.dropGuides} pointerEvents="none" aria-hidden="true">
    {POSITIONS.map((target) => <g key={target.id} transform={`translate(${target.x} ${target.y})`} className={styles.dropBall} data-active={active === target.id}>
      <circle r="24" />
      <path d="M-21-10Q-5-3 6-22M-22 8Q0 3 17 17M8-22Q0 0 17 17" />
    </g>)}
  </g>;
});

type DragSession = { pointerId: number; offset: Point; handle: SVGGElement; dispose: () => void };
type PointerLocation = Pick<globalThis.PointerEvent, 'clientX' | 'clientY' | 'pointerId'>;

/** Pointer movement stays local; only a new relationship publishes a preview. */
export function InteractiveRoom({ position, onChange, onPreview }: {
  position: Position;
  onChange: (position: Position) => void;
  onPreview?: (preview: RoomPreview | null) => void;
}): JSX.Element {
  const [drag, setDrag] = useState<Point | null>(null);
  const [notice, setNotice] = useState('');
  const svg = useRef<SVGSVGElement>(null);
  const session = useRef<DragSession | null>(null);
  const previewed = useRef<string | null | undefined>(undefined);
  const instructions = useId();
  const guideId = useId();

  useEffect(() => () => { session.current?.dispose(); onPreview?.(null); }, [onPreview]);

  const localPoint = (x: number, y: number): Point => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix || !svg.current) return position;
    const point = svg.current.createSVGPoint();
    point.x = x;
    point.y = y;
    return point.matrixTransform(matrix.inverse());
  };
  const pointOf = (event: PointerLocation): Point => {
    const point = localPoint(event.clientX, event.clientY);
    const offset = session.current?.offset ?? { x: 0, y: 0 };
    return {
      x: Math.max(30, Math.min(690, point.x - offset.x)),
      y: Math.max(72, Math.min(350, point.y - offset.y)),
    };
  };
  const preview = (point: Point): void => {
    setDrag(point);
    const candidate = roomPositionAt(point);
    if (previewed.current !== (candidate?.id ?? null)) {
      previewed.current = candidate?.id ?? null;
      onPreview?.({ position: candidate });
    }
  };
  const startDrag = (event: PointerEvent<SVGGElement>): void => {
    if (event.button !== 0 || event.isPrimary === false || session.current) return;
    event.preventDefault();
    const pointer = localPoint(event.clientX, event.clientY);
    // Catch the ball where it is painted, even halfway through a settling transition.
    const painted = event.currentTarget.getScreenCTM?.();
    const center = painted ? localPoint(painted.e, painted.f) : position;
    const move = (pointerEvent: globalThis.PointerEvent): void => {
      if (session.current?.pointerId === pointerEvent.pointerId) preview(pointOf(pointerEvent));
    };
    const up = (pointerEvent: globalThis.PointerEvent): void => { finishDrag(pointerEvent); };
    const cancel = (pointerEvent: globalThis.PointerEvent): void => { cancelDrag(pointerEvent); };
    const blur = (): void => { clearDrag(); setNotice('Move cancelled. The ball returned to its last position.'); };
    const dispose = (): void => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('blur', blur);
    };
    session.current = { pointerId: event.pointerId, offset: { x: pointer.x - center.x, y: pointer.y - center.y }, handle: event.currentTarget, dispose };
    // Track the whole gesture even when the SVG handle moves away from the pointer.
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('blur', blur);
    previewed.current = undefined;
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    setNotice('');
    preview(center);
  };
  const clearDrag = (): void => {
    const previous = session.current;
    session.current = null;
    previous?.dispose();
    if (previous?.handle.hasPointerCapture(previous.pointerId)) previous.handle.releasePointerCapture(previous.pointerId);
    previewed.current = undefined;
    setDrag(null);
    onPreview?.(null);
  };
  const finishDrag = (event: PointerLocation): void => {
    if (session.current?.pointerId !== event.pointerId) return;
    const candidate = roomPositionAt(pointOf(event));
    clearDrag();
    if (candidate) {
      onChange(candidate);
      setNotice(`Placed ${candidate.id} ${candidate.ending}`);
    } else setNotice('Try the box or the table. The ball returned to its last position.');
  };
  const cancelDrag = (event: Pick<globalThis.PointerEvent, 'pointerId'>): void => {
    if (session.current?.pointerId !== event.pointerId) return;
    clearDrag();
    setNotice('Move cancelled. The ball returned to its last position.');
  };
  const keyboardMove = (event: KeyboardEvent<SVGGElement>): void => {
    if (event.key === 'Escape' && session.current) {
      event.preventDefault();
      clearDrag();
      setNotice('Move cancelled. The ball returned to its last position.');
      return;
    }
    if (session.current) return;
    const index = POSITIONS.findIndex((item) => item.id === position.id);
    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', ' ', 'Enter'].includes(event.key)) {
      event.preventDefault();
      const next = POSITIONS[(index + (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? 4 : 1)) % POSITIONS.length]!;
      onChange(next);
      setNotice(`Placed ${next.id} ${next.ending}`);
    }
  };

  const point = drag ?? position;
  const candidate = drag ? roomPositionAt(drag) : null;
  const description = drag ? (candidate ? `Preview: ${candidate.id} ${candidate.ending}` : 'Moving freely around the furniture.')
    : `The ball is ${position.id} ${position.ending}`;
  const transform = { transform: `translate(${point.x}px, ${point.y}px)` } as CSSProperties;
  const relation = drag ? candidate?.id : position.id;
  const shadowY = relation === 'on' ? 226 : relation === 'behind' ? 333 : 343;
  const height = Math.max(0, shadowY - point.y - 24);
  const hidden = !drag && position.id === 'behind';

  return <div className={styles.room} data-dragging={Boolean(drag)}>
    <div className={styles.hint} id={instructions}><LabIcon name="space" size={14} />{drag ? 'Drop onto a faint ball.' : 'Pick up the ball to see where you can drop it.'}</div>
    <div className={styles.liveReadout} data-active={Boolean(drag)} aria-live="polite" aria-atomic="true">
      {drag ? <span>{candidate?.id === 'behind' ? 'Release to tuck the ball behind the box.' : candidate ? <>Release to place it <strong>{candidate.id}</strong> {candidate.ending}</> : 'Try in, on, under, behind, or between.'}</span> : <span>{hidden ? 'Mostly hidden. Grab the visible edge to pull the ball back out.' : notice || 'Pick it up. Try a different relationship.'}</span>}
    </div>
    <svg ref={svg} viewBox="0 0 720 420" className={styles.canvas} aria-label="Interactive room: move the ball around the boxes and table">
      <RoomBack />
      <ellipse data-ball-shadow="true" cx={point.x} cy={shadowY} rx={Math.max(14, 28 - height * .035)} ry={Math.max(4, 7 - height * .008)} fill="var(--lab-shadow)" opacity={Math.max(.35, 1 - height / 340)} className={styles.shadow} />
      {drag && <DropGuides active={candidate?.id} />}
      {/* The same physical ball stays between these surfaces throughout a drag.
          Actual furniture silhouettes cover it progressively, without switching layers. */}
      <g data-room-layer="ball" className={styles.ballPosition} style={transform} pointerEvents="none" aria-hidden="true"><g className={styles.ballBounce}><Ball /></g></g>
      <RoomFront />
      {/* Only the invisible input surface is above the furniture, so capture survives occlusion. */}
      <g className={styles.ballPosition} style={transform}>
        <g role="button" tabIndex={0} aria-label={`Ball: ${description} Use arrow keys to move it.`} aria-describedby={`${instructions} ${guideId}`} className={`${styles.handle} ${styles.ballBounce}`}
          onPointerDown={startDrag} onLostPointerCapture={cancelDrag} onKeyDown={keyboardMove}>
          <circle className={styles.grabArea} r="40" fill="transparent" />
        </g>
      </g>
      <g className={styles.labels} aria-hidden="true"><text x="162" y="379" textAnchor="middle">BOX</text><text x="391" y="379" textAnchor="middle">TABLE</text><text x="575" y="379" textAnchor="middle">BOX</text></g>
    </svg>
    <p id={guideId} className="sr-only">Ball-shaped drop markers appear while dragging. Drag into the left box, behind the right box, onto or under the table, or between the left box and table. Use arrow keys to move the ball between these positions. Press Escape to cancel a drag.</p>
  </div>;
}
