import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { Button } from 'common/components/Button/Button';

describe('Button', () => {
  it('renders a button that does not submit by default', () => {
    render(<Button>Primary</Button>);

    expect(screen.getByRole('button', { name: 'Primary' }).getAttribute('type')).toBe('button');
  });

  it('applies the variant and size classes', () => {
    render(
      <Button variant="primary" size="lg">
        Large
      </Button>,
    );
    const cls = screen.getByRole('button').className;

    expect(cls).toContain('primary');
    expect(cls).toContain('lg');
  });

  it('respects disabled', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );
    const button = screen.getByRole('button');
    button.click();

    expect((button as HTMLButtonElement).disabled).toBe(true);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders a plain anchor for an address outside the app', () => {
    render(<Button href="https://example.org/notes">The source notes</Button>);

    expect(screen.getByRole('link', { name: 'The source notes' }).getAttribute('href')).toBe(
      'https://example.org/notes',
    );
  });

  it('renders a router link for an address inside it, so the app is not reloaded', () => {
    render(
      <MemoryRouter>
        <Button to="/topics">Back to topics</Button>
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Back to topics' }).getAttribute('href')).toBe('/topics');
  });

  it('carries its label when it is icon-only', () => {
    render(<Button iconOnly aria-label="Open the menu" />);

    expect(screen.getByRole('button', { name: 'Open the menu' }).className).toContain('icon');
  });
});
