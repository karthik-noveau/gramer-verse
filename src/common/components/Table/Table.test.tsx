import { fireEvent, render, screen } from '@testing-library/react';

import { Table } from 'common/components/Table/Table';
import type { TableColumn } from 'common/components/Table/Table';

type Row = { readonly word: string; readonly ta: string };

const ROWS: readonly Row[] = [
  { word: 'on', ta: 'மீது' },
  { word: 'in', ta: 'உள்ளே' },
  { word: 'under', ta: 'கீழே' },
];

const COLUMNS: ReadonlyArray<TableColumn<Row>> = [
  { key: 'word', header: 'Word', cell: (r) => r.word, sortValue: (r) => r.word },
  { key: 'ta', header: 'Meaning', cell: (r) => <span lang="ta">{r.ta}</span> },
];

const renderTable = (): ReturnType<typeof render> =>
  render(<Table columns={COLUMNS} rows={ROWS} rowKey={(r) => r.word} caption="Prepositions" />);

const words = (): readonly string[] =>
  screen.getAllByRole('row').slice(1).map((row) => row.children[0]?.textContent ?? '');

describe('Table', () => {
  it('renders every row and column', () => {
    renderTable();

    expect(screen.getAllByRole('row')).toHaveLength(ROWS.length + 1);
    expect(screen.getByText('உள்ளே').getAttribute('lang')).toBe('ta');
  });

  it('marks a sortable column unsorted until it is used', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: /Word/ }).getAttribute('aria-sort')).toBe('none');
  });

  it('toggles aria-sort and the row order on each click', () => {
    renderTable();
    const header = screen.getByRole('columnheader', { name: /Word/ });
    const button = screen.getByRole('button', { name: /Word/ });

    fireEvent.click(button);
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(words()).toEqual(['in', 'on', 'under']);

    fireEvent.click(button);
    expect(header.getAttribute('aria-sort')).toBe('descending');
    expect(words()).toEqual(['under', 'on', 'in']);
  });

  it('leaves a column with no sort value alone', () => {
    renderTable();

    expect(screen.getByRole('columnheader', { name: 'Meaning' }).hasAttribute('aria-sort')).toBe(false);
  });

  it('keeps the source order until something is sorted', () => {
    renderTable();

    expect(words()).toEqual(['on', 'in', 'under']);
  });
});
