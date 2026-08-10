import { diffScenes, stayedPut } from 'common/scene/diff';
import { renderScene } from 'common/scene/renderers/registry';
import type { PlaceSpec, PropId, SceneNode } from 'common/scene/types';

/* ============================================================
   diff.test.ts

   The claim the whole animation rests on: the ball that was in
   the box and is now above the table is the *same ball*. If the
   diff says it left and another arrived, the picture flickers
   and the lesson stops being about one thing moving.
   ============================================================ */

const id = (value: string): PropId => value as PropId;

const node = (nodeId: string, transform = 'translate(0,0)'): SceneNode => ({
  id: nodeId,
  tag: 'g',
  attrs: { transform },
  children: [],
});

const PLACE: PlaceSpec = {
  kind: 'place',
  figure: id('ball'),
  ground: id('box'),
  ground2: null,
  relation: 'in',
  determiner: 'the',
  count: 1,
  adjective: null,
};

describe('diffScenes', () => {
  it('calls a node in both, drawn the same, unchanged', () => {
    const diff = diffScenes([node('a'), node('b')], [node('a'), node('b')]);

    expect(diff.unchanged).toEqual(['a', 'b']);
    expect(diff.moved).toEqual([]);
    expect(diff.entered).toEqual([]);
    expect(diff.exited).toEqual([]);
  });

  it('calls a node drawn somewhere else moved', () => {
    const diff = diffScenes([node('a'), node('b')], [node('a', 'translate(40,10)'), node('b')]);

    expect(diff.moved).toEqual(['a']);
    expect(diff.unchanged).toEqual(['b']);
  });

  it('notices a change that is not a move', () => {
    /* A prop redrawn in another colour has not gone anywhere, but it is not
       the same picture either. */
    const red: SceneNode = { ...node('a'), children: [{ id: 'body', tag: 'circle', attrs: { fill: 'var(--prop-red)' } }] };
    const green: SceneNode = { ...node('a'), children: [{ id: 'body', tag: 'circle', attrs: { fill: 'var(--prop-leaf)' } }] };

    expect(diffScenes([red], [green]).moved).toEqual(['a']);
    expect(stayedPut(red, green)).toBe(true);
  });

  it('calls a node only in the new picture entered', () => {
    const diff = diffScenes([node('a')], [node('a'), node('b')]);

    expect(diff.entered).toEqual(['b']);
    expect(diff.exited).toEqual([]);
  });

  it('hands back the whole node for one that left, because it is still drawn', () => {
    const gone = node('b', 'translate(9,9)');
    const diff = diffScenes([node('a'), gone], [node('a')]);

    expect(diff.exited).toEqual([gone]);
    expect(diff.entered).toEqual([]);
  });

  it('treats the first picture as all arrivals, and as a replacement', () => {
    /* Everything arrives, and none of it animates: opening a lesson is not a
       change to it, and a picture that fades in on arrival looks like a page
       that has not finished loading. */
    const diff = diffScenes([], [node('a'), node('b')]);

    expect(diff.entered).toEqual(['a', 'b']);
    expect(diff.replaced).toBe(true);
  });

  it('treats a picture that draws nothing as all departures', () => {
    const diff = diffScenes([node('a')], []);

    expect(diff.exited).toHaveLength(1);
  });

  it('calls two pictures with nothing in common a replacement', () => {
    /* A different lesson, not a different state of this one: tweening between
       them is a pile of things sliding across each other to no purpose. */
    const diff = diffScenes([node('a'), node('b')], [node('c'), node('d')]);

    expect(diff.replaced).toBe(true);
  });

  it('does not count the floor as something in common', () => {
    const diff = diffScenes([node('floor'), node('a')], [node('floor'), node('c')]);

    expect(diff.replaced).toBe(true);
  });

  it('reads nothing back from the DOM', () => {
    /* Both positions are in the trees already. Asking the browser for geometry
       mid-render is what turns an animation into a layout thrash. */
    const source = diffScenes.toString();

    expect(source).not.toMatch(/getBoundingClientRect|offsetWidth|getComputedStyle|document/);
  });
});

/* ---- against the real renderers ---------------------------- */

describe('a knob turned on a real scene', () => {
  it('moves the ball rather than replacing it', () => {
    const inside = renderScene(PLACE);
    const above = renderScene({ ...PLACE, relation: 'above', ground: id('table') });
    const diff = diffScenes(inside, above);

    expect(diff.replaced).toBe(false);
    expect(diff.moved).toContain('figure-0');
    expect(diff.entered).not.toContain('figure-0');
    expect(diff.exited.map((node_) => node_.id)).not.toContain('figure-0');
  });

  it('keeps all three figures when the count changes', () => {
    const one = renderScene(PLACE);
    const three = renderScene({ ...PLACE, count: 3 });
    const diff = diffScenes(one, three);

    /* The first ball stays and is resized; the other two are new. Ids are
       `figure-0`, `figure-1`, `figure-2` — never array positions that shuffle. */
    expect(diff.moved).toContain('figure-0');
    expect(diff.entered).toEqual(expect.arrayContaining(['figure-1', 'figure-2']));
  });

  it('takes the marks away that the new relation does not use', () => {
    const near = renderScene({ ...PLACE, relation: 'near', ground: id('table') });
    const beside = renderScene({ ...PLACE, relation: 'beside', ground: id('table') });
    const diff = diffScenes(near, beside);

    /* `near` measures the gap and `beside` has none to measure. */
    expect(diff.exited.map((node_) => node_.id)).toContain('mark-span');
  });

  it('calls a different lesson a replacement', () => {
    const place = renderScene(PLACE);
    const timeline = renderScene({
      kind: 'timeline',
      tense: 'past-simple',
      marks: [],
      relation: null,
    });

    expect(diffScenes(place, timeline).replaced).toBe(true);
  });

  it('handles the heaviest change in the catalogue inside a frame', () => {
    /* Three figures moving at once, which is the most this product ever
       animates. The budget owned here is the diff and the two trees it
       compares; the paint is the browser's and is a transform transition,
       which is why the movement is a transform and not an x/y attribute. */
    const inside = renderScene({ ...PLACE, count: 3 });
    const above = renderScene({ ...PLACE, count: 3, relation: 'above', ground: id('table') });

    /* The fastest of five: one reading on a loaded machine measures the
       scheduler as much as the code. */
    let best = Infinity;
    for (let run = 0; run < 5; run += 1) {
      const started = performance.now();
      diffScenes(inside, above);
      best = Math.min(best, performance.now() - started);
    }

    expect(diffScenes(inside, above).moved).toEqual(
      expect.arrayContaining(['figure-0', 'figure-1', 'figure-2']),
    );
    expect(best).toBeLessThan(16);
  });

  it('says nothing changed when nothing changed', () => {
    const diff = diffScenes(renderScene(PLACE), renderScene(PLACE));

    expect(diff.moved).toEqual([]);
    expect(diff.entered).toEqual([]);
    expect(diff.exited).toEqual([]);
    expect(diff.unchanged.length).toBeGreaterThan(0);
  });
});
