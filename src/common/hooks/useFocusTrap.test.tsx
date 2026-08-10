import { useRef, useState } from 'react';
import type { JSX } from 'react';
import { act, render, screen } from '@testing-library/react';

import { useFocusTrap } from 'common/hooks/useFocusTrap';

type HarnessProps = { readonly withOpener?: boolean };

function Harness({ withOpener = true }: HarnessProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, open);

  return (
    <div>
      <h1>Page heading</h1>
      {withOpener || !open ? <button onClick={() => setOpen(true)}>open</button> : null}
      {open ? (
        <div ref={ref}>
          <button>first</button>
          <button>second</button>
          <button onClick={() => setOpen(false)}>close</button>
        </div>
      ) : null}
    </div>
  );
}

const tab = (shiftKey = false): void => {
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey, bubbles: true }));
  });
};

describe('useFocusTrap', () => {
  it('moves focus to the first focusable when it activates', () => {
    render(<Harness />);
    act(() => screen.getByText('open').click());

    expect(document.activeElement).toBe(screen.getByText('first'));
  });

  it('wraps forward from the last stop to the first', () => {
    render(<Harness />);
    act(() => screen.getByText('open').click());
    screen.getByText('close').focus();

    tab();

    expect(document.activeElement).toBe(screen.getByText('first'));
  });

  it('wraps backward from the first stop to the last', () => {
    render(<Harness />);
    act(() => screen.getByText('open').click());

    tab(true);

    expect(document.activeElement).toBe(screen.getByText('close'));
  });

  it('restores focus to whatever opened it', () => {
    render(<Harness />);
    const opener = screen.getByText('open');
    opener.focus();
    act(() => opener.click());
    act(() => screen.getByText('close').click());

    expect(document.activeElement).toBe(opener);
  });

  it('falls back to the page heading when the opener has unmounted', () => {
    render(<Harness withOpener={false} />);
    const opener = screen.getByText('open');
    opener.focus();
    act(() => opener.click());
    /* The opener is gone: this harness renders it only while closed. */
    expect(document.contains(opener)).toBe(false);

    act(() => screen.getByText('close').click());

    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1 }));
  });
});
