import { render, screen } from '@testing-library/react';

import { PredictResult } from 'pages/lesson/components/PredictResult/PredictResult';
import type { KnobOption, NonEmptyString, PlaceSpec, PropId, SentenceTemplates } from 'common/scene/types';

const bi = (en: string, ta: string): { en: NonEmptyString; ta: NonEmptyString } => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const id = (value: string): PropId => value as PropId;

const SCENE: PlaceSpec = {
  kind: 'place',
  figure: id('ball'),
  ground: id('box'),
  ground2: null,
  relation: 'in',
  determiner: 'the',
  count: 1,
  adjective: null,
};

const TEMPLATES: SentenceTemplates = {
  en: [
    { slot: 'det' },
    { slot: 'figure' },
    { slot: 'be' },
    { slot: 'relation' },
    { slot: 'text', text: 'the' },
    { slot: 'ground' },
  ],
  ta: [
    { slot: 'figure', case: 'nominative' },
    { slot: 'ground', case: 'locative' },
    { slot: 'be' },
  ],
};

const SAID: KnobOption = { value: 'on', label: bi('on top of the box', 'பெட்டியின் மேல்') };
const TRUTH: KnobOption = { value: 'in', label: bi('inside the box', 'பெட்டிக்கு உள்ளே') };

const renderResult = (): ReturnType<typeof render> =>
  render(
    <PredictResult
      said={SAID}
      truth={TRUTH}
      saidScene={{ ...SCENE, relation: 'on' }}
      trueScene={SCENE}
      templates={TEMPLATES}
    />,
  );

describe('PredictResult', () => {
  it('labels the two columns for what they are', () => {
    renderResult();

    expect(screen.getByText('What you said')).toBeTruthy();
    expect(screen.getByText('What is true here')).toBeTruthy();
  });

  it('labels them in Tamil as well', () => {
    renderResult();

    expect(screen.getByText('நீங்கள் சொன்னது')).toBeTruthy();
    expect(screen.getByText('இங்கே உண்மை')).toBeTruthy();
  });

  it('spells out both sentences, so the differing word can be read off', () => {
    renderResult();

    expect(screen.getByText('The ball is on the box')).toBeTruthy();
    expect(screen.getByText('The ball is in the box')).toBeTruthy();
  });

  it('spells both out in Tamil too, where the difference is an ending', () => {
    renderResult();

    /* Both are பெட்டியில் — the Tamil for `in` and `on` is the same locative,
       and seeing that is the point of the second column. */
    expect(screen.getAllByText('பந்து பெட்டியில் உள்ளது')).toHaveLength(2);
  });

  it('names the option each column stands for', () => {
    renderResult();

    expect(screen.getByText('on top of the box')).toBeTruthy();
    expect(screen.getByText('inside the box')).toBeTruthy();
  });

  it('tags each line with its own language', () => {
    const { container } = renderResult();
    const tamil = [...container.querySelectorAll('[lang="ta"]')].map((node) => node.textContent);

    expect(tamil).toContain('பந்து பெட்டியில் உள்ளது');
  });
});
