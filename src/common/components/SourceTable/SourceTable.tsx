import { useState } from 'react';
import type { JSX } from 'react';

import { Art, hasArt } from 'common/art/Art';
import { Formation } from 'common/components/Formation/Formation';
import { Table } from 'common/components/Table/Table';
import type { FormationSpec, SourceTable as SourceTableData } from 'common/scene/types';
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
  /** The word-order diagram for a row, where one has been aligned. Called with
   *  the row's index among the rows that ARE rows — group headings are not
   *  sentences and are not counted, which is how the alignments are keyed. A
   *  row without one is not offered the button: an empty frame is worse than
   *  no frame. */
  readonly formationOf?:
    | ((row: readonly string[], contentIndex: number) => FormationSpec | undefined)
    | undefined;
  readonly className?: string | undefined;
};

/** Only three topics put a drawing in the Visualization column: the ones whose
 *  rows are single words a drawing can actually be of. Elsewhere the row is a
 *  form, a tense name or a verb in a sentence, and a picture beside it is
 *  decoration — or worse, wrong: "like" is a verb in the main-verbs table and
 *  a preposition in the art lookup, and a loose rule put the wrong drawing on
 *  the row.
 *
 *  Every other table fills the column with the formation button alone. */
const ART_TOPICS: ReadonlySet<string> = new Set(['nouns', 'articles', 'prepositions']);

/** A word's drawing belongs beside the word. The lookup walks the row's cells
 *  rather than assuming the first one holds the word: the pronouns table is
 *  ragged — some rows drop the "Persons" cell — so the pronoun is found by
 *  looking for it. Nothing when no cell in the row has a drawing, and the cell
 *  is then left empty; a letter tile in its place would be decoration
 *  pretending to be a picture. */
const artCell = (row: readonly string[]): string | null =>
  row.find((cell) => hasArt(cell)) ?? null;

/** Tagged by script, not by position: Tamil appears both as its own column and
 *  as a second line inside an English cell. Either way it needs `lang="ta"` or
 *  it loses the Tamil font stack and is announced as English. */
const TAMIL = /[஀-௿]/;

/** A row the notes used as a heading — "PRESENT TENSE" — rather than as data.
 *  Every cell but the first is empty, which is how it is told apart. */
const isHeading = (row: readonly string[]): boolean =>
  row.length > 0 && row[0]?.trim() !== '' && row.slice(1).every((cell) => cell.trim() === '');

/**
 * Short rows, aligned to the right.
 *
 * The source omits a leading label when it would repeat the row above: the
 * prepositions table writes "in / Place" then just "Time", and the pronouns
 * table writes "First Person / singular / I" then just "Plural / We".
 *
 * Those cells are missing from the FRONT of the row, not the back. Padding at
 * the end slides every value one column left, so "Time" appears under
 * "Preposition" and the "singular" under "Numbers" is really the subject
 * pronoun. The row has to be aligned right and the leading gaps filled from
 * the last row that had them.
 *
 * Carrying down is only correct if the source anchors a repeated label to the
 * FIRST row of its group. Where it does not, that is a content error and is
 * fixed in the content — the renderer cannot guess it.
 */
export function normalise(
  rows: readonly (readonly string[])[],
  width: number,
): readonly (readonly string[])[] {
  let carried: readonly string[] = [];

  return rows.map((row) => {
    if (isHeading(row)) return row;

    const gap = width - row.length;
    if (gap <= 0) {
      carried = row.slice(0, 1);
      return row;
    }

    const filled = [...Array.from({ length: gap }, (_, c) => carried[c] ?? ''), ...row];
    carried = filled.slice(0, Math.max(gap, 1) + 1);
    return filled;
  });
}

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

/** The button's arrow, after the label: right when the formation is closed,
 *  down when it is open. It sits at the end because that is where the eye
 *  leaves the button, and the panel it points to opens just below.
 *
 *  Drawn rather than typed — a ▸ renders as a dot at the button's 11px, and a
 *  reader cannot see which way a dot points. `currentColor` so it follows the
 *  label through the open state. */
function Caret({ open }: { readonly open: boolean }): JSX.Element {
  return (
    <span className={classNames(styles.caret, open && styles.caretOpen)} aria-hidden="true">
      <svg viewBox="0 0 10 14">
        <path
          d="M3 2 L8 7 L3 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function SourceTable({
  table,
  heading = true,
  rows,
  annotate,
  formationOf,
  className,
}: SourceTableProps): JSX.Element {
  /* Short rows are filled before anything else looks at them, so every later
     step — the runs, the pictures, the alignments — sees the same shape the
     source meant. */
  const all = normalise(rows ?? table.rows, table.columns.length);
  const sections = sectionsOf(all);

  /* Which row is open, by the text of its cells — an index would move under it
     the moment the table above is filtered. */
  const [open, setOpen] = useState<string | null>(null);

  /* The alignments are keyed by position among the rows that are rows. Group
     headings are not sentences and are not counted. */
  const contentIndex = new Map<readonly string[], number>();
  let counted = 0;
  for (const row of all) {
    if (!isHeading(row)) contentIndex.set(row, counted++);
  }

  const formationFor = (row: readonly string[]): FormationSpec | undefined =>
    formationOf?.(row, contentIndex.get(row) ?? -1);

  /* The column appears wherever there is something to put in it — a drawing, a
     formation button, or both. A table with neither gets no column: a heading
     over four empty cells names nothing. That is main-verbs and auxiliary,
     whose rows are verb forms rather than sentences, so there is nothing to
     draw and nothing to align. */
  const drawsArt = ART_TOPICS.has(String(table.topicId)) && all.some((row) => artCell(row) !== null);
  const drawsFormation = formationOf !== undefined && all.some((row) => formationFor(row));
  const showViz = drawsArt || drawsFormation;

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

      {sections.map((section, index) => {
        /* Which row of this section is open, and whether the merged cell above
           it reaches past it.

           A rowspan covers N *consecutive* rows from wherever it sits. Insert
           the panel inside that run and the cell keeps covering N rows — the
           new one included, the last one dropped. That is what pushed "Time"
           up into the Preposition column. So: if the group cell reaches past
           the opened row, grow it by one to take the panel in, and let the
           panel span the columns that are left. If the opened row is the last
           of its group, the panel falls outside and spans the table whole. */
        const openAt = section.rows.findIndex((row) => row.join('|') === open);
        const takenIntoRun =
          openAt >= 0 &&
          section.rows.some(
            (_row, i) =>
              !covered(section.rows, i) && i <= openAt && i + runOf(section.rows, i) - 1 > openAt,
          );

        return (
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
                         rows it covers, and one more when the opened panel
                         falls inside that run. */
                      rowSpan: (_row: readonly string[], index_: number) => {
                        if (covered(section.rows, index_)) return 0;
                        const span = runOf(section.rows, index_);
                        const reachesPast =
                          openAt >= 0 && index_ <= openAt && index_ + span - 1 > openAt;
                        return reachesPast ? span + 1 : span;
                      },
                    }
                  : {}),
              })),
              ...(showViz
                ? [
                    {
                      key: 'viz',
                      /* The picture and the formation button are one idea — the
                         row, shown rather than written — so they sit under one
                         heading instead of two blank cells. */
                      header: 'Visualization',
                      cell: (row: readonly string[]) => {
                        const word = drawsArt ? artCell(row) : null;
                        const spec = drawsFormation ? formationFor(row) : undefined;
                        const key = row.join('|');

                        return (
                          <span className={styles.viz}>
                            {word ? <Art word={word} size={40} /> : null}
                            {spec ? (
                              <button
                                type="button"
                                className={styles.open}
                                aria-expanded={open === key}
                                onClick={() => setOpen(open === key ? null : key)}
                              >
                                formation
                                <Caret open={open === key} />
                              </button>
                            ) : null}
                          </span>
                        );
                      },
                    },
                  ]
                : []),
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
            {...(drawsFormation
              ? {
                  /* The formation opens as a row of its own directly under the
                     row it explains, so the sentence and its picture stay
                     together instead of the picture appearing somewhere else
                     on screen. */
                  afterRow: (row: readonly string[]) => {
                    if (open !== row.join('|')) return null;
                    const spec = formationFor(row);
                    return spec ? <Formation spec={spec} /> : null;
                  },
                  /* One narrower, when the run above took it in. */
                  afterRowColSpan: () =>
                    table.columns.length +
                    (showViz ? 1 : 0) +
                    (annotate ? 1 : 0) -
                    (takenIntoRun ? 1 : 0),
                }
              : {})}
          />
        </div>
        );
      })}
    </section>
  );
}
