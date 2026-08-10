import { fireEvent, render, screen } from '@testing-library/react';

import { KnobBar } from 'pages/lesson/components/KnobBar/KnobBar';
import type { Lesson, LessonId, NonEmptyString, PlaceSpec, PropId, TopicId } from 'common/scene/types';

/* ============================================================
   KnobBar.test.tsx

   A control bar is only as good as the keyboard on it: six chips
   that are six tab stops is a bar nobody reaches the end of. Most
   of what is checked here is that a group is one stop and the
   arrows do the rest.
   ============================================================ */

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

const LESSON: Lesson = {
  id: 'prep-place-in' as LessonId,
  topicId: 'prepositions' as TopicId,
  order: 1,
  title: bi('in', 'உள்ளே'),
  idea: bi('Inside something.', 'ஒன்றின் உள்ளே.'),
  scene: SCENE,
  knobs: [
    {
      key: 'count',
      label: bi('How many', 'எத்தனை'),
      options: [
        { value: '1', label: bi('one', 'ஒன்று') },
        { value: '2', label: bi('two', 'இரண்டு') },
        { value: '3', label: bi('three', 'மூன்று') },
      ],
    },
    {
      key: 'ground',
      label: bi('The place', 'இடம்'),
      options: [
        { value: 'box', label: bi('box', 'பெட்டி') },
        { value: 'tree', label: bi('tree', 'மரம்') },
      ],
    },
  ],
  predict: null,
  why: bi('The box has sides.', 'பெட்டிக்குப் பக்கங்கள் உள்ளன.'),
  sentence: { en: [{ slot: 'figure' }], ta: [{ slot: 'figure', case: 'nominative' }] },
};

const KNOBS = { count: '1', ground: 'box' };

const renderBar = (
  props: Partial<React.ComponentProps<typeof KnobBar>> = {},
): { onChange: jest.Mock } & ReturnType<typeof render> => {
  const onChange = jest.fn();
  const view = render(
    <KnobBar lesson={LESSON} knobs={KNOBS} onChange={onChange} {...props} />,
  );
  return { onChange, ...view };
};

const chipsOf = (name: string): readonly HTMLElement[] =>
  screen.getAllByRole('group', { name: new RegExp(name) }).flatMap((group) =>
    [...group.querySelectorAll<HTMLButtonElement>('[data-chip]')],
  );

describe('KnobBar', () => {
  it('renders one group per knob, named in both languages', () => {
    renderBar();

    expect(screen.getAllByRole('group')).toHaveLength(2);
    expect(screen.getByRole('group', { name: /How many/ })).toBeTruthy();
    expect(screen.getByRole('group', { name: /எத்தனை/ })).toBeTruthy();
  });

  it('shows every option in both languages', () => {
    renderBar();

    expect(screen.getByText('two')).toBeTruthy();
    expect(screen.getByText('இரண்டு')).toBeTruthy();
  });

  it('presses the option the scene is currently set to', () => {
    renderBar();
    const [one, two] = chipsOf('How many');

    expect(one?.getAttribute('aria-pressed')).toBe('true');
    expect(two?.getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the option that was clicked', () => {
    const { onChange } = renderBar();
    const [, two] = chipsOf('How many');

    fireEvent.click(two as HTMLElement);

    expect(onChange).toHaveBeenCalledWith('count', '2');
  });

  it('is one tab stop per group, on the chosen option', () => {
    renderBar();
    const [one, two, three] = chipsOf('How many');

    expect(one?.getAttribute('tabindex')).toBe('0');
    expect(two?.getAttribute('tabindex')).toBe('-1');
    expect(three?.getAttribute('tabindex')).toBe('-1');
  });

  it('moves within a group with the arrow keys, and selecting follows', () => {
    const { onChange } = renderBar();
    const [one, two] = chipsOf('How many');

    (one as HTMLElement).focus();
    fireEvent.keyDown(one as HTMLElement, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(two);
    expect(onChange).toHaveBeenCalledWith('count', '2');
  });

  it('wraps around the ends rather than stopping at them', () => {
    const { onChange } = renderBar();
    const [one, , three] = chipsOf('How many');

    (one as HTMLElement).focus();
    fireEvent.keyDown(one as HTMLElement, { key: 'ArrowLeft' });

    expect(document.activeElement).toBe(three);
    expect(onChange).toHaveBeenCalledWith('count', '3');
  });

  it('takes the up and down keys too, because the chips wrap onto two rows', () => {
    const { onChange } = renderBar();
    const [one, two] = chipsOf('How many');

    (one as HTMLElement).focus();
    fireEvent.keyDown(one as HTMLElement, { key: 'ArrowDown' });

    expect(document.activeElement).toBe(two);
    expect(onChange).toHaveBeenCalledWith('count', '2');
  });

  it('stays inside its own group', () => {
    const { onChange } = renderBar();
    const [box, tree] = chipsOf('The place');

    (box as HTMLElement).focus();
    fireEvent.keyDown(box as HTMLElement, { key: 'ArrowRight' });

    expect(document.activeElement).toBe(tree);
    expect(onChange).toHaveBeenCalledWith('ground', 'tree');
  });

  it('disables an option that would draw nothing', () => {
    /* Nothing goes inside a tree. The learner is told before pressing it, not
       by a picture that fails to change. */
    renderBar();
    const [, tree] = chipsOf('The place');

    expect(tree?.hasAttribute('disabled')).toBe(true);
  });

  it('renders a knob with one option as a label, not as a button', () => {
    const single: Lesson = {
      ...LESSON,
      knobs: [
        {
          key: 'ground',
          label: bi('The place', 'இடம்'),
          options: [{ value: 'box', label: bi('box', 'பெட்டி') }],
        },
      ],
    };
    render(<KnobBar lesson={single} knobs={KNOBS} onChange={jest.fn()} />);

    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('பெட்டி')).toBeTruthy();
  });

  it('renders nothing at all for a lesson with no knobs', () => {
    const { container } = render(
      <KnobBar lesson={{ ...LESSON, knobs: [] }} knobs={{}} onChange={jest.fn()} />,
    );

    expect(container.innerHTML).toBe('');
  });

  describe('locked', () => {
    it('announces every option as disabled', () => {
      renderBar({ locked: true });

      for (const chip of chipsOf('How many')) {
        expect(chip.getAttribute('aria-disabled')).toBe('true');
      }
    });

    it('ignores a click and an arrow key', () => {
      const { onChange } = renderBar({ locked: true });
      const [one, two] = chipsOf('How many');

      fireEvent.click(two as HTMLElement);
      (one as HTMLElement).focus();
      fireEvent.keyDown(one as HTMLElement, { key: 'ArrowRight' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('leaves the options visible, so the learner can see what is coming', () => {
      renderBar({ locked: true });

      expect(screen.getByText('two')).toBeTruthy();
    });
  });
});
