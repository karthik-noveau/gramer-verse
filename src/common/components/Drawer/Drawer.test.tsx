import { useState } from 'react';
import type { JSX } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Button } from 'common/components/Button/Button';
import { Drawer } from 'common/components/Drawer/Drawer';

function Harness(): JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <h1>Components</h1>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Drawer">
        <Button onClick={() => setOpen(false)}>Close</Button>
      </Drawer>
    </div>
  );
}

const open = (): HTMLElement => {
  const trigger = screen.getByRole('button', { name: 'Open drawer' });
  trigger.focus();
  act(() => trigger.click());
  return trigger;
};

describe('Drawer', () => {
  it('renders nothing while closed', () => {
    render(<Harness />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens named by its title, with focus inside it', () => {
    render(<Harness />);
    open();

    expect(screen.getByRole('dialog', { name: 'Drawer' })).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' }));
  });

  it('closes on Escape and gives focus back', () => {
    render(<Harness />);
    const trigger = open();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes on the scrim', () => {
    render(<Harness />);
    open();

    act(() => screen.getByTestId('drawer-scrim').click());

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
