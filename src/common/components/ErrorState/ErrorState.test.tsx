import { render, screen } from '@testing-library/react';

import { Button } from 'common/components/Button/Button';
import { ErrorState } from 'common/components/ErrorState/ErrorState';

describe('ErrorState', () => {
  it('announces itself as an alert', () => {
    render(<ErrorState title="Content failed validation" />);

    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('names the file and the rule in a code element', () => {
    const detail = 'lessons/prepositions-place.json → lesson "at" → why.ta is empty';
    render(<ErrorState title="Content failed validation" detail={detail} />);
    const code = screen.getByText(detail);

    expect(code.tagName).toBe('CODE');
  });

  it('renders a retry action', () => {
    const onRetry = jest.fn();
    render(<ErrorState title="Failed" action={<Button onClick={onRetry}>Retry</Button>} />);
    screen.getByRole('button', { name: 'Retry' }).click();

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('says it in Tamil too when given the string', () => {
    render(<ErrorState title="Failed" ta="உள்ளடக்கம் சரிபார்ப்பில் தோல்வி." />);

    expect(screen.getByText('உள்ளடக்கம் சரிபார்ப்பில் தோல்வி.').getAttribute('lang')).toBe('ta');
  });
});
