import { render, screen } from '@testing-library/react';

import { Spinner } from 'common/components/Spinner/Spinner';

describe('Spinner', () => {
  it('announces itself as a status', () => {
    render(<Spinner />);

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.getByText('Loading')).toBeTruthy();
  });

  it('says what is being waited for when told', () => {
    render(<Spinner label="Drawing the scene" />);

    expect(screen.getByRole('status').textContent).toBe('Drawing the scene');
  });
});
