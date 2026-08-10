import { render, screen } from '@testing-library/react';

import { Icon, ICON_NAMES } from 'common/components/Icon/Icon';

describe('Icon', () => {
  it('renders every name in the set', () => {
    const { container } = render(
      <div>
        {ICON_NAMES.map((name) => (
          <Icon key={name} name={name} />
        ))}
      </div>,
    );

    expect(container.querySelectorAll('[data-icon]')).toHaveLength(ICON_NAMES.length);
  });

  it('is hidden from assistive tech unless it carries the meaning itself', () => {
    const { container } = render(<Icon name="menu" />);

    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });

  it('becomes an image with a name when labelled', () => {
    render(<Icon name="check" label="Drawable" />);

    expect(screen.getByRole('img', { name: 'Drawable' })).toBeTruthy();
  });
});
