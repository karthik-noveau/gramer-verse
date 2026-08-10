import { render, screen } from '@testing-library/react';

import { Card, CardNote } from 'common/components/Card/Card';

describe('Card', () => {
  it('renders a plain container by default', () => {
    render(
      <Card>
        <h3>Default</h3>
      </Card>,
    );

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByRole('heading', { level: 3 })).toBeTruthy();
  });

  it('becomes a link when given an href, so it is keyboard reachable', () => {
    render(<Card href="/topic/prepositions">Prepositions</Card>);
    const link = screen.getByRole('link', { name: 'Prepositions' });

    expect(link.getAttribute('href')).toBe('/topic/prepositions');
    expect(link.className).toContain('interactive');
  });

  it('applies the muted variant', () => {
    render(<Card variant="muted">Aside</Card>);

    expect(screen.getByText('Aside').className).toContain('muted');
  });

  it('renders a note', () => {
    render(<CardNote>Static container.</CardNote>);

    expect(screen.getByText('Static container.').className).toContain('note');
  });
});
