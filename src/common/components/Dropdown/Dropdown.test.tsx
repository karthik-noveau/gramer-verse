import { act, fireEvent, render, screen } from '@testing-library/react';

import { Dropdown } from 'common/components/Dropdown/Dropdown';

jest.useFakeTimers();

const renderDropdown = (): ReturnType<typeof render> =>
  render(
    <div>
      <button>outside</button>
      <Dropdown label="Open dropdown">
        <button type="button">place</button>
        <button type="button">path</button>
      </Dropdown>
    </div>,
  );

const trigger = (): HTMLElement => screen.getByRole('button', { name: 'Open dropdown' });
const menu = (): HTMLElement => screen.getByRole('menu', { hidden: true });

/* The listener is attached a tick after opening; without draining the timers
   the test would prove nothing about the outside click. */
const settle = (): void => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
};

describe('Dropdown', () => {
  it('starts closed and says so', () => {
    renderDropdown();

    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    expect(menu().hasAttribute('hidden')).toBe(true);
  });

  it('opens on the trigger, and the click that opened it does not close it', () => {
    renderDropdown();
    act(() => trigger().click());
    settle();

    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(menu().hasAttribute('hidden')).toBe(false);
  });

  it('stays open for a click on its own items', () => {
    renderDropdown();
    act(() => trigger().click());
    settle();
    act(() => screen.getByRole('button', { name: 'place' }).click());

    expect(menu().hasAttribute('hidden')).toBe(false);
  });

  it('closes on an outside click', () => {
    renderDropdown();
    act(() => trigger().click());
    settle();
    act(() => screen.getByRole('button', { name: 'outside' }).click());

    expect(menu().hasAttribute('hidden')).toBe(true);
  });

  it('closes on Escape and returns focus to the trigger', () => {
    renderDropdown();
    act(() => trigger().click());
    settle();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(menu().hasAttribute('hidden')).toBe(true);
    expect(document.activeElement).toBe(trigger());
  });

  it('points the trigger at the menu it controls', () => {
    renderDropdown();

    expect(trigger().getAttribute('aria-controls')).toBe(menu().id);
    expect(trigger().getAttribute('aria-haspopup')).toBe('menu');
  });
});
