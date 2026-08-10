import { render, screen } from '@testing-library/react';

import { Badge } from 'common/components/Badge/Badge';

describe('Badge', () => {
  it('renders its text', () => {
    render(<Badge>Drawable</Badge>);

    expect(screen.getByText('Drawable')).toBeTruthy();
  });

  it('carries the tone class', () => {
    render(<Badge tone="warn">Not yet drawable</Badge>);

    expect(screen.getByText('Not yet drawable').className).toContain('warn');
  });

  it('is neutral by default', () => {
    render(<Badge>Neutral</Badge>);
    const cls = screen.getByText('Neutral').className;

    expect(cls).toContain('badge');
    expect(cls).not.toContain('accent');
  });
});
