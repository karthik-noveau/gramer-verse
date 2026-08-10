import { Fragment, useMemo, useState } from 'react';
import type { JSX, ReactNode } from 'react';

import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

export type SortDirection = 'ascending' | 'descending';

export type TableColumn<Row> = {
  readonly key: string;
  readonly header: ReactNode;
  readonly cell: (row: Row) => ReactNode;
  /** How many rows this cell covers, for a column whose value repeats down the
   *  table. `0` means the cell is inside a run that started above and is not
   *  printed at all. Anything else is a plain cell. */
  readonly rowSpan?: (row: Row, index: number) => number;
  /** Sortable columns need a comparable value; the cell may be any markup. */
  readonly sortValue?: (row: Row) => string | number;
  readonly className?: string;
};

export type TableProps<Row> = {
  readonly columns: ReadonlyArray<TableColumn<Row>>;
  readonly rows: readonly Row[];
  readonly rowKey: (row: Row, index: number) => string;
  /** Named for a screen reader; shown above the table. */
  readonly caption?: string;
  /** Keep the caption as the table's accessible name and take it off the page.
   *  For a caller that prints its own heading — a second copy of the same
   *  words above the table is the page saying it twice. */
  readonly captionHidden?: boolean;
  readonly initialSort?: { readonly key: string; readonly direction: SortDirection };
  /** A panel opened under a row, spanning the whole width. Returning nothing
   *  leaves the row as it was — which is what every row does until one is
   *  opened. */
  readonly afterRow?: (row: Row, index: number) => ReactNode;
  readonly className?: string;
};

const compare = (a: string | number, b: string | number): number => {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

/**
 * Sortable headers, a sticky head, and a wrapper that takes the horizontal
 * scroll so the page never does.
 *
 * Sorting is derived from the row order rather than stored: a sorted copy in
 * state would go stale the moment the rows prop changed.
 */
export function Table<Row>({
  columns,
  rows,
  rowKey,
  caption,
  captionHidden = false,
  initialSort,
  afterRow,
  className,
}: TableProps<Row>): JSX.Element {
  const [sort, setSort] = useState<{ key: string; direction: SortDirection } | null>(
    initialSort ?? null,
  );

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const column = columns.find((c) => c.key === sort.key);
    const value = column?.sortValue;
    if (!value) return rows;

    const factor = sort.direction === 'ascending' ? 1 : -1;
    return [...rows].sort((a, b) => compare(value(a), value(b)) * factor);
  }, [rows, columns, sort]);

  const toggle = (key: string): void => {
    setSort((current) =>
      current && current.key === key
        ? { key, direction: current.direction === 'ascending' ? 'descending' : 'ascending' }
        : { key, direction: 'ascending' },
    );
  };

  return (
    <div className={classNames(styles.wrap, className)}>
      <table className={styles.table}>
        {caption ? (
          <caption className={captionHidden ? 'sr-only' : styles.caption}>{caption}</caption>
        ) : null}
        <thead>
          <tr>
            {columns.map((column) => {
              const sortable = column.sortValue !== undefined;
              const active = sort?.key === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  className={classNames(sortable && styles.sortable, column.className)}
                  aria-sort={sortable ? (active ? sort.direction : 'none') : undefined}
                >
                  {sortable ? (
                    <button
                      type="button"
                      className={styles.sortButton}
                      onClick={() => toggle(column.key)}
                    >
                      {column.header}
                      <span className={styles.arrow} aria-hidden="true" />
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => {
            const panel = afterRow?.(row, index);

            return (
              <Fragment key={rowKey(row, index)}>
                <tr>
              {columns.map((column) => {
                const span = column.rowSpan?.(row, index) ?? 1;
                /* Covered by the cell above: not rendered at all, which is
                   what `rowSpan` means for the rows under the first one. */
                if (span === 0) return null;

                return (
                  <td
                    key={column.key}
                    className={column.className}
                    {...(span > 1 ? { rowSpan: span } : {})}
                  >
                    {column.cell(row)}
                  </td>
                );
              })}
                </tr>
                {panel ? (
                  <tr>
                    <td colSpan={columns.length}>{panel}</td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
