import type { JSX } from 'react';

import { Table } from 'common/components/Table/Table';
import type { SourceTable as SourceTableData } from 'common/scene/types';
import { classNames } from 'common/utils/classNames';

import styles from './styles.module.css';

/* ============================================================
   SourceTable — one table from the notes, as it was written.

   The same component the topic page and the lesson notes both
   use, so a fix lands in both. Nothing here corrects anything:
   where the notes are wrong the app says so rather than quietly
   rewriting the row.

   Two things about the source's shape are handled here. A cell
   may carry two lines — the English and its Tamil — and a row
   may be a heading rather than a row, which is how the notes
   divide a long table into sections.
   ============================================================ */

export type SourceTableProps = {
  readonly table: SourceTableData;
  /** Off for a caller that prints its own heading above the table. */
  readonly heading?: boolean;
  /** Show only these rows. Passing nothing shows everything. */
  readonly rows?: readonly (readonly string[])[] | undefined;
  /** A last column saying what this app does with the row — which verbs it can
   *  draw, for one. Null for a row there is nothing to say about. */
  readonly annotate?: { readonly header: string; readonly of: (row: readonly string[]) => string | null } | undefined;
  readonly className?: string | undefined;
};

/** Tagged by script, not by position: Tamil appears both as its own column and
 *  as a second line inside an English cell. Either way it needs `lang="ta"` or
 *  it loses the Tamil font stack and is announced as English. */
const TAMIL = /[஀-௿]/;

/** A row the notes used as a heading — "PRESENT TENSE" — rather than as data.
 *  Every cell but the first is empty, which is how it is told apart. */
const isHeading = (row: readonly string[]): boolean =>
  row.length > 0 && row[0]?.trim() !== '' && row.slice(1).every((cell) => cell.trim() === '');

type Section = { readonly title: string | null; readonly rows: readonly (readonly string[])[] };

/** The rows, split where the notes put a heading. A table with no headings
 *  comes back as one nameless section, which renders as itself. */
export function sectionsOf(rows: readonly (readonly string[])[]): readonly Section[] {
  const sections: Section[] = [];
  let current: { title: string | null; rows: (readonly string[])[] } = { title: null, rows: [] };

  for (const row of rows) {
    if (isHeading(row)) {
      if (current.rows.length > 0) sections.push(current);
      current = { title: titleCase(row[0] ?? ''), rows: [] };
      continue;
    }
    current.rows.push(row);
  }
  if (current.rows.length > 0) sections.push(current);

  return sections;
}

/**
 * How many rows from here repeat the same first cell.
 *
 * The source writes `Third Person` on each of its four pronoun rows, and
 * printed on every one it reads as four kinds of third person. Adjacent runs
 * only, first column only, and never an empty value — some rows drop that cell
 * and would otherwise merge into one tall blank.
 */
export function runOf(rows: readonly (readonly string[])[], index: number): number {
  const value = rows[index]?.[0]?.trim() ?? '';
  if (value === '') return 1;

  let length = 1;
  while (rows[index + length]?.[0]?.trim() === value) length += 1;
  return length;
}

/** Whether this row is inside a run that started above it, and so has no first
 *  cell of its own to print. */
const covered = (rows: readonly (readonly string[])[], index: number): boolean => {
  const value = rows[index]?.[0]?.trim() ?? '';
  return value !== '' && rows[index - 1]?.[0]?.trim() === value;
};

/** The notes shout their headings. A table of contents in capitals reads as
 *  emphasis nobody asked for. */
const titleCase = (value: string): string =>
  value
    .toLowerCase()
    .replace(/(^|\s)(\S)/g, (_, space: string, letter: string) => space + letter.toUpperCase());

/** One cell, which may be one line or two. The second line is the gloss, and
 *  it is set smaller under the first rather than beside it. */
function Cell({ value }: { readonly value: string }): JSX.Element | null {
  const lines = value.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) return null;

  return (
    <>
      {lines.map((line, index) => (
        <span
          key={`${line}-${index}`}
          className={classNames(index > 0 && styles.gloss)}
          {...(TAMIL.test(line) ? { lang: 'ta' } : {})}
        >
          {line}
        </span>
      ))}
    </>
  );
}

export function SourceTable({
  table,
  heading = true,
  rows,
  annotate,
  className,
}: SourceTableProps): JSX.Element {
  const sections = sectionsOf(rows ?? table.rows);

  return (
    <section className={classNames(styles.wrap, className)} id={table.id}>
      {heading ? (
        <div className={styles.head}>
          <h3 className={styles.title}>
            <span lang="en">{String(table.title.en)}</span>
            <span className={styles.ta} lang="ta">
              {String(table.title.ta)}
            </span>
          </h3>
          <span className={styles.count}>
            {(rows ?? table.rows).length} {(rows ?? table.rows).length === 1 ? 'row' : 'rows'}
          </span>
        </div>
      ) : null}

      {sections.map((section, index) => (
        <div className={styles.section} key={section.title ?? index}>
          {section.title ? <h4 className={styles.sectionTitle}>{section.title}</h4> : null}
          <Table
            caption={`${String(table.title.en)}${section.title ? ` · ${section.title}` : ''}`}
            /* The caller printed the heading; a second copy over the table is
               the page saying the same words twice. */
            captionHidden={!heading}
            columns={[
              ...table.columns.map((column, c) => ({
                key: String(c),
                header: column,
                /* Rendered as the source wrote it: a cell that carries an
                   English line and a Tamil one is one cell, not two columns. */
                cell: (row: readonly string[]) => <Cell value={row[c] ?? ''} />,
                ...(c === 0
                  ? {
                      /* A run of the same value becomes one cell spanning the
                         rows it covers. */
                      rowSpan: (_row: readonly string[], index_: number) =>
                        covered(section.rows, index_) ? 0 : runOf(section.rows, index_),
                    }
                  : {}),
              })),
              ...(annotate
                ? [
                    {
                      key: 'annotation',
                      header: annotate.header,
                      cell: (row: readonly string[]) => (
                        <span className={styles.note}>{annotate.of(row)}</span>
                      ),
                    },
                  ]
                : []),
            ]}
            rows={section.rows}
            rowKey={(row, index_) => `${index}-${index_}-${row[0] ?? ''}`}
          />
        </div>
      ))}
    </section>
  );
}
