import { fireEvent, render, screen } from '@testing-library/react';

import {
  Formation,
  baseRole,
  fromScene,
  noteFor,
  sentencePattern,
} from 'common/components/Formation/Formation';
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
  ...container.querySelectorAll<SVGPathElement>('path[data-connection-role]'),
];

describe('Formation', () => {
  it('draws one curve per shared job', () => {
    const { container } = render(<Formation spec={FUSED} />);

    /* figure, be, rel, ground — four jobs, four lines. */
    expect(curves(container)).toHaveLength(4);
  });

  it('separates the connection ports beneath a fused Tamil word', () => {
    /* English needs two words where Tamil has one, and that is the point of
       the picture rather than a glitch to tidy away. */
    const { container } = render(<Formation spec={FUSED} />);
    const fusedWord = screen.getByText('பெட்டியில்', { selector: 'text' });
    const onFused = curves(container).filter((path) =>
      path.getAttribute('data-source-x') === fusedWord.getAttribute('x'));
    expect(onFused).toHaveLength(2);
    const starts = onFused.map((path) => Number(path.getAttribute('d')?.match(/^M([\d.]+),/)?.[1]));
    expect(Math.abs((starts[0] ?? 0) - (starts[1] ?? 0))).toBe(12);
    expect(((starts[0] ?? 0) + (starts[1] ?? 0)) / 2).toBe(Number(fusedWord.getAttribute('x')));
  });

  it('gives each connection a contrasting crossing outline and clear endpoints', () => {
    const { container } = render(<Formation spec={FUSED} />);
    for (const path of curves(container)) {
      expect(path.getAttribute('stroke-width')).toBe('2');
      expect(path.getAttribute('opacity')).toBe('0.85');
      expect(path.getAttribute('stroke-linecap')).toBe('round');
      const halo = path.previousElementSibling;
      expect(halo?.getAttribute('d')).toBe(path.getAttribute('d'));
      expect(halo?.getAttribute('stroke-width')).toBe('5');
      expect(path.parentElement?.querySelectorAll('circle')).toHaveLength(2);
    }
  });

  it('keeps reordered connections centered on their destination words', () => {
    const question = spec('Shall we begin?', 'Shall:be1 | we:figure | begin:be2',
      'நாம் தொடங்கலாமா?', 'நாம்:figure | தொடங்கலாமா:be1:be2');
    const { container } = render(<Formation spec={question} />);
    const paths = curves(container);
    for (const path of paths) {
      const role = path.getAttribute('data-connection-role');
      const token = question.enTokens.find((candidate) => candidate.roles.includes(role!))!;
      const word = screen.getByText(token.text, { selector: 'text' });
      const endpoint = path.parentElement?.querySelector('circle:last-child');
      expect(endpoint?.getAttribute('cx')).toBe(word.getAttribute('x'));
      expect(path.getAttribute('d')).toContain('C');
      expect(path.getAttribute('d')).not.toMatch(/[HQ]/);
    }
  });

  it('captions the fused word, in Tamil, and captions nothing else', () => {
    const { container } = render(<Formation spec={FUSED} />);
    const captions = [...container.querySelectorAll('text')].filter(
      (node) => node.classList.contains('caption'),
    );

    expect(captions).toHaveLength(1);
    expect(captions[0]?.textContent).toBe('தொடர்பு + இடம்');
  });

  it('keeps longer sentences readable with connectors clear of both word rows', () => {
    const long = spec('I had been writing for an hour before he arrived.',
      'I:figure | had been writing:be1 | for an hour:qual | before:rel | he:figure2 | arrived:be2',
      'அவர் வருவதற்கு முன் நான் ஒரு மணி நேரமாக எழுதிக்கொண்டிருந்தேன்.',
      'அவர்:figure2 | வருவதற்கு:be2 | முன்:rel | நான்:figure | ஒரு மணி நேரமாக:qual | எழுதிக்கொண்டிருந்தேன்:be1');
    const { container } = render(<Formation spec={long} />);
    const paths = curves(container);
    expect(paths).toHaveLength(6);
    const wordY = Number(screen.getByText('I', { selector: 'text' }).getAttribute('y'));
    for (const path of paths) {
      const ports = path.parentElement?.querySelectorAll('circle');
      const top = Number(ports?.[0]?.getAttribute('cy'));
      const bottom = Number(ports?.[1]?.getAttribute('cy'));
      expect(bottom - top).toBeGreaterThanOrEqual(92);
      expect(wordY - bottom).toBeGreaterThanOrEqual(20);
    }
    const height = Number(screen.getByRole('img').getAttribute('viewBox')?.split(' ')[3]);
    expect(height - wordY).toBeGreaterThanOrEqual(66);
  });

  it('draws no curve from a word with no counterpart', () => {
    render(<Formation spec={FUSED} />);
    /* On the drawing, not in the note above it — the note names the same word. */
    const article = screen.getByText('The', { selector: 'text' });

    /* Tamil has no article, so the word is drawn faded and joined to nothing. */
    expect(article.getAttribute('opacity')).toBe('0.55');
  });

  it('carries both sentences as its label', () => {
    render(<Formation spec={FUSED} />);

    expect(screen.getByRole('img').getAttribute('aria-label')).toBe(
      'The ball is in the box — பந்து பெட்டியில் உள்ளது',
    );
  });

  it('shows the English sentence formation below the diagram and lets it be hidden', () => {
    render(<Formation spec={FUSED} />);

    expect(sentencePattern(FUSED.enTokens).map((part) => part.label)).toEqual([
      'Determiner',
      'Subject',
      'Verb',
      'Preposition',
      'Object',
    ]);
    const formation = screen.getByTestId('sentence-formation');
    expect(formation.getAttribute('aria-label')).toBe(
      'Determiner + Subject + Verb + Preposition + Object',
    );
    const labels = [...formation.querySelectorAll('text')]
      .filter((node) => node.textContent !== '+')
      .map((node) => ({ text: node.textContent, x: node.getAttribute('x') }));
    const words = ['The', 'ball', 'is', 'in', 'the box'].map((word) => {
      const node = screen.getByText(word, { selector: 'text' });
      return { word, x: node.getAttribute('x') };
    });

    expect(labels.map((label) => label.x)).toEqual(words.map((word) => word.x));
    expect(formation.querySelectorAll('rect')).toHaveLength(labels.length);
    expect(formation.querySelector('circle')).toBeNull();
    const connectors = [...formation.querySelectorAll('text')]
      .filter((node) => node.textContent === '+');
    expect(connectors).toHaveLength(labels.length - 1);
    for (const connector of connectors) {
      expect(connector.getAttribute('aria-hidden')).toBe('true');
      expect(connector.getAttribute('fill')).toBe('var(--muted)');
    }
    expect(formation.querySelector('line, path, polyline')).toBeNull();
    const roleColours = ['det', 'figure', 'be', 'rel', 'ground'].map((role) => `var(--r-${role})`);
    for (const [index, tag] of [...formation.querySelectorAll('rect')].entries()) {
      const colour = roleColours[index];
      expect(tag.getAttribute('fill')).toBe(`color-mix(in srgb, ${colour} 10%, var(--surface))`);
      expect(tag.getAttribute('stroke')).toBe(colour);
      expect(Number(tag.getAttribute('y')) - Number(screen.getByText('ball', { selector: 'text' }).getAttribute('y'))).toBe(28);
      expect(tag.getAttribute('height')).toBe('22');
      expect(tag.getAttribute('rx')).toBe('6');
    }
    const tagLabels = [...formation.querySelectorAll('text')].filter((node) => node.textContent !== '+');
    for (const [index, label] of tagLabels.entries()) {
      expect(label.getAttribute('fill')).toBe(roleColours[index]);
      expect(label.getAttribute('font-weight')).toBe('600');
    }

    fireEvent.click(screen.getByRole('button', { name: 'Hide sentence formation' }));
    expect(screen.queryByTestId('sentence-formation')).toBeNull();
    expect(screen.getByRole('button', { name: 'Show sentence formation' })).toBeTruthy();
  });

  it('keeps verb labels simple while identifying the other sentence parts', () => {
    expect(
      sentencePattern([
        { text: 'He', roles: ['figure'] },
        { text: 'has been writing', roles: ['be'] },
        { text: 'for an hour', roles: ['qual'] },
      ]).map((part) => part.label),
    ).toEqual(['Subject', 'Verb', 'Time Phrase']);

    expect(
      sentencePattern([
        { text: 'Where', roles: ['det'] },
        { text: 'did', roles: [] },
        { text: 'you', roles: ['figure'] },
        { text: 'play', roles: ['be'] },
      ]).map((part) => part.label),
    ).toEqual(['Question Word', 'Verb', 'Subject', 'Verb']);

    expect(
      sentencePattern([
        { text: 'I', roles: ['figure'] },
        { text: 'can', roles: ['be1'] },
        { text: 'write', roles: ['be2'] },
      ]).map((part) => part.label),
    ).toEqual(['Subject', 'Verb', 'Verb']);
  });

  it('keeps the subject after an inverted modal instead of calling it an object', () => {
    expect(sentencePattern(parseAlignment('Shall:be1 | we:figure | begin:be2')).map((part) => part.label))
      .toEqual(['Verb', 'Subject', 'Verb']);
    expect(sentencePattern(parseAlignment('Could:be1 | you:figure | help:be2 | me:ground')).map((part) => part.label))
      .toEqual(['Verb', 'Subject', 'Verb', 'Object']);
    expect(sentencePattern(parseAlignment('Bring:be | the book:figure')).map((part) => part.label))
      .toEqual(['Verb', 'Object']);
  });

  it('says the fusion and the orphan in one line, in Tamil', () => {
    const { container } = render(<Formation spec={FUSED} />);
    /* The line is assembled from runs, so the English words in it can be set
       apart from the Tamil around them; it is read whole here. */
    const note = container.querySelector('p')?.textContent ?? '';

    expect(note).toContain('ஆங்கிலத்தில் இரண்டு சொல்');
    expect(note).toContain('in + the box');
    expect(note).toContain('தனிச் சொல் இல்லை');
  });

  it('sets the English words of the note apart from the Tamil', () => {
    const { container } = render(<Formation spec={FUSED} />);
    const english = [...container.querySelectorAll('p b')].map((b) => b.textContent);

    expect(english).toEqual(['in + the box', 'The']);
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
    render(<Formation spec={two} />);

    expect(baseRole('ground2')).toBe('ground');
    for (const word of ['the chair', 'நாற்காலிக்கு']) {
      expect(screen.getByText(word, { selector: 'text' }).getAttribute('fill')).toBe('var(--r-ground)');
    }
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
