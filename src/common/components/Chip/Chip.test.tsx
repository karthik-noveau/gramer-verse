import { render, screen } from '@testing-library/react';

import { Chip } from 'common/components/Chip/Chip';

describe('Chip', () => {
  it('reports its pressed state to assistive tech', () => {
    render(<Chip label="on" ta="மீது" pressed />);

    expect(screen.getByRole('button', { pressed: true })).toBeTruthy();
  });

  it('is unpressed by default', () => {
    render(<Chip label="in" />);

    expect(screen.getByRole('button', { pressed: false })).toBeTruthy();
  });

  it('tags the Tamil so it gets the Tamil stack', () => {
    render(<Chip label="under" ta="கீழே" />);

    expect(screen.getByText('கீழே').getAttribute('lang')).toBe('ta');
  });

  it('respects disabled', () => {
    const onClick = jest.fn();
    render(<Chip label="locked" disabled onClick={onClick} />);
    screen.getByRole('button').click();

    expect(onClick).not.toHaveBeenCalled();
  });
});
