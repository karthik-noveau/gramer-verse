import { useState } from 'react';
import type { JSX } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Button } from 'common/components/Button/Button';
import { Dialog } from 'common/components/Dialog/Dialog';

function Harness(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h1>Components</h1>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Dialog"
        actions={<Button onClick={() => setOpen(false)}>Cancel</Button>}
      >
        <p>Confirms something destructive.</p>
      </Dialog>
    </div>
  );
}

const open = (): HTMLElement => {
  const trigger = screen.getByRole('button', { name: 'Open dialog' });
  trigger.focus();
  act(() => trigger.click());
  return trigger;
};

describe('Dialog', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('is modal and named by its title', () => {
    render(<Harness />);
    open();
    const dialog = screen.getByRole('dialog');

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByRole('dialog', { name: 'Dialog' })).toBe(dialog);
  });

  it('traps focus, putting it on the first control inside', () => {
    render(<Harness />);
    open();

    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Cancel' }));
  });

  it('closes on Escape and restores focus to the trigger', () => {
    render(<Harness />);
    const trigger = open();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on a click on the scrim but not inside the dialog', () => {
    render(<Harness />);
    open();

    act(() => {
      screen.getByRole('dialog').click();
    });
    expect(screen.getByRole('dialog')).toBeTruthy();

    act(() => {
      screen.getByTestId('dialog-scrim').click();
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
