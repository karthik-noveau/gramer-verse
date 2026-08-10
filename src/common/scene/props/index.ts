import { ACTORS } from 'common/scene/props/actors';
import { FURNITURE } from 'common/scene/props/furniture';
import { OBJECTS } from 'common/scene/props/objects';
import type { Prop, PropId } from 'common/scene/types';

/* ============================================================
   index.ts — PropId → Prop.

   The registry is the whole reason forty-plus scenes come out of
   sixteen drawable things. Everything that draws asks here; no
   renderer keeps its own list.
   ============================================================ */

const ALL: readonly Prop[] = [...FURNITURE, ...OBJECTS, ...ACTORS];

export const PROPS: Readonly<Record<string, Prop>> = Object.freeze(
  Object.fromEntries(ALL.map((prop) => [String(prop.id), prop])),
);

export const PROP_IDS: readonly string[] = Object.freeze(ALL.map((prop) => String(prop.id)));

/**
 * The prop, or `undefined`.
 *
 * A missing prop is not an exception here: `validate.ts` already refuses
 * content naming a prop nobody drew, so anything reaching this function with
 * an unknown id is a bug in a renderer rather than bad content — and a scene
 * that draws nothing is easier to see than a thrown error inside a render.
 */
export const propFor = (id: PropId | string | null | undefined): Prop | undefined =>
  id === null || id === undefined ? undefined : PROPS[String(id)];

export { FURNITURE, OBJECTS, ACTORS };
export { table, box, chair, door, car, shop } from 'common/scene/props/furniture';
export { ball, apple, cup, book, clock, tree } from 'common/scene/props/objects';
export { cat, dog, man, woman } from 'common/scene/props/actors';
