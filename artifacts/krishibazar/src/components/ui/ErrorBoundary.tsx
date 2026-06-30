import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[50vh] bg-kb-cream flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-md p-8 max-w-sm w-full text-center">
            <div className="text-4xl mb-4">🌿</div>
            <h2 className="text-lg font-bold text-kb-text mb-2">Something went wrong</h2>
            <p className="text-sm text-kb-muted mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-kb-deep to-kb-forest text-white rounded-full font-semibold text-sm"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
