import { useMemo, useState } from 'react';
import type { JSX } from 'react';

import { SourceTable } from 'common/components/SourceTable/SourceTable';
import type { FormationSpec, SourceTable as SourceTableData } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   ReferenceTable — one source table, with a way to search it.

   The table itself is the shared `SourceTable`, the same one the
   topic page renders, so a fix to how the notes are printed
   lands in both. What is added here belongs to this page: a
   filter, and the mark that says this is the table you followed
   a link to.
   ============================================================ */

export type ReferenceTableProps = {
  readonly table: SourceTableData;
  /** Followed a link straight to this one. */
  readonly linked?: boolean;
  /** A last column saying what this app can do with each row. */
  readonly annotate?:
    | { readonly header: string; readonly of: (row: readonly string[]) => string | null }
    | undefined;
  /** The word-order diagram for a row, where the notes gave a sentence in both
   *  languages to align. */
  readonly formationOf?:
    | ((row: readonly string[], index: number) => FormationSpec | undefined)
    | undefined;
};

/** Every cell of the row, flattened, so a search matches the Tamil as readily
 *  as the English — they are in the same cell. */
const haystack = (row: readonly string[]): string => row.join(' ').toLowerCase();

export function ReferenceTable({
  table,
  linked = false,
  annotate,
  formationOf,
}: ReferenceTableProps): JSX.Element {
  const [query, setQuery] = useState('');

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle === '') return table.rows;
    return table.rows.filter((row) => haystack(row).includes(needle));
  }, [query, table]);

  const inputId = `filter-${table.id}`;

  return (
    <section
      className={classNames(styles.wrap, linked && styles.linked)}
      id={table.id}
      aria-labelledby={`${table.id}-title`}
    >
      <div className={styles.head}>
        <h2 className={styles.title} id={`${table.id}-title`}>
          <span lang="en">{String(table.title.en)}</span>
          <span className={styles.ta} lang="ta">
            {String(table.title.ta)}
          </span>
        </h2>

        <span className={styles.filter}>
          <label className="sr-only" htmlFor={inputId}>
            Search {String(table.title.en)}
          </label>
          <input
            className={styles.input}
            id={inputId}
            type="search"
            value={query}
            placeholder="Search this table"
            autoComplete="off"
            onChange={(event) => setQuery(event.target.value)}
          />
        </span>
      </div>

      {rows.length > 0 ? (
        <SourceTable
          table={table}
          heading={false}
          rows={rows}
          annotate={annotate}
          formationOf={formationOf}
        />
      ) : (
        /* Inside the table, where the search box is. A blank area under a
           filter reads as a page that broke rather than as a search that
           found nothing. */
        <p className={styles.none}>
          Nothing in this table matches “{query}”.
          <span className={styles.ta} lang="ta">
            {' '}
            பொருந்தும் வரிசை இல்லை.
          </span>
        </p>
      )}
    </section>
  );
}
