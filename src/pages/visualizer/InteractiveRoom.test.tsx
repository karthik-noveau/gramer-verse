import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { JSX } from 'react';
import type { Position } from 'common/visual-learning/data';
import { POSITIONS } from 'common/visual-learning/data';
import { InteractiveRoom } from './InteractiveRoom';
import { roomPositionAt } from './room';

function setup(position: Position = POSITIONS[0]): {
  ball: HTMLElement; move: jest.Mock; preview: jest.Mock;
  pointer: (type: string, x: number, y: number, pointerId?: number, pointerType?: string) => void;
} {
  const move = jest.fn();
  const preview = jest.fn();
  function RoomHarness(): JSX.Element {
    const [current, setCurrent] = useState<Position>(position);
    return <InteractiveRoom position={current} onChange={(next) => { move(next); setCurrent(next); }} onPreview={preview} />;
  }
  render(<RoomHarness />);
  const ball = screen.getByRole('button', { name: /Ball:/ });
  const svg = ball.closest('svg')!;
  Object.defineProperties(svg, {
    getScreenCTM: { value: () => ({ inverse: () => ({}) }) },
    createSVGPoint: { value: () => ({ x: 0, y: 0, matrixTransform(): { x: number; y: number } { return { x: this.x, y: this.y }; } }) },
  });
  Object.defineProperties(ball, {
    setPointerCapture: { value: jest.fn() }, hasPointerCapture: { value: () => true }, releasePointerCapture: { value: jest.fn() },
  });
  const pointer = (type: string, x: number, y: number, pointerId = 1, pointerType = 'mouse'): void => {
    const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y, button: 0 });
    Object.defineProperties(event, { pointerId: { value: pointerId }, pointerType: { value: pointerType } });
    fireEvent(ball, event);
  };
  return { ball, move, preview, pointer };
}

describe('direct room interaction', () => {
  it('only assigns a relationship inside its furniture area, never in empty air', () => {
    for (const position of POSITIONS) expect(roomPositionAt(position)?.id).toBe(position.id);
    expect(roomPositionAt({ x: 390, y: 120 })).toBeNull();
    expect(roomPositionAt({ x: 90, y: 320 })).toBeNull();
  });

  it('lets a hidden ball be picked up with touch without a visible clone or outline', () => {
    const { ball, pointer, preview } = setup(POSITIONS[3]);
    const svg = ball.closest('svg')!;
    const artwork = svg.querySelector('[data-room-layer="ball"]') as SVGGElement;
    pointer('pointerdown', POSITIONS[3].x, POSITIONS[3].y, 1, 'touch');
    pointer('pointermove', 390, 199, 1, 'touch');
    expect(artwork.style.transform).toBe('translate(390px, 199px)');
    expect(artwork.getAttribute('visibility')).not.toBe('hidden');
    expect(ball.querySelectorAll('circle')).toHaveLength(1);
    expect(ball.querySelector('circle')?.getAttribute('fill')).toBe('transparent');
    expect(svg.querySelectorAll('radialGradient')).toHaveLength(1);
    expect(ball.parentElement?.style.transform).toBe('translate(390px, 199px)');
    expect(preview).toHaveBeenLastCalledWith({ position: POSITIONS[1] });
    expect(ball).toBe(document.activeElement);
  });

  it('keeps the box silhouette above the same ball throughout entry, full occlusion, and exit', () => {
    const { ball, pointer, move, preview } = setup(POSITIONS[2]);
    const svg = ball.closest('svg')!;
    const artwork = svg.querySelector('[data-room-layer="ball"]') as SVGGElement;
    const foreground = svg.querySelector('[data-room-layer="front"]')!;
    const silhouette = foreground.innerHTML;
    pointer('pointerdown', 390, 313);
    // No release between these samples: the box must occlude during the drag itself.
    for (const x of [495, 520, 545, 575, 620, 660, 575, 520, 495]) {
      pointer('pointermove', x, 300);
      expect(svg.querySelector('[data-room-layer="ball"]')).toBe(artwork);
      expect(artwork.style.transform).toBe(`translate(${x}px, 300px)`);
      expect(artwork.compareDocumentPosition(foreground) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(foreground.innerHTML).toBe(silhouette);
      expect(artwork.getAttribute('visibility')).not.toBe('hidden');
      expect(svg.querySelectorAll('radialGradient')).toHaveLength(1);
    }
    expect(move).not.toHaveBeenCalled();
    expect(preview).toHaveBeenCalledWith({ position: POSITIONS[3] });
  });

  it('ignores a second pointer and restores the committed scene on Escape', () => {
    const { ball, pointer, move, preview } = setup();
    pointer('pointerdown', 160, 273);
    pointer('pointermove', 390, 199);
    pointer('pointermove', 575, 273, 2);
    pointer('pointerup', 575, 273, 2);
    expect(ball.parentElement?.style.transform).toBe('translate(390px, 199px)');
    expect(move).not.toHaveBeenCalled();
    fireEvent.keyDown(ball, { key: 'Escape' });
    expect(ball.parentElement?.style.transform).toBe('translate(160px, 273px)');
    expect(preview).toHaveBeenLastCalledWith(null);
    expect(move).not.toHaveBeenCalled();
  });

  it.each(['pointercancel', 'lostpointercapture'])('clears live feedback on %s without committing a preview', (type) => {
    const { pointer, move, preview } = setup();
    pointer('pointerdown', 160, 273);
    pointer('pointermove', 390, 199);
    pointer(type, 390, 199);
    expect(preview).toHaveBeenLastCalledWith(null);
    expect(move).not.toHaveBeenCalled();
    expect(screen.getByText(/Move cancelled/)).toBeTruthy();
  });

  it('updates the parent only on zone changes and explains an invalid drop', () => {
    const { pointer, preview, move } = setup();
    pointer('pointerdown', 160, 273);
    pointer('pointermove', 161, 274);
    pointer('pointermove', 165, 270);
    expect(preview).toHaveBeenCalledTimes(1);
    pointer('pointermove', 390, 100);
    expect(preview).toHaveBeenLastCalledWith({ position: null });
    pointer('pointerup', 390, 100);
    expect(move).not.toHaveBeenCalled();
    expect(screen.getByText(/Try the box or the table/)).toBeTruthy();
  });

  it('tracks movement and release outside the moving SVG handle, then removes the gesture listeners', () => {
    const { ball, pointer, preview, move } = setup();
    pointer('pointerdown', 160, 273);
    const outside = (type: string, x: number, y: number): void => {
      const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
      Object.defineProperty(event, 'pointerId', { value: 1 });
      fireEvent(window, event);
    };
    outside('pointermove', 575, 273);
    expect(ball.parentElement?.style.transform).toBe('translate(575px, 273px)');
    outside('pointerup', 575, 273);
    expect(move).toHaveBeenCalledWith(POSITIONS[3]);
    expect(preview).toHaveBeenLastCalledWith(null);
    const calls = preview.mock.calls.length;
    outside('pointermove', 390, 199);
    outside('pointerup', 390, 199);
    expect(preview).toHaveBeenCalledTimes(calls);
    expect(move).toHaveBeenCalledTimes(1);
  });

  it('cancels a drag when the window loses focus', () => {
    const { pointer, move, preview } = setup();
    pointer('pointerdown', 160, 273);
    pointer('pointermove', 575, 273);
    fireEvent(window, new Event('blur'));
    expect(preview).toHaveBeenLastCalledWith(null);
    expect(move).not.toHaveBeenCalled();
    expect(screen.getByText(/Move cancelled/)).toBeTruthy();
  });

  it.each([[515, 290], [575, 337], [636, 320]])('accepts a behind drop at the box edge (%i, %i) and leaves a grabbable sliver', (x, y) => {
    const { ball, pointer, move } = setup(POSITIONS[2]);
    pointer('pointerdown', POSITIONS[2].x, POSITIONS[2].y);
    pointer('pointermove', x, y);
    expect(screen.getByText('Release to tuck the ball behind the box.')).toBeTruthy();
    pointer('pointerup', x, y);
    expect(move).toHaveBeenLastCalledWith(POSITIONS[3]);
    expect(ball.parentElement?.style.transform).toBe('translate(535px, 309px)');
    // The physical circle extends past the box's left edge (x=522), with most of it behind the box.
    expect(POSITIONS[3].x - 24).toBeLessThan(522);
    expect(POSITIONS[3].x).toBeGreaterThan(522);
    expect(screen.getByText(/Grab the visible edge/)).toBeTruthy();
    // Picking up the visible part preserves the initial grab offset.
    pointer('pointerdown', 517, 309);
    pointer('pointermove', 372, 199);
    pointer('pointerup', 372, 199);
    expect(move).toHaveBeenLastCalledWith(POSITIONS[1]);
    expect(ball.parentElement?.style.transform).toBe('translate(390px, 199px)');
  });
});
