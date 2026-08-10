import { fireEvent, render, screen } from '@testing-library/react';

import { Tabs } from 'common/components/Tabs/Tabs';

const ITEMS = [
  { id: 'place', label: 'Place', panel: 'Thirteen place prepositions.' },
  { id: 'dir', label: 'Direction', panel: 'Eight direction prepositions.' },
  { id: 'time', label: 'Time', panel: 'Nine time prepositions.' },
];

const renderTabs = (): ReturnType<typeof render> =>
  render(<Tabs items={ITEMS} label="Preposition groups" />);

describe('Tabs', () => {
  it('selects the first tab and shows only its panel', () => {
    renderTabs();

    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Place');
    expect(screen.getByText('Thirteen place prepositions.').hasAttribute('hidden')).toBe(false);
    expect(screen.getByText('Nine time prepositions.').hasAttribute('hidden')).toBe(true);
  });

  it('keeps only the selected tab in the Tab order', () => {
    renderTabs();
    const [place, direction] = screen.getAllByRole('tab');

    expect(place?.getAttribute('tabindex')).toBe('0');
    expect(direction?.getAttribute('tabindex')).toBe('-1');
  });

  it('moves selection with the arrow keys', () => {
    renderTabs();
    const list = screen.getByRole('tablist');

    fireEvent.keyDown(list, { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Direction');

    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Place');
  });

  it('wraps around, and Home and End jump to the ends', () => {
    renderTabs();
    const list = screen.getByRole('tablist');

    fireEvent.keyDown(list, { key: 'ArrowLeft' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Time');

    fireEvent.keyDown(list, { key: 'Home' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Place');

    fireEvent.keyDown(list, { key: 'End' });
    expect(screen.getByRole('tab', { selected: true }).textContent).toBe('Time');
  });

  it('selects on click and swaps the visible panel', () => {
    renderTabs();
    fireEvent.click(screen.getByRole('tab', { name: 'Time' }));

    expect(screen.getByText('Nine time prepositions.').hasAttribute('hidden')).toBe(false);
    expect(screen.getByText('Thirteen place prepositions.').hasAttribute('hidden')).toBe(true);
  });

  it('points each panel at the tab that names it', () => {
    renderTabs();
    const tab = screen.getByRole('tab', { name: 'Place' });
    const panel = screen.getByText('Thirteen place prepositions.');

    expect(tab.getAttribute('aria-controls')).toBe(panel.id);
    expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
  });
});
