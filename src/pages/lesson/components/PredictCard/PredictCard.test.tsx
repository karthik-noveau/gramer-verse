import { fireEvent, render, screen } from '@testing-library/react';

import { PredictCard } from 'pages/lesson/components/PredictCard/PredictCard';
import type { NonEmptyString, Predict } from 'common/scene/types';

const bi = (en: string, ta: string): { en: NonEmptyString; ta: NonEmptyString } => ({
  en: en as NonEmptyString,
  ta: ta as NonEmptyString,
});

const PREDICT: Predict = {
  question: bi('Where does the ball sit?', 'பந்து எங்கே இருக்கும்?'),
  options: [
    { value: 'in', label: bi('inside the box', 'பெட்டிக்கு உள்ளே') },
    { value: 'on', label: bi('on top of the box', 'பெட்டியின் மேல்') },
  ],
  answer: 'in',
  explain: bi('The sides are around it.', 'பக்கங்கள் சுற்றி உள்ளன.'),
  knob: 'relation',
};

describe('PredictCard', () => {
  it('asks the question in both languages', () => {
    render(<PredictCard predict={PREDICT} onChoose={jest.fn()} />);

    expect(screen.getByText('Where does the ball sit?')).toBeTruthy();
    expect(screen.getByText('பந்து எங்கே இருக்கும்?')).toBeTruthy();
  });

  it('names itself by its question, so the card is findable', () => {
    render(<PredictCard predict={PREDICT} onChoose={jest.fn()} />);

    expect(screen.getByRole('region', { name: /Where does the ball sit/ })).toBeTruthy();
  });

  it('offers every option in both languages', () => {
    render(<PredictCard predict={PREDICT} onChoose={jest.fn()} />);

    expect(screen.getByText('on top of the box')).toBeTruthy();
    expect(screen.getByText('பெட்டியின் மேல்')).toBeTruthy();
  });

  it('reports what was chosen', () => {
    const onChoose = jest.fn();
    render(<PredictCard predict={PREDICT} onChoose={onChoose} />);

    fireEvent.click(screen.getByText('on top of the box'));

    expect(onChoose).toHaveBeenCalledWith('on');
  });

  it('says nothing about the answer before one is given', () => {
    render(<PredictCard predict={PREDICT} onChoose={jest.fn()} />);

    expect(screen.queryByText('The sides are around it.')).toBeNull();
  });

  describe('once answered', () => {
    it('explains, in both languages', () => {
      render(
        <PredictCard predict={PREDICT} onChoose={jest.fn()} answered chosen="in" correct />,
      );

      expect(screen.getByText('The sides are around it.')).toBeTruthy();
      expect(screen.getByText('பக்கங்கள் சுற்றி உள்ளன.')).toBeTruthy();
    });

    it('announces the explanation to a reader who is not looking at it', () => {
      const { container } = render(
        <PredictCard predict={PREDICT} onChoose={jest.fn()} answered chosen="in" correct />,
      );

      expect(container.querySelector('[aria-live="polite"]')?.textContent).toContain(
        'The sides are around it.',
      );
    });

    it('confirms a right answer without celebrating it', () => {
      /* There are no points in this product. */
      render(
        <PredictCard predict={PREDICT} onChoose={jest.fn()} answered chosen="in" correct />,
      );

      expect(screen.getByText(/that is where it goes/i)).toBeTruthy();
      expect(screen.queryByText(/\d+ points|streak|score/i)).toBeNull();
    });

    it('points a wrong answer at the picture rather than at the learner', () => {
      render(
        <PredictCard predict={PREDICT} onChoose={jest.fn()} answered chosen="on" />,
      );

      expect(screen.getByText(/Look at the picture/)).toBeTruthy();
    });

    it('takes no further answers', () => {
      const onChoose = jest.fn();
      render(
        <PredictCard predict={PREDICT} onChoose={onChoose} answered chosen="on" />,
      );

      fireEvent.click(screen.getByText('inside the box'));

      expect(onChoose).not.toHaveBeenCalled();
    });

    it('stays on the page, holding the question beside the reason', () => {
      render(
        <PredictCard predict={PREDICT} onChoose={jest.fn()} answered chosen="on" />,
      );

      expect(screen.getByText('Where does the ball sit?')).toBeTruthy();
    });
  });
});
