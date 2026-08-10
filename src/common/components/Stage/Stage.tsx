import { memo, useMemo } from 'react';
import type { JSX } from 'react';

import { useSceneTransition } from 'common/components/Stage/useSceneTransition';
import type { NodeMotion } from 'common/components/Stage/useSceneTransition';
import { STAGE } from 'common/scene/layout';
import { describeScene, renderScene, sceneProblem } from 'common/scene/renderers/registry';
import { nodeToSvg } from 'common/components/Stage/toSvg';
import type { SceneNode, SceneSpec } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   Stage — the only React in the scene engine.

   Everything below it is plain data: a spec goes into the
   registry and a node tree comes out, and this turns that tree
   into SVG. Nothing here decides what a picture looks like, and
   nothing in a renderer knows this file exists.
   ============================================================ */

export type StageProps = {
  readonly spec: SceneSpec;
  /** Rendered instead of the picture when the scene cannot be drawn. The
   *  `<CannotDraw>` state belongs to the page, not to the scene engine. */
  readonly fallback?: JSX.Element | null;
  /** A crop, for a caller with less room than the stage. The renderers always
   *  draw into the full stage; this only chooses how much of it is shown, so a
   *  card that never needs the headroom above the floor is not mostly empty.
   *  Four numbers, as SVG writes them: x, y, width, height. */
  readonly viewBox?: readonly [number, number, number, number];
  readonly className?: string;
};

/** The class that carries what is happening to a node, if anything is. */
const MOTION: Readonly<Record<NodeMotion, string | undefined>> = {
  moving: styles.moving,
  entering: styles.entering,
  leaving: styles.leaving,
};

/** A node and its children, as SVG, with the motion class on the top level. */
const toSvg = (node: SceneNode, motion?: NodeMotion): JSX.Element =>
  nodeToSvg(node, motion ? MOTION[motion] : undefined);

/**
 * The picture for a scene.
 *
 * Memoised on the spec's identity, so a page re-rendering for an unrelated
 * reason does not rebuild the tree — which is only sound because every
 * renderer is pure. One reading the clock would make the same spec draw two
 * different pictures and this would show the older one.
 */
function StageView({ spec, fallback = null, viewBox, className }: StageProps): JSX.Element | null {
  const nodes = useMemo(() => renderScene(spec), [spec]);
  const description = useMemo(() => describeScene(spec), [spec]);
  const transition = useSceneTransition(nodes);

  /* Nothing drawn is not an error: it is a spec no renderer will draw, and the
     page says so in the learner's own words. */
  if (nodes.length === 0) return fallback;

  return (
    <figure className={classNames(styles.stage, className)}>
      <svg
        className={styles.canvas}
        viewBox={(viewBox ?? [0, 0, STAGE.width, STAGE.height]).join(' ')}
        role="img"
        aria-label={description.en}
        focusable="false"
      >
        {transition.nodes.map((node) => toSvg(node, transition.motionOf(node.id)))}
      </svg>
      {/* The English is announced from the label; the Tamil has to be an
          element of its own, because an attribute cannot carry a language.
          Both are inside the figure, so neither floats loose in the page. */}
      <figcaption className="sr-only" lang="ta">
        {description.ta}
      </figcaption>
    </figure>
  );
}

export const Stage = memo(StageView);

/** Why a scene will not draw. Exported for the pages, which is where the
 *  learner is told. */
export { sceneProblem };
