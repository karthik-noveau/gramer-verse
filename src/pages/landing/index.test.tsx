import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import LandingPage from 'pages/landing/index';

/* ============================================================
   The front door.

   Two things it has to do that no other page does: carry its own
   chrome, and prove the product works before the visitor has
   agreed to open it. The hero stays focused and leaves the
   actual teaching interactions inside the app.
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

  it('lets visitors pause and resume the page animations', () => {
    const { container } = renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Pause animations' }));
    expect(container.firstElementChild?.getAttribute('data-motion-paused')).toBe('true');
    expect(screen.getByRole('heading', { level: 1 })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Resume animations' }));
    expect(container.firstElementChild?.getAttribute('data-motion-paused')).toBe('false');
  });

  it('keeps the decorative orbit out of the accessibility tree', () => {
    renderPage();
    expect(screen.getByText('Grammar, connected').closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it('arranges four illustrated topic cards around the central brand', () => {
    const { container } = renderPage();
    const orbit = container.querySelector('.orbit');
    expect(Array.from(orbit?.querySelectorAll('.orbitLabel') ?? [], (card) => card.textContent?.trim()))
      .toEqual(['Tenses', 'Verbs', 'Nouns', 'Sentences']);
    expect(orbit?.querySelectorAll('.orbitIcon')).toHaveLength(4);
    expect(orbit?.querySelector('a, button, [tabindex]')).toBeNull();
    expect(orbit?.querySelector('.orbitCore small')?.textContent).toBe('Grammar, connected');
  });

  it('provides normalized circular paths for the mount drawing animation', () => {
    const { container } = renderPage();
    const paths = container.querySelector('.orbitPaths');
    expect(paths?.getAttribute('focusable')).toBe('false');
    expect(paths?.querySelectorAll('circle[pathLength="1"]')).toHaveLength(2);
    expect(container.querySelectorAll('.orbitPulse')).toHaveLength(1);
  });

  it('combines a decorative wave background with a box pattern', () => {
    const { container } = renderPage();
    const backdrop = container.querySelector('.heroBackdrop');
    expect(backdrop?.getAttribute('aria-hidden')).toBe('true');
    expect(backdrop?.querySelectorAll('.waveLayer')).toHaveLength(2);
    expect(backdrop?.querySelectorAll('.boxPattern')).toHaveLength(1);
    expect(backdrop?.querySelectorAll('.waveStage .waveParallax')).toHaveLength(1);
    expect(backdrop?.querySelector('.waveTrace')?.getAttribute('pathLength')).toBe('1');
    expect(backdrop?.querySelector('a, button, [tabindex]')).toBeNull();
    expect(container.querySelector('.orbitBackdrop')).toBeNull();
    expect(container.querySelectorAll('.orbitRing')).toHaveLength(1);
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

  it('keeps catalog counts out of the brand promise', () => {
    renderPage();

    expect(screen.getByText(/English grammar/).textContent).toContain('தமிழ் வழியில்');
    expect(screen.queryByText(/topics · .* lessons/)).toBeNull();
  });

  it('previews the curriculum without turning the hero into a topic grid', () => {
    renderPage();

    const preview = screen.getByRole('list', { name: 'Curriculum preview' });
    expect(within(preview).getAllByRole('listitem')).toHaveLength(5);
    expect(within(preview).getByText('வாக்கிய அமைப்பு')).toBeTruthy();
  });

  it('explains a lesson in three lines, in both languages', () => {
    renderPage();

    expect(screen.getByText('யூகியுங்கள்')).toBeTruthy();
    expect(screen.getByText(/choose the word that fits/)).toBeTruthy();
    const steps = screen.getByRole('list', { name: 'How learning works' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(3);
  });
});
