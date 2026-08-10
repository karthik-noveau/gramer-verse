import { fireEvent, render, screen, within } from '@testing-library/react';

import { ReferenceTable } from 'pages/reference/components/ReferenceTable/ReferenceTable';
import type { NonEmptyString, SourceTable, TopicId } from 'common/scene/types';

const TABLE: SourceTable = {
  id: 'modals',
  topicId: 'verbs' as TopicId,
  title: { en: 'Modal verbs' as NonEmptyString, ta: 'துணை வினை' as NonEmptyString },
  columns: ['Modal', 'Use', 'Example'],
  rows: [
    ['can\nமுடியும்', 'ability', 'I can swim.'],
    ['may', 'possibility', 'It may rain.'],
    ['must', 'necessity', 'You must go.'],
  ],
};

describe('ReferenceTable', () => {
  it('names the table in both languages', () => {
    render(<ReferenceTable table={TABLE} />);

    expect(screen.getByRole('heading', { name: /Modal verbs/ })).toBeTruthy();
    expect(screen.getByText('துணை வினை')).toBeTruthy();
  });

  it('keeps the table’s own name for a screen reader, and off the page', () => {
    /* A table needs an accessible name; a second copy of the heading above it
       is the page saying the same words twice. */
    const { container } = render(<ReferenceTable table={TABLE} />);

    expect(container.querySelector('caption')?.className).toContain('sr-only');
  });

  it('renders every row', () => {
    render(<ReferenceTable table={TABLE} />);

    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(4);
  });

  it('narrows the rows to what was searched for', () => {
    render(<ReferenceTable table={TABLE} />);

    fireEvent.change(screen.getByLabelText('Search Modal verbs'), { target: { value: 'rain' } });

    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
    expect(screen.getByText('It may rain.')).toBeTruthy();
  });

  it('searches the Tamil in a cell as readily as the English', () => {
    /* They are in the same cell, so a search of the row finds either. */
    render(<ReferenceTable table={TABLE} />);

    fireEvent.change(screen.getByLabelText('Search Modal verbs'), { target: { value: 'முடியும்' } });

    expect(screen.getByText('can')).toBeTruthy();
  });

  it('says so inside the table when nothing matches', () => {
    /* A blank area under a filter reads as a page that broke. */
    render(<ReferenceTable table={TABLE} />);

    fireEvent.change(screen.getByLabelText('Search Modal verbs'), { target: { value: 'zzz' } });

    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByText(/Nothing in this table matches/)).toBeTruthy();
  });

  it('adds a column when there is something to say about each row', () => {
    render(
      <ReferenceTable
        table={TABLE}
        annotate={{ header: 'In this app', of: (row) => (row[0] === 'may' ? 'Drawn' : null) }}
      />,
    );

    expect(screen.getByText('In this app')).toBeTruthy();
    expect(screen.getByText('Drawn')).toBeTruthy();
  });

  it('is addressable, so a link can reach it', () => {
    const { container } = render(<ReferenceTable table={TABLE} />);

    expect(container.querySelector('#modals')).toBeTruthy();
  });
});
