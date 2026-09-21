import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'common/hooks/useMediaQuery';

/** One clock drives artwork and captions; scrubbing and slow playback stay in sync. */
export function usePlayback(duration = 7000, initial = 0, autoPlay = false): {
  progress: number; running: boolean; slow: boolean; reduced: boolean;
  seek: (value: number) => void; replay: () => void; toggle: () => void; toggleSlow: () => void;
} {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const [progress, setProgress] = useState(initial);
  const [running, setRunning] = useState(autoPlay && !reduced);
  const [slow, setSlow] = useState(false);
  const current = useRef(initial);

  const seek = useCallback((value: number): void => {
    const next = Math.max(0, Math.min(1, value));
    current.current = next;
    setProgress(next);
    setRunning(false);
  }, []);
  const replay = useCallback((): void => {
    current.current = 0;
    setProgress(0);
    setRunning(true);
  }, []);
  const toggle = (): void => {
    if (current.current >= 1) replay();
    else setRunning((value) => !value);
  };

  useEffect(() => {
    if (!running) return;
    let frame: number;
    let last: number | undefined;
    const tick = (now: number): void => {
      const delta = last === undefined ? 0 : Math.min(now - last, 80);
      last = now;
      current.current = Math.min(1, current.current + delta / (duration * (slow ? 2 : 1)));
      setProgress(current.current);
      if (current.current >= 1) setRunning(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, duration, slow]);

  useEffect(() => {
    const pause = (): void => { if (document.hidden) setRunning(false); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);

  useEffect(() => { if (reduced) setRunning(false); }, [reduced]);

  return { progress, running, slow, reduced, seek, replay, toggle, toggleSlow: () => setSlow((value) => !value) };
}

export type Playback = ReturnType<typeof usePlayback>;
