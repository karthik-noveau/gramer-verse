import { formationFor } from 'common/api/content.api';
import type { Curriculum, FormationSpec } from 'common/scene/types';
import { resolve, tokenize } from 'pages/visualizer/utils/resolver';

export type VisualizerExample = {
  readonly group: string;
  readonly word: string;
  readonly en: string;
  readonly formation?: FormationSpec;
};

/** Place examples must name props the interactive scene can actually draw. */
const PLACE_SENTENCES = [
  'the ball is in the box',
  'a red apple is under the table',
  'three cups are on the table',
  'the cat is behind the chair',
  'the man is at the shop',
  'the clock is above the door',
  'the ball is below the table',
  'the cat is in front of the chair',
  'the ball is between the box and the chair',
  'the dog is near the tree',
  'the cat is beside the box',
  'the ball is here',
  'the ball is there',
];

const PLACE_EXAMPLES: readonly VisualizerExample[] = PLACE_SENTENCES.flatMap((en) => {
  const result = resolve(en);
  return result.status === 'drawn'
    ? [{ group: 'prep-place', word: result.spec.relation, en }]
    : [];
});

/** Reuse the validated curriculum's English, Tamil and word alignments.
 *  Time's in/on/at examples live in the common-prepositions table. */
export function examplesFor(curriculum: Curriculum | null, group: string): readonly VisualizerExample[] {
  if (group === 'prep-place' || group === 'prep-common') return PLACE_EXAMPLES;
  if (!curriculum) return [];

  return curriculum.tables.flatMap((table) => {
    const commonTime = group === 'prep-time' && table.id === 'prep-common';
    if (table.id !== group && !commonTime) return [];

    return table.rows.flatMap((row, index) => {
      if (commonTime && row[1] !== 'Time') return [];
      // The source's "until / till" row uses the canonical "until" chip.
      const word = row[0]?.split('/')[0]?.trim().toLowerCase();
      const formation = formationFor(curriculum, table.id, index);
      if (!word || !formation) return [];
      return [{ group, word, en: formation.en, formation }];
    });
  });
}

const normalized = (value: string): string => tokenize(value.replace(/[‘’]/g, "'")).join(' ');

/** Recognise supported examples without pretending to parse arbitrary actions. */
export function exampleForText(curriculum: Curriculum | null, value: string): VisualizerExample | undefined {
  const text = normalized(value);
  return ['prep-place', 'prep-dir', 'prep-time', 'prep-other']
    .flatMap((group) => examplesFor(curriculum, group))
    .find((example) => normalized(example.en) === text);
}
