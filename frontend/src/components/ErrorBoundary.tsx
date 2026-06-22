import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';

type Props = { children: ReactNode; compact?: boolean };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className={this.props.compact ? 'h-full flex items-center justify-center p-8' : 'min-h-screen flex items-center justify-center p-8'} style={{ background: 'var(--forge-bg)' }}>
        <div className="max-w-md text-center">
          <h1 style={{ fontFamily: 'Space Grotesk, sans-serif' }} className="text-xl font-bold text-white">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">Reload the page to restore the Agentrix workspace.</p>
          <Button className="mt-5" onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }
}
