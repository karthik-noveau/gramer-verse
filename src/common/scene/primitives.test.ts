import { FLOOR, STAGE } from 'common/scene/layout';
import {
  arrow,
  circle,
  ellipse,
  floorLine,
  group,
  line,
  path,
  rect,
  ring,
  shadow,
  text,
} from 'common/scene/primitives';
import type { SceneNode } from 'common/scene/types';

const flatten = (node: SceneNode): readonly SceneNode[] => [
  node,
  ...(node.children ?? []).flatMap(flatten),
];

describe('primitives', () => {
  describe('shapes', () => {
    it('makes a rect', () => {
      const node = rect('box', { x: 10, y: 20, w: 30, h: 40, r: 4, fill: 'var(--accent)' });

      expect(node.tag).toBe('rect');
      expect(node.id).toBe('box');
      expect(node.attrs).toEqual({
        x: 10,
        y: 20,
        width: 30,
        height: 40,
        rx: 4,
        fill: 'var(--accent)',
      });
    });

    it('makes a circle, an ellipse, a line and a path', () => {
      expect(circle('ball', { cx: 1, cy: 2, r: 3 }).tag).toBe('circle');
      expect(ellipse('sh', { cx: 1, cy: 2, rx: 3, ry: 4 }).tag).toBe('ellipse');
      expect(line('l', { x1: 0, y1: 0, x2: 1, y2: 1 }).tag).toBe('line');
      expect(path('p', { d: 'M0,0 L1,1' }).tag).toBe('path');
    });

    it('leaves out the attributes it was not given, rather than emitting empties', () => {
      const node = circle('ball', { cx: 1, cy: 2, r: 3 });

      expect(Object.keys(node.attrs).sort()).toEqual(['cx', 'cy', 'fill', 'r']);
    });

    it('rounds every coordinate at construction', () => {
      const node = rect('box', { x: 10.04999, y: 20.55, w: 30.123, h: 40.789 });

      expect(node.attrs).toMatchObject({ x: 10, y: 20.6, width: 30.1, height: 40.8 });
    });

    it('returns data, never a string', () => {
      const node: SceneNode = rect('box', { x: 0, y: 0, w: 1, h: 1 });

      expect(typeof node).toBe('object');
      expect(JSON.stringify(node)).toContain('"tag":"rect"');
    });
  });

  describe('ids', () => {
    it('uses the id it is given', () => {
      expect(rect('figure-0', { x: 0, y: 0, w: 1, h: 1 }).id).toBe('figure-0');
    });

    it('produces the same node twice for the same arguments', () => {
      const a = rect('ground', { x: 1.23456, y: 2, w: 3, h: 4 });
      const b = rect('ground', { x: 1.23456, y: 2, w: 3, h: 4 });

      expect(a).toEqual(b);
      expect(a.id).toBe(b.id);
    });
  });

  describe('text', () => {
    it('carries the theme custom properties, not literal colours', () => {
      const node = text('label', { x: 10, y: 20, content: 'in' });

      expect(node.text).toBe('in');
      expect(node.attrs['fill']).toBe('var(--muted)');
      expect(node.attrs['font-family']).toBe('var(--font)');
      expect(JSON.stringify(node)).not.toMatch(/#[0-9a-f]{3,6}/i);
    });

    it('takes the Tamil stack when the text is Tamil', () => {
      const node = text('label', { x: 0, y: 0, content: 'பந்து', lang: 'ta' });

      expect(node.attrs['font-family']).toBe('var(--tamil)');
      expect(node.attrs['xml:lang']).toBe('ta');
    });

    it('takes anchor, size and weight', () => {
      const node = text('t', { x: 0, y: 0, content: 'x', anchor: 'start', size: 20, weight: 700 });

      expect(node.attrs).toMatchObject({ 'text-anchor': 'start', 'font-size': 20, 'font-weight': 700 });
    });
  });

  describe('group', () => {
    it('translates and scales', () => {
      const node = group('figure', [circle('ball', { cx: 0, cy: 0, r: 5 })], {
        x: 10.44,
        y: 20,
        scale: 0.5,
      });

      expect(node.tag).toBe('g');
      expect(node.attrs['transform']).toBe('translate(10.4,20) scale(0.5)');
      expect(node.children).toHaveLength(1);
    });

    it('leaves out a scale of exactly one', () => {
      const node = group('g', [], { x: 1, y: 2, scale: 1 });

      expect(node.attrs['transform']).toBe('translate(1,2)');
    });

    it('is still a group when it is empty, so the diff has something to match', () => {
      const node = group('empty', []);

      expect(node.tag).toBe('g');
      expect(node.children).toEqual([]);
    });

    it('names its role, so a picture-word can light it', () => {
      expect(group('g', [], { role: 'figure' }).attrs['data-node']).toBe('figure');
    });
  });

  describe('scene furniture', () => {
    it('draws the floor across the stage, inset from both edges', () => {
      const node = floorLine();

      expect(node.attrs['y1']).toBe(FLOOR);
      expect(node.attrs['y2']).toBe(FLOOR);
      expect(Number(node.attrs['x1'])).toBeGreaterThan(0);
      expect(Number(node.attrs['x2'])).toBeLessThan(STAGE.width);
    });

    it('puts the shadow under the thing, in the theme’s shadow colour', () => {
      const node = shadow('figure-shadow', 100, 200);

      expect(node.tag).toBe('ellipse');
      expect(node.attrs).toMatchObject({ cx: 200, cy: FLOOR + 3, fill: 'var(--shadow-ink)' });
    });

    it('rings a box with the accent, dashed', () => {
      const node = ring('r', { x: 10, y: 10, w: 50, h: 50 });

      expect(node.attrs).toMatchObject({ x: 1, y: 1, width: 68, height: 68, stroke: 'var(--accent)' });
      expect(node.attrs['stroke-dasharray']).toBe('9 7');
    });
  });

  describe('arrow', () => {
    it('is one group: a shaft and a head', () => {
      const node = arrow('a', { from: [0, 0], to: [100, 0] });

      expect(node.tag).toBe('g');
      expect(node.children?.map((c) => c.id)).toEqual(['a-shaft', 'a-head']);
    });

    it('draws a straight shaft when it is not curved', () => {
      const node = arrow('a', { from: [0, 10], to: [100, 10] });

      expect(node.children?.[0]?.attrs['d']).toBe('M0,10 L100,10');
    });

    it('bows the shaft when it is', () => {
      const node = arrow('a', { from: [0, 10], to: [100, 10], curve: 0.3 });

      expect(String(node.children?.[0]?.attrs['d'])).toContain('Q');
    });

    it('points the head along the shaft, not square to it', () => {
      const rightwards = arrow('a', { from: [0, 0], to: [100, 0] });
      const upwards = arrow('a', { from: [0, 100], to: [0, 0] });

      expect(rightwards.children?.[1]?.attrs['d']).not.toBe(upwards.children?.[1]?.attrs['d']);
    });

    it('lands the head on the arrow’s end point', () => {
      const node = arrow('a', { from: [0, 0], to: [100, 40] });

      expect(String(node.children?.[1]?.attrs['d']).startsWith('M100,40')).toBe(true);
    });

    it('uses no markers at all, so two scenes on a page cannot share one', () => {
      const node = arrow('a', { from: [0, 0], to: [10, 0] });

      for (const child of flatten(node)) {
        expect(JSON.stringify(child.attrs)).not.toContain('marker');
      }
    });

    it('takes its colour from a token', () => {
      const node = arrow('a', { from: [0, 0], to: [10, 0] });

      expect(node.children?.[0]?.attrs['stroke']).toBe('var(--r-rel)');
    });
  });

  describe('the module as a whole', () => {
    it('names no literal colour anywhere', () => {
      const nodes = [
        rect('r', { x: 0, y: 0, w: 1, h: 1, fill: 'var(--surface)' }),
        floorLine(),
        shadow('s', 0, 10),
        ring('ring', { x: 0, y: 0, w: 1, h: 1 }),
        arrow('a', { from: [0, 0], to: [1, 1] }),
        text('t', { x: 0, y: 0, content: 'x' }),
      ];

      expect(JSON.stringify(nodes)).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
    });
  });
});
