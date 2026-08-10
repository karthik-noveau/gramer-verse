import type { JSX } from 'react';

import type { SceneNode } from 'common/scene/types';

/* ============================================================
   toSvg.tsx — a node tree, as SVG.

   The one place that turns scene nodes into elements. Stage draws
   a whole scene with it and common/art draws a single word's
   picture with it, so a prop looks the same at 700px on the stage
   and at 40px in a table row.

   It lives beside Stage rather than in common/scene, because the
   scene engine is data all the way down and may not import React —
   boundaries.test.ts enforces that.
   ============================================================ */

/**
 * SVG attribute names, as React wants them.
 *
 * The renderers speak SVG — `stroke-width`, `xml:lang` — because that is what
 * the attribute is called, and a node tree that is not JSX has no reason to
 * know otherwise. React wants the DOM property name, and warns and drops the
 * value for the ones it knows. `data-` and `aria-` attributes are hyphenated in
 * React too and are left alone.
 */
export const reactAttrs = (attrs: SceneNode['attrs']): Record<string, string | number> => {
  const out: Record<string, string | number> = {};

  for (const [key, value] of Object.entries(attrs)) {
    const name =
      key.startsWith('data-') || key.startsWith('aria-')
        ? key
        : key.replace(/[-:](.)/g, (_, next: string) => next.toUpperCase());
    out[name] = value;
  }
  return out;
};

/** A node and its children, as SVG.
 *
 *  Keyed by the node's own id, which is the id the animation diff matches on:
 *  keyed by array index instead, a figure that changes place would be
 *  reconciled as a different element and could not be transitioned — it would
 *  be torn down and rebuilt, and there is nothing to transition between a node
 *  and its replacement.
 *
 *  Only the top level is given a class. The parts inside a prop move with the
 *  group they are drawn in, and their ids repeat between props. */
export function nodeToSvg(node: SceneNode, className?: string): JSX.Element {
  const { id, tag: Tag, text, children } = node;
  const attrs = reactAttrs(node.attrs);

  if (Tag === 'text') {
    return (
      <text key={id} {...attrs} className={className}>
        {text}
      </text>
    );
  }
  if (children === undefined) return <Tag key={id} {...attrs} className={className} />;

  return (
    <Tag key={id} {...attrs} className={className}>
      {children.map((child) => nodeToSvg(child))}
    </Tag>
  );
}
