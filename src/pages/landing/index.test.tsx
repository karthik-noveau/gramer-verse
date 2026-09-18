import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import LandingPage from 'pages/landing/index';

/* ============================================================
   The front door.

   Two things it has to do that no other page does: carry its own
   chrome, and prove the product works before the visitor has
   agreed to open it. The sentence canvas is interactive, calm,
   and available before curriculum metadata finishes loading.
   ============================================================ */

const renderPage = (): ReturnType<typeof render> =>
  render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>,
  );

describe('LandingPage', () => {
  it('carries its own brand bar and footer', () => {
    /* No shell: the sidebar of ten topics beside it would be the app before
       the visitor has agreed to open the app. */
    renderPage();

    expect(screen.getByRole('banner')).toBeTruthy();
    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Footer' })).toBeTruthy();
  });

  it('says what the product is, in both languages', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('See how English');
    expect(screen.getByText('வாக்கிய அமைப்பும் தமிழ் விளக்கமும் ஒரே இடத்தில்.')).toBeTruthy();
  });

  it('offers one way in, and the bar offers the same one', () => {
    renderPage();
    const start = screen.getByRole('link', { name: 'Start learning' });
    const open = screen.getByRole('link', { name: 'Explore topics' });

    expect(start.getAttribute('href')).toBe('/topics');
    expect(open.getAttribute('href')).toBe('/topics');
  });

  it('lists no topics — that is the page Start goes to', () => {
    /* The eyebrow carries the count and Start carries the rest. Ten topic
       names here would be /topics rendered smaller on the page whose only job
       is to send you to /topics. */
    renderPage();

    const links = screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '');

    /* No link to any single topic. The visualizer lives under /topics/ too and
       is a footer link, not a topic. */
    expect(links.filter((href) => /^\/topics\/[a-z-]+$/.test(href))).toEqual([]);
  });

  describe('the demo', () => {
    it('shows the sentence as visible grammatical roles', () => {
      renderPage();

      expect(screen.getByText('Subject')).toBeTruthy();
      expect(screen.getByText('Verb')).toBeTruthy();
      expect(screen.getByText('Preposition')).toBeTruthy();
      expect(screen.getByText('Object')).toBeTruthy();
    });

    it('says the sentence under it, in both languages', () => {
      const { container } = renderPage();

      expect(screen.getByLabelText('The ball is in the box.')).toBeTruthy();
      expect(container.textContent).toContain('பெட்டியில்');
    });

    it('changes both languages when a word is pressed', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /behind/ }));

      expect(screen.getByLabelText('பந்து பெட்டிக்குப் பின்னால் உள்ளது.')).toBeTruthy();
      expect(screen.getByRole('button', { name: /behind/ }).getAttribute('aria-pressed')).toBe(
        'true',
      );
    });

    it('uses a table for the under example', () => {
      renderPage();

      fireEvent.click(screen.getByRole('button', { name: /under/ }));

      expect(screen.getByText('the table.')).toBeTruthy();
      expect(screen.getByLabelText('பந்து மேசைக்குக் கீழே உள்ளது.')).toBeTruthy();
    });
  });

  it('keeps catalog counts out of the brand promise', () => {
    renderPage();

    expect(screen.getByText(/English grammar/).textContent).toContain('தமிழ் வழியில்');
    expect(screen.queryByText(/topics · .* lessons/)).toBeNull();
  });

  it('explains a lesson in three lines, in both languages', () => {
    renderPage();

    expect(screen.getByText('யூகியுங்கள்')).toBeTruthy();
    expect(screen.getByText(/choose the word that fits/)).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });
});
