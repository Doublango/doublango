import * as React from "react";

import { Button } from "@/components/ui/button";

type Props = {
  children: React.ReactNode;
};

type State = {
  error: Error | null;
  componentStack?: string;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Logs are intentionally verbose here to help pinpoint render-time crashes.
    console.error("[ErrorBoundary] Caught render error:", error);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
    this.setState({ componentStack: info.componentStack });
  }

  private handleTryAgain = () => {
    this.setState({ error: null, componentStack: undefined });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-md">
          <header className="space-y-2">
            <h1 className="text-xl font-bold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              A UI component crashed during rendering. You can reload the page, or open the technical details below so we can
              identify the exact component.
            </p>
          </header>

          <details className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <summary className="cursor-pointer text-sm font-medium">Technical details</summary>
            <pre className="mt-3 whitespace-pre-wrap break-words text-xs text-muted-foreground">
{this.state.error.message}
{this.state.componentStack ?? ""}
            </pre>
          </details>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => window.location.reload()} className="sm:flex-1">
              Reload
            </Button>
            <Button variant="outline" onClick={this.handleTryAgain} className="sm:flex-1">
              Try again
            </Button>
          </div>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
