import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { Button } from 'common/components/Button/Button';
import { ErrorState } from 'common/components/ErrorState/ErrorState';

export type ErrorBoundaryProps = {
  readonly children: ReactNode;
  /** Change this and the boundary clears. The router passes the pathname, so
   *  one page that throws does not poison every page after it. */
  readonly resetKey?: string;
};

type ErrorBoundaryState = { readonly error: Error | null };

/**
 * The last thing between a thrown render error and a white screen.
 *
 * A class, which `codebase-guide.md` otherwise forbids: React provides no hook
 * for `componentDidCatch`, and there is no function-component equivalent. This
 * is the single exception in the codebase.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    /* Nowhere to report to — there is no backend. The message and the
       component stack are put on the error itself so the state below can name
       what broke instead of saying "something went wrong". */
    if (info.componentStack) {
      this.setState({ error: Object.assign(error, { componentStack: info.componentStack }) });
    }
  }

  override render(): ReactNode {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <ErrorState
        title="This part of the app stopped"
        body="Nothing was lost — the content ships with the app and lives in this browser."
        ta="இந்தப் பகுதி நின்றுவிட்டது."
        detail={error.message}
        action={<Button variant="primary" onClick={() => window.location.reload()}>Reload</Button>}
      />
    );
  }
}
