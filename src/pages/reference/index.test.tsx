import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';

import ReferencePage from 'pages/reference/index';
import { useContentStore } from 'store/content.store';

/* ============================================================
   /reference — the source, browsable.

   Rendered from the same content the lessons are built from, so
   the two cannot drift. The part that matters most is the last
   section: where this app teaches something the notes got wrong,
   said out loud rather than quietly fixed in the row.
   ============================================================ */

const at = (path: string): ReturnType<typeof render> =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/reference" element={<ReferencePage />} />
        <Route path="/reference/:tableId" element={<ReferencePage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeAll(async () => {
  await useContentStore.getState().load();
});

describe('ReferencePage', () => {
  it('renders every table the notes contain', () => {
    const { container } = at('/reference');

    /* Sixteen from the source, and one this app writes about itself. */
    expect(container.querySelectorAll('section[id]').length).toBeGreaterThanOrEqual(17);
    expect(screen.getByRole('heading', { name: /Modal verbs/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Personal pronouns/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Main verbs/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Tense forms/ })).toBeTruthy();
  });

  it('says what this app itself can draw', () => {
    /* Built from the libraries that do the drawing, so it cannot claim a prop
       that was removed. */
    const { container } = at('/reference');
    const table = container.querySelector('#what-can-be-drawn');

    expect(table).toBeTruthy();
    expect(table?.textContent).toContain('apple');
    expect(table?.textContent).toContain('in front of');
  });

  it('marks the verbs it can draw, so the limit is visible', () => {
    const { container } = at('/reference');
    const verbs = container.querySelector('#main-verbs');

    expect(verbs?.textContent).toContain('In this app');
    expect(within(verbs as HTMLElement).getAllByText('Drawn').length).toBeGreaterThan(0);
  });

  it('lists every table down the side', () => {
    at('/reference');
    const nav = screen.getByRole('navigation', { name: 'Reference tables' });

    expect(within(nav).getAllByRole('link').length).toBeGreaterThanOrEqual(17);
  });

  it('marks the table a link was followed to', () => {
    const { container } = at('/reference/prep-place');

    expect(container.querySelector('#prep-place')?.className).toMatch(/linked/);
    expect(container.querySelector('#modals')?.className).not.toMatch(/linked/);
  });

  it('says so for an address that is no table, and shows the tables anyway', () => {
    /* A wrong link is no reason to hide the thing that was being looked for. */
    const { container } = at('/reference/not-a-table');

    expect(screen.getByText(/There is no table called/)).toBeTruthy();
    expect(container.querySelector('#modals')).toBeTruthy();
  });

  it('filters one table without touching the others', () => {
    const { container } = at('/reference');

    fireEvent.change(screen.getByLabelText('Search Modal verbs'), { target: { value: 'zzz' } });

    expect(within(container.querySelector('#modals') as HTMLElement).queryByRole('table')).toBeNull();
    expect(within(container.querySelector('#prep-place') as HTMLElement).getByRole('table')).toBeTruthy();
  });

  describe('the word-order diagram', () => {
    it('offers it on a row the notes gave a sentence for', () => {
      const { container } = at('/reference');
      const place = container.querySelector('#prep-place') as HTMLElement;

      expect(within(place).getAllByRole('button', { name: 'How it is built' }).length).toBeGreaterThan(0);
    });

    it('opens it under the row, and closes it again', () => {
      const { container } = at('/reference');
      const place = container.querySelector('#prep-place') as HTMLElement;
      const open = within(place).getAllByRole('button', { name: 'How it is built' })[0] as HTMLElement;

      fireEvent.click(open);
      expect(within(place).getAllByRole('img').length).toBeGreaterThan(0);
      expect(open.getAttribute('aria-expanded')).toBe('true');

      fireEvent.click(within(place).getByRole('button', { name: 'Hide' }));
      expect(within(place).queryAllByRole('img')).toHaveLength(0);
    });

    it('offers nothing on a table of verb forms, which hold no sentences', () => {
      const { container } = at('/reference');
      const verbs = container.querySelector('#main-verbs') as HTMLElement;

      expect(within(verbs).queryAllByRole('button', { name: 'How it is built' })).toHaveLength(0);
    });
  });

  describe('the corrections', () => {
    it('lists every place the app departs from the notes', () => {
      at('/reference');
      const section = screen.getByRole('region', { name: /Where these notes are wrong/ });

      expect(within(section).getAllByRole('listitem').length).toBeGreaterThanOrEqual(17);
    });

    it('says what the notes said and what the app teaches', () => {
      at('/reference');
      const section = screen.getByRole('region', { name: /Where these notes are wrong/ });

      expect(within(section).getAllByText('The notes say').length).toBeGreaterThan(0);
      expect(within(section).getAllByText('This app teaches').length).toBeGreaterThan(0);
    });

    it('names the tense-label mistake and the modal one', () => {
      /* The two the engine asks for by name. */
      at('/reference');
      const section = screen.getByRole('region', { name: /Where these notes are wrong/ });

      expect(within(section).getByText(/present perfect continuous/)).toBeTruthy();
      expect(within(section).getByText(/Reversed/)).toBeTruthy();
    });

    it('leaves the rows themselves as the notes wrote them', () => {
      /* The correction is recorded beside the table, never applied to it. */
      const { container } = at('/reference');

      expect(container.querySelector('#modals')?.textContent).toContain('may');
    });
  });
});
