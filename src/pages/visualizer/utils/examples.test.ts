import { loadCurriculum } from 'common/api/content.api';
import type { Curriculum } from 'common/scene/types';
import { exampleForText, examplesFor } from 'pages/visualizer/utils/examples';
import { resolve } from 'pages/visualizer/utils/resolver';
import { WORDS } from 'store/visualizer.store';

let curriculum: Curriculum;
beforeAll(async () => { curriculum = await loadCurriculum(); });

describe('visualizer examples', () => {
  it.each(['prep-place', 'prep-dir', 'prep-time', 'prep-other'])(
    'covers every word in %s with a usable sentence', (group) => {
      const examples = examplesFor(curriculum, group);
      expect(new Set(examples.map((example) => example.word))).toEqual(new Set(WORDS[group]));
      for (const example of examples) {
        expect(example.en.length).toBeGreaterThan(10);
        expect(exampleForText(curriculum, example.en)).toEqual(example);
        if (group === 'prep-place') {
          expect(resolve(example.en).status).toBe('drawn');
        } else {
          expect(example.formation?.ta).toMatch(/[\u0B80-\u0BFF]/);
          expect(example.formation?.enTokens.length).toBeGreaterThan(0);
          expect(example.formation?.taTokens.length).toBeGreaterThan(0);
        }
      }
    },
  );

  it('distinguishes time in/on/at from place uses', () => {
    for (const word of ['in', 'on', 'at']) {
      const example = examplesFor(curriculum, 'prep-time').find((entry) => entry.word === word);
      expect(exampleForText(curriculum, example?.en ?? '')?.group).toBe('prep-time');
    }
    expect(exampleForText(curriculum, 'The ball is in the box.')?.group).toBe('prep-place');
  });

  it('accepts casing, punctuation, whitespace and straight apostrophes', () => {
    expect(exampleForText(curriculum, "  WE'LL   meet after lunch.  ")?.word).toBe('after');
    expect(exampleForText(curriculum, 'The rocket goes to the moon')).toBeUndefined();
  });

  it('keeps place working before the curriculum is ready', () => {
    expect(examplesFor(null, 'prep-place')).toHaveLength(13);
    expect(examplesFor(null, 'prep-time')).toEqual([]);
  });
});
