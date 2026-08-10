import { fireEvent, render, screen } from '@testing-library/react';

import { CannotDraw } from 'pages/visualizer/components/CannotDraw/CannotDraw';

/* "Cannot draw" is a state of this product, not an error in it. What is
   checked here is that it reads that way: the words named one at a time, the
   structural gap said separately, and never a dead end. */

const renderIt = (
  props: Partial<React.ComponentProps<typeof CannotDraw>> = {},
): ReturnType<typeof render> =>
  render(
    <CannotDraw unknown={['rocket']} gaps={[]} suggestion="the ball is on the table" {...props} />,
  );

describe('CannotDraw', () => {
  it('names every word nobody drew', () => {
    renderIt({ unknown: ['rocket', 'launchpad'] });

    expect(screen.getByText('rocket')).toBeTruthy();
    expect(screen.getByText('launchpad')).toBeTruthy();
  });

  it('says what the sentence left out, apart from the words', () => {
    renderIt({ unknown: ['rocket'], gaps: ['nowhere to put it'] });

    expect(screen.getByText(/Not in the drawing library/)).toBeTruthy();
    expect(screen.getByText(/also leaves nowhere to put it/)).toBeTruthy();
  });

  it('joins two gaps into one sentence', () => {
    renderIt({ unknown: [], gaps: ['nothing to place', 'nowhere to put it'] });

    expect(screen.getByText(/nothing to place and nowhere to put it/)).toBeTruthy();
  });

  it('says an action is an action', () => {
    renderIt({ unknown: [], verb: { word: 'eats', drawable: true } });

    expect(screen.getByText('eats')).toBeTruthy();
    expect(screen.getByText(/draws where things are/)).toBeTruthy();
  });

  it('says plainly when a verb has no picture at all', () => {
    /* Engine 14's decision, said to the learner in their own words. */
    renderIt({ unknown: [], verb: { word: 'remembers', drawable: false } });

    expect(screen.getByText(/happens inside somebody/)).toBeTruthy();
  });

  it('always offers something that works', () => {
    renderIt();

    expect(screen.getByText('the ball is on the table')).toBeTruthy();
  });

  it('types the suggestion in when it is taken', () => {
    const onTry = jest.fn();
    renderIt({ onTry });

    fireEvent.click(screen.getByRole('button', { name: 'Try it' }));

    expect(onTry).toHaveBeenCalledWith('the ball is on the table');
  });

  it('is not an error, and does not announce itself as one', () => {
    /* No alert role: nothing has gone wrong. */
    const { container } = renderIt();

    expect(screen.queryByRole('alert')).toBeNull();
    expect(container.textContent).not.toMatch(/error|failed|invalid/i);
  });

  it('says nothing about words when there were none', () => {
    renderIt({ unknown: [], gaps: ['nothing to place'] });

    expect(screen.queryByText(/Not in the drawing library/)).toBeNull();
  });
});
