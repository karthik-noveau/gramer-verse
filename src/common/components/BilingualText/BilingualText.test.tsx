import { render, screen } from '@testing-library/react';

import { BilingualText } from 'common/components/BilingualText/BilingualText';

describe('BilingualText', () => {
  it('renders both languages with their lang attributes', () => {
    render(<BilingualText en="Prepositions of place" ta="இட இடைச்சொற்கள்" />);

    expect(screen.getByText('Prepositions of place').getAttribute('lang')).toBe('en');
    expect(screen.getByText('இட இடைச்சொற்கள்').getAttribute('lang')).toBe('ta');
  });

  it('renders as the element it is told to', () => {
    render(<BilingualText as="h2" en="Topics" ta="தலைப்புகள்" />);

    expect(screen.getByRole('heading', { level: 2 })).toBeTruthy();
  });

  it('throws in development when Tamil is missing', () => {
    expect(() => render(<BilingualText en="Topics" ta="   " />)).toThrow(/Tamil is missing/);
  });

  it('marks the gap visibly in production rather than looking complete', () => {
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const { container } = render(<BilingualText en="Topics" ta="" />);

      expect(container.querySelector('[data-missing-ta]')).not.toBeNull();
      expect(screen.getByText('Topics')).toBeTruthy();
    } finally {
      process.env.NODE_ENV = previous;
    }
  });
});
