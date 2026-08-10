import { render, screen } from '@testing-library/react';

import { Toast, ToastRegion } from 'common/components/Toast/Toast';

describe('Toast', () => {
  it('announces politely and does not take focus', () => {
    const before = document.activeElement;
    render(<Toast title="Saved on this device" />);

    expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
    expect(document.activeElement).toBe(before);
  });

  it('is not a dialog', () => {
    render(<Toast title="Saved" />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders a body and a tone', () => {
    render(<Toast title="Could not draw" body="rocket is not in the library" tone="danger" />);

    expect(screen.getByText('rocket is not in the library')).toBeTruthy();
    expect(screen.getByRole('status').className).toContain('danger');
  });

  it('dismisses when asked to', () => {
    const onDismiss = jest.fn();
    render(<Toast title="Saved" onDismiss={onDismiss} />);
    screen.getByRole('button', { name: 'Dismiss' }).click();

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stacks toasts in a live region', () => {
    render(
      <ToastRegion>
        <Toast title="One" />
        <Toast title="Two" />
      </ToastRegion>,
    );

    expect(screen.getAllByRole('status')).toHaveLength(2);
  });
});
