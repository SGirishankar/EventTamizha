import { Component, type ReactNode } from 'react';

/** Keeps one failing section from blanking the whole page. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey?: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.fallback) return this.props.fallback;
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p lang="ta" className="text-2xl font-bold text-primary">மன்னிக்கவும், ஏதோ தவறு நடந்தது.</p>
        <p className="mt-2 text-ink/60">Sorry, something went wrong. Please reload the page.</p>
        <button type="button" className="btn-primary mt-6" onClick={() => location.reload()}>மீண்டும் ஏற்ற · Reload</button>
      </div>
    );
  }
}
