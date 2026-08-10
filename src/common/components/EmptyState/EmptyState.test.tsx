import { render, screen } from '@testing-library/react';

import { Button } from 'common/components/Button/Button';
import { EmptyState } from 'common/components/EmptyState/EmptyState';

describe('EmptyState', () => {
  it('renders the message as a heading', () => {
    render(<EmptyState title="No lessons here yet" />);

    expect(screen.getByRole('heading', { name: 'No lessons here yet' })).toBeTruthy();
  });

  it('renders the body and the Tamil, tagged', () => {
    render(
      <EmptyState
        title="No lessons here yet"
        body="This topic is written but has no lessons authored against it."
        ta="இந்தத் தலைப்பில் பாடங்கள் இல்லை."
      />,
    );

    expect(screen.getByText(/no lessons authored/i)).toBeTruthy();
    expect(screen.getByText('இந்தத் தலைப்பில் பாடங்கள் இல்லை.').getAttribute('lang')).toBe('ta');
  });

  it('offers a way out when given one', () => {
    render(<EmptyState title="Nothing here" action={<Button href="/topics">Back to topics</Button>} />);

    expect(screen.getByRole('link', { name: 'Back to topics' })).toBeTruthy();
  });

  it('hides its icon from assistive tech', () => {
    const { container } = render(<EmptyState title="Nothing here" />);

    expect(container.querySelector('[data-icon]')?.getAttribute('aria-hidden')).toBe('true');
  });
});
