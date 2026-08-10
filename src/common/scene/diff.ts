import type { SceneNode } from 'common/scene/types';

/* ============================================================
   diff.ts — what changed between two pictures.

   Matched by id, which is why engine 09 made ids required and
   meaningful: `figure-0` is the same ball before and after the
   knob turned, so it can slide from one place to the other
   instead of vanishing and a new ball appearing somewhere else.
   Matched by array position instead, a scene that reorders its
   nodes would be a scene where everything left and everything
   arrived.

   Top level only. Ids are unique among the nodes of a scene, but
   not inside them — a man and an apple both draw a `body` — and
   the things that move are the groups, not their parts.
   ============================================================ */

export type SceneDiff = {
  /** In both, drawn differently: the ball is in a new place. */
  readonly moved: readonly string[];
  /** In the new picture only. */
  readonly entered: readonly string[];
  /** In the old picture only, and still on the stage until it has faded. */
  readonly exited: readonly SceneNode[];
  /** In both, drawn identically. Nothing to do, and most of the scene. */
  readonly unchanged: readonly string[];
  /**
   * Nothing in common: a different lesson, not a different state of this one.
   *
   * Tweening between two unrelated pictures is a pile of things sliding across
   * each other to no purpose, so the caller replaces instead.
   */
  readonly replaced: boolean;
};

const EMPTY: SceneDiff = {
  moved: [],
  entered: [],
  exited: [],
  unchanged: [],
  replaced: false,
};

/** How a node is drawn, as one comparable string.
 *
 *  Its own attributes and its children's, because a prop redrawn in another
 *  colour has not moved but has changed — and a group whose transform is the
 *  same but whose contents are not is not unchanged. */
const shapeOf = (node: SceneNode): string =>
  JSON.stringify([node.tag, node.attrs, node.text ?? '', (node.children ?? []).map(shapeOf)]);

/** Just the transform: what a move is, and the only thing a move animates. */
const placeOf = (node: SceneNode): string => String(node.attrs.transform ?? '');

/**
 * What changed between two scenes.
 *
 * Pure, and it reads nothing back from the DOM: geometry is in the trees
 * already, and asking the browser for it mid-render is what turns an animation
 * into a layout thrash.
 */
export function diffScenes(
  previous: readonly SceneNode[],
  next: readonly SceneNode[],
): SceneDiff {
  /* The first picture is not a change to anything, so it is a replacement:
     everything fading in on arrival is a page that looks like it is still
     loading. */
  if (previous.length === 0) {
    return { ...EMPTY, entered: next.map((node) => node.id), replaced: true };
  }
  if (next.length === 0) {
    return { ...EMPTY, exited: [...previous], replaced: true };
  }

  const before = new Map(previous.map((node) => [node.id, node]));
  const after = new Map(next.map((node) => [node.id, node]));

  const moved: string[] = [];
  const entered: string[] = [];
  const unchanged: string[] = [];

  for (const node of next) {
    const was = before.get(node.id);
    if (!was) {
      entered.push(node.id);
      continue;
    }
    if (shapeOf(was) === shapeOf(node)) {
      unchanged.push(node.id);
      continue;
    }
    moved.push(node.id);
  }

  const exited = previous.filter((node) => !after.has(node.id));

  /* Two pictures with no node in common are two different pictures. Sharing
     only the floor line counts as nothing in common: every scene has one, and
     it is not what the lesson is about. */
  const shared = moved.length + unchanged.length;
  const replaced = shared === 0 || (shared === 1 && unchanged[0] === 'floor');

  return { moved, entered, exited, unchanged, replaced };
}

/** Whether a node is in the same place in both pictures. A prop that changed
 *  colour without moving should not be given a movement transition — there is
 *  nothing for it to move between. */
export const stayedPut = (was: SceneNode, now: SceneNode): boolean =>
  placeOf(was) === placeOf(now);
