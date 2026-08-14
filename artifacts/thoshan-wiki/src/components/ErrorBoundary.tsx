import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled Wiki Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/wiki/main-page';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
          <div className="max-w-md w-full border border-border bg-card p-6 shadow-lg rounded-sm text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-destructive/15 text-destructive mb-4">
              <AlertTriangle size={24} />
            </div>
            <h2 className="text-xl font-serif font-bold mb-2">Something went wrong</h2>
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred while rendering this page in Thoshan&apos;s Wiki.
            </p>
            {this.state.error && (
              <div className="p-3 bg-muted/40 border border-border text-xs text-left font-mono mb-5 overflow-auto max-h-32 text-foreground/80">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground text-sm font-medium rounded hover:opacity-90 transition-opacity"
            >
              <RefreshCw size={14} />
              Return to Main Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
