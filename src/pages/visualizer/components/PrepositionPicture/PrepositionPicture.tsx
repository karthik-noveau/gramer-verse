import { useState } from 'react';
import type { JSX } from 'react';

import { Stage } from 'common/components/Stage/Stage';
import { useReducedMotion } from 'common/hooks/useReducedMotion';
import { describeScene } from 'common/scene/renderers/registry';
import { renderPlace } from 'common/scene/renderers/place.renderer';
import { propFor } from 'common/scene/props';
import type { PathRelation, PlaceRelation, PlaceSpec, SceneSpec, TimeRelation } from 'common/scene/types';

import { DirectionPicture } from './DirectionPicture';
import { RolePicture } from './RolePicture';
import type { OtherPreposition } from './RolePicture';
import { TimePicture } from './TimePicture';
import styles from './styles.module.css';

export const PLACE_MEANINGS: Readonly<Record<PlaceRelation, string>> = {
  in: 'Inside a space', on: 'Resting on a surface', at: 'At a particular location',
  under: 'Directly underneath', above: 'Higher, without touching', below: 'At a lower level',
  behind: 'Partly hidden at the back', 'in front of': 'Closer to you',
  between: 'In the space separating two things', near: 'A short distance away',
  beside: 'Next to each other', here: 'Close to the speaker', there: 'Away from the speaker',
};
const DIRECTION: Record<PathRelation, string> = {
  to: 'Reaching a destination', into: 'Moving from outside to inside', towards: 'Heading in a direction',
  along: 'Following a line or a path', across: 'Crossing to the other side', over: 'Passing above',
  past: 'Going beyond a place', from: 'Leaving a starting point',
};
const TIME: Record<TimeRelation, string> = {
  in: 'Within a period of time', on: 'On a particular day', at: 'At an exact moment',
  before: 'Earlier than', after: 'Later than', by: 'No later than a deadline',
  since: 'From then up to now', during: 'Within another event', until: 'Continuing up to a point',
};
const OTHER: Record<OtherPreposition, string> = {
  about: 'The subject or topic', for: 'The intended receiver', with: 'Together with someone',
  as: 'A role or identity', like: 'A similarity, not an identity', per: 'For each unit',
};

type Frame = readonly [number, number, number, number];

/** Fit the actual prop bounds, not a fixed crop that clips tall or plural
 *  figures. Relations with distance/speaker marks retain the whole stage. */
export function placeFrame(spec: PlaceSpec): Frame {
  if (['below', 'near', 'between', 'here', 'there'].includes(spec.relation)) return [0, 0, 720, 420];
  const bounds = renderPlace(spec).flatMap((node) => {
    const name = node.id === 'ground' ? spec.ground
      : node.id.startsWith('figure-') ? spec.figure : null;
    const prop = propFor(name);
    if (!prop) return [];
    const transform = String(node.attrs.transform ?? '');
    const translate = /translate\(([-\d.]+),([-\d.]+)\)/.exec(transform);
    const scale = Number(/scale\(([-\d.]+)\)/.exec(transform)?.[1] ?? 1);
    const x = Number(translate?.[1] ?? 0);
    const y = Number(translate?.[2] ?? 0);
    return [{ x, y, right: x + prop.box.w * scale, bottom: y + prop.box.h * scale }];
  });
  if (bounds.length === 0) return [0, 0, 720, 420];
  const left = Math.min(...bounds.map((bound) => bound.x)) - 36;
  const right = Math.max(...bounds.map((bound) => bound.right)) + 36;
  const top = Math.min(...bounds.map((bound) => bound.y)) - 44;
  const bottom = Math.max(378, ...bounds.map((bound) => bound.bottom + 30));
  const width = Math.max(520, right - left, (bottom - top) * 720 / 420);
  const height = width * 420 / 720;
  return [(left + right - width) / 2, (top + bottom - height) / 2, width, height];
}

/** Illustrated examples for this page. Arbitrary lesson diagrams still use
 *  Stage; these direction/time/role pictures belong to the curated sentences. */
export function PrepositionPicture({ spec, english, tamil, showHeading = true }: {
  readonly spec: SceneSpec; readonly english?: string | undefined; readonly tamil?: string | undefined;
  readonly showHeading?: boolean;
}): JSX.Element {
  const [replay, setReplay] = useState(0);
  const reduced = useReducedMotion();
  const word = spec.kind === 'relation' ? spec.connective
    : spec.kind === 'actor' ? spec.verb : spec.relation;
  const meaning = spec.kind === 'place' ? PLACE_MEANINGS[spec.relation]
    : spec.kind === 'path' ? DIRECTION[spec.relation]
    : spec.kind === 'timeline' && spec.relation ? TIME[spec.relation]
    : spec.kind === 'relation' ? OTHER[spec.connective as OtherPreposition] : undefined;
  const illustrated = spec.kind === 'path' || (spec.kind === 'timeline' && spec.relation !== null)
    || (spec.kind === 'relation' && meaning !== undefined);

  return <div className={styles.picture} data-picture-kind={spec.kind}>
    {showHeading && <div className={styles.heading}>
      <span className={styles.word}>{word}</span>
      <span className={styles.meaning}>{meaning}</span>
      {spec.kind === 'path' && !reduced && <button type="button" className={styles.replay}
        onClick={() => setReplay((value) => value + 1)} aria-label="Replay movement">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 10a8 8 0 1 1 1 8 M4 4v6h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg><span>Replay</span>
      </button>}
    </div>}
    {illustrated ? <figure className={styles.figure}>
      <svg key={`${spec.kind}-${word}-${replay}`} className={styles.canvas} viewBox="0 0 600 360"
        role="img" aria-label={english ?? describeScene(spec).en} focusable="false">
        {spec.kind === 'path' && <DirectionPicture word={spec.relation} reduced={reduced} />}
        {spec.kind === 'timeline' && spec.relation && <TimePicture word={spec.relation} />}
        {spec.kind === 'relation' && <RolePicture word={spec.connective as OtherPreposition} />}
      </svg>
      <figcaption className="sr-only" lang="ta">{tamil ?? describeScene(spec).ta}</figcaption>
    </figure> : <Stage spec={spec} {...(spec.kind === 'place' ? { viewBox: placeFrame(spec) } : {})} />}
  </div>;
}
