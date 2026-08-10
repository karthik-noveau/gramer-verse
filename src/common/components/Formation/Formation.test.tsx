import { render, screen } from '@testing-library/react';

import { Formation, baseRole, fromScene, noteFor } from 'common/components/Formation/Formation';
import { parseAlignment } from 'common/api/validate';
import type { FormationSpec, PlaceSpec, PropId, SentenceTemplates } from 'common/scene/types';

/* ============================================================
   Formation.test.tsx

   The three things the picture is for: lines that cross, two
   lines landing on one Tamil word, and an English word with no
   line at all. Each is asserted on the drawing rather than on
   the data it came from.
   ============================================================ */

const spec = (en: string, enAlign: string, ta: string, taAlign: string): FormationSpec => ({
  en,
  ta,
  enTokens: parseAlignment(enAlign),
  taTokens: parseAlignment(taAlign),
});

/** The lesson sentence: `in` + `the box` fusing into one Tamil word, and an
 *  article with nothing to join. */
const FUSED = spec(
  'The ball is in the box',
  'The | ball:figure | is:be | in:rel | the box:ground',
  'பந்து பெட்டியில் உள்ளது',
  'பந்து:figure | பெட்டியில்:rel:ground | உள்ளது:be',
);

const curves = (container: HTMLElement): readonly SVGPathElement[] => [
  ...container.querySelectorAll('path'),
];

describe('Formation', () => {
  it('draws one curve per shared job', () => {
    const { container } = render(<Formation spec={FUSED} />);

    /* figure, be, rel, ground — four jobs, four lines. */
    expect(curves(container)).toHaveLength(4);
  });

  it('lands two curves on the fused Tamil word', () => {
    /* English needs two words where Tamil has one, and that is the point of
       the picture rather than a glitch to tidy away. */
    const { container } = render(<Formation spec={FUSED} />);
    const ends = curves(container).map((path) => path.getAttribute('d')?.split(' ')[0]);
    const onFused = ends.filter((start) => start === ends[2]);

    expect(onFused.length).toBeGreaterThanOrEqual(2);
  });

  it('captions the fused word, in Tamil, and captions nothing else', () => {
    const { container } = render(<Formation spec={FUSED} />);
    const captions = [...container.querySelectorAll('text')].filter(
      (node) => node.getAttribute('font-size') === '11',
    );

    expect(captions).toHaveLength(1);
    expect(captions[0]?.textContent).toBe('தொடர்பு + இடம்');
  });

  it('draws no curve from a word with no counterpart', () => {
    render(<Formation spec={FUSED} />);
    const article = screen.getByText('The');

    /* Tamil has no article, so the word is drawn faded and joined to nothing. */
    expect(article.getAttribute('opacity')).toBe('0.55');
  });

  it('carries both sentences as its label', () => {
    render(<Formation spec={FUSED} />);

    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'The ball is in the box — பந்து பெட்டியில் உள்ளது',
    );
  });

  it('says the fusion and the orphan in one line, in Tamil', () => {
    render(<Formation spec={FUSED} />);

    expect(screen.getByText(/ஆங்கிலத்தில் இரண்டு சொல்/).textContent).toContain('in + the box');
    expect(screen.getByText(/தனிச் சொல் இல்லை/)).toBeTruthy();
  });

  it('says nothing at all when there is nothing to report', () => {
    /* 
       A row where nothing fuses and nothing is orphaned shows the picture
       instead of a line of small text. */
    const plain = spec(
      'I play cricket',
      'I:figure | play:be | cricket:ground',
      'நான் cricket விளையாடுறேன்',
      'நான்:figure | cricket:ground | விளையாடுறேன்:be',
    );

    expect(noteFor(plain)).toBe('');
    const { container } = render(<Formation spec={plain} />);
    expect(container.querySelector('p')).toBeNull();
  });

  it('strips a repeat digit before looking up a colour', () => {
    /* `ground2` is a second place in one sentence, not a ninth job. */
    const two = spec(
      'between the table and the chair',
      'between:rel | the table:ground | and:join | the chair:ground2',
      'மேசை மற்றும் நாற்காலிக்கு இடையில்',
      'மேசை:ground | மற்றும்:join | நாற்காலிக்கு:ground2 | இடையில்:rel',
    );
    const { container } = render(<Formation spec={two} />);

    expect(baseRole('ground2')).toBe('ground');
    expect(container.querySelector('[fill="var(--muted)"][font-size="15"]')).toBeNull();
  });
});

/* ---- from a live scene ------------------------------------- */

describe('fromScene', () => {
  const TEMPLATE: SentenceTemplates = {
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

  const SCENE: PlaceSpec = {
    kind: 'place',
    figure: 'ball' as PropId,
    ground: 'box' as PropId,
    ground2: null,
    relation: 'in',
    determiner: 'the',
    count: 1,
    adjective: null,
  };

  it('builds the same shape with no authored alignment', () => {
    const built = fromScene(SCENE, TEMPLATE);

    expect(built.en).toBe('The ball is in the box');
    expect(built.ta).toBe('பந்து பெட்டியில் உள்ளது');
  });

  it('fuses the Tamil ground, because the relation is an ending on it', () => {
    const built = fromScene(SCENE, TEMPLATE);
    const ground = built.taTokens.find((token) => token.text === 'பெட்டியில்');

    expect(ground?.roles).toEqual(['rel', 'ground']);
  });

  it('merges the bare article into the English ground', () => {
    /* Left split, "the" would dangle with no Tamil counterpart and read as a
       missing word rather than a merged one. */
    const built = fromScene(SCENE, TEMPLATE);

    expect(built.enTokens.map((token) => token.text)).toContain('the box');
  });

  it('renders, and says the fusion', () => {
    render(<Formation spec={fromScene(SCENE, TEMPLATE)} />);

    expect(screen.getByRole('img')).toBeTruthy();
    expect(screen.getByText(/ஒரே சொல்/)).toBeTruthy();
  });
});
