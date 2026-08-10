import { fireEvent, render, screen, within } from '@testing-library/react';

import { normalise, SourceTable } from 'common/components/SourceTable/SourceTable';
import type { FormationSpec, SourceTable as SourceTableData, TopicId } from 'common/scene/types';

const topic = (id: string): TopicId => id as TopicId;

/** The titles are branded non-empty strings in the content types; in a fixture
 *  they are just strings. */
const bilingual = (en: string, ta: string): SourceTableData['title'] =>
  ({ en, ta }) as unknown as SourceTableData['title'];

/* The prepositions table as the source actually writes it: the leading label
   is dropped on every continuation row. */
const PREP: SourceTableData = {
  id: 'prep-common',
  topicId: topic('prepositions'),
  title: bilingual('Common prepositions', 'இடமும் காலமும்'),
  columns: ['Preposition', '', 'Tamil Meaning', 'English Example', 'Tamil Example'],
  rows: [
    ['in', 'Place', 'இல்', 'The ball is in the box', 'பந்து பெட்டியில் உள்ளது.'],
    ['Time', 'இல்', 'I was born in 2000', 'நான் 2000 ஆம் ஆண்டில் பிறந்தேன்.'],
    ['at', 'Place', 'இல்', 'She is at school', 'அவள் பள்ளியில் இருக்கிறாள்.'],
  ],
};

/* Two sections, so the group headings are there to be miscounted. */
const TENSES: SourceTableData = {
  id: 'tense-forms',
  topicId: topic('tenses'),
  title: bilingual('Tense forms', 'கால வடிவங்கள்'),
  columns: ['Tense', 'Auxiliary verb', 'Usage example', 'Tamil Example'],
  rows: [
    ['PRESENT TENSE', '', '', ''],
    ['Simple present', 'am, is, are', 'I am a writer', 'நான் ஒரு எழுத்தாளன்.'],
    ['Present continuous', 'am being', 'I am writing now', 'நான் இப்போது எழுதுகிறேன்.'],
    ['PAST TENSE', '', '', ''],
    ['Simple past', 'was, were', 'I was a writer', 'நான் ஒரு எழுத்தாளன் இருந்தேன்'],
  ],
};

const spec = (en: string): FormationSpec => ({
  en,
  ta: 'பந்து பெட்டியில் உள்ளது',
  enTokens: [
    { text: 'The', roles: [] },
    { text: 'ball', roles: ['figure'] },
    { text: 'in', roles: ['rel'] },
  ],
  taTokens: [
    { text: 'பந்து', roles: ['figure'] },
    { text: 'பெட்டியில்', roles: ['rel'] },
  ],
});

describe('short rows', () => {
  /* The source omits a leading label when it would repeat the row above.
     Padding at the end slides every value one column left, so "Time" appears
     under "Preposition" and the row reads as a different preposition. */
  it('aligns a short row to the right and carries the label down', () => {
    const out = normalise(PREP.rows, 5);

    expect(out[0]).toEqual(['in', 'Place', 'இல்', 'The ball is in the box', 'பந்து பெட்டியில் உள்ளது.']);
    expect(out[1]).toEqual(['in', 'Time', 'இல்', 'I was born in 2000', 'நான் 2000 ஆம் ஆண்டில் பிறந்தேன்.']);
  });

  it('leaves a full row and a heading row alone', () => {
    const out = normalise(TENSES.rows, 4);

    expect(out[0]).toEqual(['PRESENT TENSE', '', '', '']);
    expect(out[1]).toEqual(['Simple present', 'am, is, are', 'I am a writer', 'நான் ஒரு எழுத்தாளன்.']);
  });

  it('puts the continuation row under the right heading, not the first column', () => {
    render(<SourceTable table={PREP} />);
    const cells = screen.getAllByRole('row')[2]?.querySelectorAll('td') ?? [];

    /* The first cell is covered by the "in" above it, so this row starts at
       the sub-kind column. */
    expect(cells[0]?.textContent).toBe('Time');
  });
});

describe('the Visualization column', () => {
  it('draws the word of a row in a topic whose rows are words', () => {
    render(<SourceTable table={PREP} />);

    expect(screen.getByRole('columnheader', { name: 'Visualization' })).toBeTruthy();
    expect(screen.getAllByRole('img', { name: 'in' }).length).toBeGreaterThan(0);
  });

  /* A table with nothing to put in the column gets no column: a heading over
     four empty cells names nothing. */
  it('is left off a table with no drawings and no alignments', () => {
    render(<SourceTable table={TENSES} />);

    expect(screen.queryByRole('columnheader', { name: 'Visualization' })).toBeNull();
  });

  /* Elsewhere the row is a form or a tense name, and a picture beside it is
     decoration — or worse, wrong. */
  it('draws no picture for a topic that is not one of the three', () => {
    render(<SourceTable table={TENSES} formationOf={() => spec('I am a writer')} />);

    /* One per section — the source splits this table into present and past. */
    expect(screen.getAllByRole('columnheader', { name: 'Visualization' })).toHaveLength(2);
    expect(screen.queryAllByRole('img')).toEqual([]);
  });
});

describe('the formation', () => {
  /* The alignments are keyed by position among the rows that are rows. Handing
     the raw array index instead drew a different row's sentence under every
     row of the two tables that have group headings. */
  it('counts only the rows that are rows', () => {
    const seen: { row: string; index: number }[] = [];

    render(
      <SourceTable
        table={TENSES}
        formationOf={(row, index) => {
          seen.push({ row: String(row[0]), index });
          return undefined;
        }}
      />,
    );

    expect(seen.find((s) => s.row === 'Simple present')?.index).toBe(0);
    expect(seen.find((s) => s.row === 'Present continuous')?.index).toBe(1);
    /* Not 4 — the two headings above it are not sentences. */
    expect(seen.find((s) => s.row === 'Simple past')?.index).toBe(2);
  });

  it('opens the diagram under the row it explains, and closes it again', () => {
    render(<SourceTable table={PREP} formationOf={(row) => spec(String(row[3]))} />);

    const button = screen.getAllByRole('button', { name: /formation/ })[0];
    if (!button) throw new Error('no formation button');

    expect(button.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  /* A row without one is not offered the button: an empty frame is worse than
     no frame. */
  it('offers no button for a row nobody aligned', () => {
    render(
      <SourceTable table={PREP} formationOf={(row) => (row[0] === 'in' ? spec('x') : undefined)} />,
    );

    expect(screen.getAllByRole('button', { name: /formation/ })).toHaveLength(2);
  });

  it('keeps the merged label beside its own panel', () => {
    render(<SourceTable table={PREP} formationOf={(row) => spec(String(row[3]))} />);

    const button = screen.getAllByRole('button', { name: /formation/ })[0];
    if (!button) throw new Error('no formation button');
    fireEvent.click(button);

    /* The "in" cell grew to take the panel in, so the row under the panel
       still starts at the sub-kind column rather than sliding left. */
    const rows = screen.getAllByRole('row');
    const timeRow = rows.find((row) => within(row).queryByText('Time'));

    expect(timeRow?.querySelectorAll('td')[0]?.textContent).toBe('Time');
  });
});
