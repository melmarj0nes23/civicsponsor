import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || 'An unexpected application error occurred.',
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Application error boundary caught:', error, errorInfo);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false, message: '' });
    window.location.assign('/');
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-16">
          <div className="max-w-lg w-full bg-white border border-slate-200 rounded-lg p-8">
            <div className="flex items-center gap-3 text-amber-800 mb-4">
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              We encountered an unexpected error while loading this page. Your project data in the
              directory remains safe.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-civic-primary hover:bg-civic-primary-hover rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
