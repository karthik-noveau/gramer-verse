import { render, screen } from '@testing-library/react';

import { BrandLockup, BrandMark } from 'common/components/BrandMark/BrandMark';

describe('BrandMark', () => {
  it('is decorative on its own — the name beside it carries the meaning', () => {
    const { container } = render(<BrandMark />);

    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('takes the size it is given', () => {
    const { container } = render(<BrandMark size={40} />);

    expect(container.querySelector('svg')?.getAttribute('width')).toBe('40');
  });
});

describe('BrandLockup', () => {
  it('keeps the brand name concise and leaves translations to the content', () => {
    render(<BrandLockup />);

    expect(screen.getByText(/Grammer-/)).toBeTruthy();
    expect(screen.queryByText('கிராமர்-வெர்ஸ்')).toBeNull();
  });
});
