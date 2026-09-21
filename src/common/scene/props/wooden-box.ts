import { path } from 'common/scene/primitives';
import type { SceneNode } from 'common/scene/types';

/** One open wooden box for both the scene library and the draggable room. */
export const WOODEN_BOX_SIZE = { w: 220, h: 202 } as const;
export const WOODEN_BOX_RIM_SLOPE = 12 / 168;
export const WOODEN_BOX_RIM_Y = 58 + WOODEN_BOX_SIZE.w / 2 * WOODEN_BOX_RIM_SLOPE;
export const WOODEN_BOX_BACK_Y = 14 + (WOODEN_BOX_SIZE.w / 2 - 52) * WOODEN_BOX_RIM_SLOPE;

export const woodenBoxBack = (): readonly SceneNode[] => [
  path('back-rim', { d: 'M0,58 L52,14 L220,26 L168,70 Z', fill: 'var(--box-rim)' }),
  path('interior', { d: 'M16,55 L55,25 L201,35 L164,62 Z', fill: 'var(--box-inside)' }),
  path('inner-back', { d: 'M55,25 L201,35 V48 L55,38 Z', fill: 'var(--box-side)' }),
  path('inner-side', { d: 'M16,55 L55,25 V38 L30,57 Z', fill: 'var(--box-side)', opacity: .55 }),
  path('inner-depth', { d: 'M55,25 L201,35', stroke: 'var(--box-inside)', strokeWidth: 2, opacity: .5, cap: 'butt' }),
  path('back-edge', { d: 'M52,14 L220,26', stroke: 'var(--box-face)', strokeWidth: 2, cap: 'butt' }),
];

export const woodenBoxFront = (fill?: string): readonly SceneNode[] => [
  path('side', { d: 'M168,70 L220,26 V154 Q220,158 216,161 L168,202 Z', fill: 'var(--box-side)' }),
  path('body', { d: 'M0,58 L168,70 V197 Q168,202 163,201.6 L5,189.6 Q0,189.2 0,184 Z', fill: fill ?? 'var(--box-face)' }),
  path('rim-shade', { d: 'M0,58 L168,70 V75 L0,63 Z', fill: 'var(--box-side)', opacity: .15 }),
  path('front-rim', { d: 'M0,58 L16,55 L164,62 L168,70 Z', fill: 'var(--box-rim)' }),
  path('right-rim', { d: 'M164,62 L201,35 L220,26 L168,70 Z', fill: 'var(--box-rim)' }),
  path('rim-light', { d: 'M2,58 L168,70 L218,27', stroke: 'var(--lab-white)', strokeWidth: 1.5, opacity: .45, cap: 'butt', join: 'miter' }),
  path('front-corner', { d: 'M168,75 V196', stroke: 'var(--box-rim)', strokeWidth: 1.4, opacity: .3, cap: 'butt' }),
  path('grain', { d: 'M22,149 Q43,148 62,152 M103,172 L143,175 M183,137 L204,120', stroke: 'var(--box-inside)', strokeWidth: 1.2, opacity: .12 }),
];
