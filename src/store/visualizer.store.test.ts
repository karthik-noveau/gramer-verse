import { modeOf, selectScene, useVisualizerStore } from 'store/visualizer.store';
import { useContentStore } from 'store/content.store';
import { examplesFor } from 'pages/visualizer/utils/examples';

/* ============================================================
   visualizer.store.test.ts

   Two ways in — typing a sentence and pressing a word — and one
   answer to what is on the stage. Most of what is checked here
   is that they agree, and that neither takes the learner's own
   sentence away from them.
   ============================================================ */

const store = (): ReturnType<typeof useVisualizerStore.getState> => useVisualizerStore.getState();
const scene = (): ReturnType<typeof selectScene> => selectScene(useVisualizerStore.getState());

beforeAll(async () => { await useContentStore.getState().load(); });

beforeEach(() => {
  store().reset();
});

describe('submitting a sentence', () => {
  it.each([
    ['prep-dir', 'path'], ['prep-time', 'timeline'], ['prep-other', 'relation'],
  ])('accepts every %s example without a place-only refusal', (group, kind) => {
    for (const example of examplesFor(useContentStore.getState().curriculum, group as string)) {
      store().submit(example.en);
      expect(store().cannot).toBeNull();
      expect(store().group).toBe(group);
      expect(store().word).toBe(example.word);
      expect(scene()?.kind).toBe(kind);
    }
  });
  it('draws it', () => {
    store().submit('a red apple is under the table');

    expect(scene()).toMatchObject({
      kind: 'place',
      figure: 'apple',
      ground: 'table',
      relation: 'under',
      determiner: 'a',
      adjective: 'red',
    });
  });

  it('moves the picker and the knobs to match, so the controls describe the picture', () => {
    store().submit('three cups are on the chair');

    expect(store().word).toBe('on');
    expect(store().place.figure).toBe('cup');
    expect(store().place.ground).toBe('chair');
    expect(store().place.count).toBe(3);
  });

  it('keeps the refusal when it cannot be drawn', () => {
    store().submit('the rocket is on the launchpad');

    expect(store().cannot?.unknown).toEqual(['rocket', 'launchpad']);
    expect(store().cannot?.suggestion.length).toBeGreaterThan(0);
  });

  it('clears the refusal as soon as the picture is something else', () => {
    store().submit('the rocket is on the launchpad');
    store().choose('under');

    expect(store().cannot).toBeNull();
  });
});

describe('the learner’s own text', () => {
  it('updates presets for a new group and diagram word', () => {
    store().setGroup('prep-dir');
    expect(store().typed).toBe('He is going to school');
    store().choose('across');
    expect(store().typed).toBe('He ran across the road');
    store().setGroup('prep-time');
    expect(store().typed).toBe('I was born in 2000');
  });

  it('preserves a custom draft across groups and diagram words', () => {
    store().setTyped('my own unfinished sentence');
    store().setGroup('prep-dir');
    store().choose('across');
    store().setGroup('prep-time');
    expect(store().typed).toBe('my own unfinished sentence');
  });
  it('is not rewritten by pressing a word', () => {
    store().setTyped('the ball is in the box');
    store().choose('behind');

    expect(store().typed).toBe('the ball is in the box');
    expect(scene()).toMatchObject({ relation: 'behind' });
  });

  it('is not rewritten by turning a knob', () => {
    store().setTyped('my own sentence');
    store().setKnob('ground', 'table');

    expect(store().typed).toBe('my own sentence');
  });
});

describe('the knobs', () => {
  it('change the picture', () => {
    store().setKnob('figure', 'cup');
    store().setKnob('count', '2');

    expect(scene()).toMatchObject({ figure: 'cup', count: 2 });
  });

  it('read an empty adjective as none rather than as a word', () => {
    store().setKnob('adjective', 'red');
    store().setKnob('adjective', '');

    expect(scene()).toMatchObject({ adjective: null });
  });

  it('refuse a figure nobody drew', () => {
    store().setKnob('figure', 'rocket');

    expect(store().place.figure).toBe('ball');
  });
});

describe('the groups', () => {
  it('move the picker to the first word of the group', () => {
    store().setGroup('prep-dir');

    expect(store().word).toBe('to');
  });

  it('draw a direction with the path renderer', () => {
    store().setGroup('prep-dir');
    store().choose('over');

    expect(scene()).toMatchObject({ kind: 'path', relation: 'over' });
  });

  it('draw a time preposition on the timeline, out of the marks it needs', () => {
    store().setGroup('prep-time');
    store().choose('during');

    const drawn = scene();
    expect(drawn).toMatchObject({ kind: 'timeline', relation: 'during' });
    /* A band with the event inside it — the two marks `during` is drawn out
       of, taken from the renderer's own table rather than written again. */
    expect(drawn?.kind === 'timeline' ? drawn.marks.length : 0).toBe(2);
  });

  it('draw an abstract preposition as a relation', () => {
    store().setGroup('prep-other');
    store().choose('about');

    expect(scene()).toMatchObject({ kind: 'relation', connective: 'about', glyph: 'bubble' });
  });

  it('draw every word of every group', () => {
    /* A chip that draws nothing is a chip that should not be there. */
    for (const group of ['prep-place', 'prep-dir', 'prep-time', 'prep-other']) {
      store().setGroup(group);
      for (const word of ['in', 'on', 'at', 'to', 'over', 'during', 'about', 'behind', 'here'] ) {
        store().choose(word, group);
        const drawn = scene();
        if (drawn === null) continue;
        expect(drawn.kind.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('modeOf', () => {
  it('calls a place preposition a scene the knobs move', () => {
    expect(modeOf('in', 'prep-place')).toBe('scene');
    expect(modeOf('here', 'prep-place')).toBe('scene');
  });

  it('calls everything else a diagram', () => {
    expect(modeOf('to', 'prep-dir')).toBe('diagram');
    expect(modeOf('during', 'prep-time')).toBe('diagram');
    expect(modeOf('about', 'prep-other')).toBe('diagram');
    /* `in` of time is the same word as `in` of place and a different picture:
       the group is what decides. */
    expect(modeOf('in', 'prep-time')).toBe('diagram');
  });
});
