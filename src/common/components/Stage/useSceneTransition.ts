import { useEffect, useMemo, useRef, useState } from 'react';

import { useReducedMotion } from 'common/hooks/useReducedMotion';
import { diffScenes } from 'common/scene/diff';
import type { SceneNode } from 'common/scene/types';

/* ============================================================
   useSceneTransition — the picture, mid-change.

   Takes the tree the renderer just produced and hands back the
   tree to draw: the new nodes, plus whatever is still on its way
   out. Each one is labelled with what is happening to it, and
   the stylesheet does the rest.

   Nothing here reads the DOM. The old and new positions are both
   in the trees, so the browser is asked to draw, never to
   measure.
   ============================================================ */

/** What is happening to a node. `moving` is the interesting one: the same ball
 *  in a new place, sliding rather than being replaced. */
export type NodeMotion = 'moving' | 'entering' | 'leaving';

export type SceneTransition = {
  /** What to draw: the new scene, with the leaving nodes still in it. */
  readonly nodes: readonly SceneNode[];
  readonly motionOf: (id: string) => NodeMotion | undefined;
  /** True while anything is moving, entering or leaving. */
  readonly settling: boolean;
};

/** Long enough to be followed by eye, short enough that a knob still feels
 *  connected to the picture. Matches the durations in the stylesheet. */
export const TRANSITION_MS = 420;

const NOTHING: ReadonlyMap<string, NodeMotion> = new Map();

export function useSceneTransition(nodes: readonly SceneNode[]): SceneTransition {
  const reduced = useReducedMotion();
  const previous = useRef<readonly SceneNode[]>([]);
  const [motion, setMotion] = useState<ReadonlyMap<string, NodeMotion>>(NOTHING);
  const [leaving, setLeaving] = useState<readonly SceneNode[]>([]);

  /* The diff is taken during render, against whatever was last drawn. Taken in
     an effect instead, the browser would have already painted the new
     positions and there would be nothing left to transition from. */
  const diff = useMemo(() => diffScenes(previous.current, nodes), [nodes]);

  useEffect(() => {
    previous.current = nodes;

    if (reduced || diff.replaced) {
      /* Reduced motion, or a different lesson altogether: the picture is
         simply the new picture. Nothing tweens, nothing lingers. */
      setMotion(NOTHING);
      setLeaving([]);
      return undefined;
    }

    const next = new Map<string, NodeMotion>();
    for (const id of diff.moved) next.set(id, 'moving');
    for (const id of diff.entered) next.set(id, 'entering');
    for (const node of diff.exited) next.set(node.id, 'leaving');

    if (next.size === 0) return undefined;

    setMotion(next);
    setLeaving(diff.exited);

    /* One timer, restarted. A knob turned mid-transition retargets — the
       browser interpolates from wherever the node currently is — and the timer
       that clears up after it starts again rather than queueing behind the
       first one. */
    const timer = setTimeout(() => {
      setMotion(NOTHING);
      setLeaving([]);
    }, TRANSITION_MS);

    return () => clearTimeout(timer);
  }, [nodes, diff, reduced]);

  /* The leavers are drawn under the new picture: something on its way out
     should never cover what has arrived. */
  const drawn = useMemo(
    () => (leaving.length === 0 ? nodes : [...leaving, ...nodes]),
    [leaving, nodes],
  );

  return {
    nodes: drawn,
    motionOf: (id) => motion.get(id),
    settling: motion.size > 0,
  };
}
