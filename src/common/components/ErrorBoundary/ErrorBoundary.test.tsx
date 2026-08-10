import { useState } from 'react';
import type { JSX } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';

import { ErrorBoundary } from 'common/components/ErrorBoundary/ErrorBoundary';

function Boom({ throws }: { readonly throws: boolean }): JSX.Element {
  if (throws) throw new Error('lessons/prepositions-place.json is malformed');
  return <p>the page</p>;
}

/* React logs every caught error to the console; that is React working, not the
   test failing, and the noise would bury a real failure. */
let consoleError: jest.SpyInstance;

beforeEach(() => {
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('ErrorBoundary', () => {
  it('renders its children when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Boom throws={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('the page')).toBeTruthy();
  });

  it('catches a thrown render error instead of blanking the screen', () => {
    render(
      <ErrorBoundary>
        <Boom throws />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'This part of the app stopped' })).toBeTruthy();
  });

  it('names what broke rather than saying something went wrong', () => {
    render(
      <ErrorBoundary>
        <Boom throws />
      </ErrorBoundary>,
    );
    const detail = screen.getByText('lessons/prepositions-place.json is malformed');

    expect(detail.tagName).toBe('CODE');
  });

  it('offers a reload', () => {
    render(
      <ErrorBoundary>
        <Boom throws />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('button', { name: 'Reload' })).toBeTruthy();
  });

  it('clears when the reset key changes, so one bad page is not the session', () => {
    function Harness(): JSX.Element {
      const [path, setPath] = useState('/lessons/broken');
      return (
        <div>
          <button onClick={() => setPath('/topics')}>navigate</button>
          <ErrorBoundary resetKey={path}>
            <Boom throws={path === '/lessons/broken'} />
          </ErrorBoundary>
        </div>
      );
    }

    render(<Harness />);
    expect(screen.getByRole('alert')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'navigate' }));

    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('the page')).toBeTruthy();
  });

  it('stays broken while the reset key is unchanged', () => {
    const { rerender } = render(
      <ErrorBoundary resetKey="/same">
        <Boom throws />
      </ErrorBoundary>,
    );

    rerender(
      <ErrorBoundary resetKey="/same">
        <Boom throws={false} />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeTruthy();
  });
});
