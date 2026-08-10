import { render, screen } from '@testing-library/react';

import { Breadcrumbs } from 'common/components/Breadcrumbs/Breadcrumbs';

const ITEMS = [
  { label: 'Topics', href: '/topics' },
  { label: 'Prepositions', href: '/topic/prepositions' },
  { label: 'Where it is' },
];

describe('Breadcrumbs', () => {
  it('is a labelled navigation landmark', () => {
    render(<Breadcrumbs items={ITEMS} />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
  });

  it('links every crumb but the last', () => {
    render(<Breadcrumbs items={ITEMS} />);

    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('Where it is').getAttribute('aria-current')).toBe('page');
  });

  it('does not link the last crumb even when it carries an href', () => {
    render(<Breadcrumbs items={[{ label: 'Topics', href: '/topics' }]} />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Topics').getAttribute('aria-current')).toBe('page');
  });

  it('hides the separators from assistive tech', () => {
    const { container } = render(<Breadcrumbs items={ITEMS} />);
    const separators = container.querySelectorAll('[aria-hidden="true"]');

    expect(separators).toHaveLength(ITEMS.length - 1);
  });
});
