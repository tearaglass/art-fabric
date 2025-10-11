import React from "react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: undefined };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
          <div className="max-w-md w-full bg-card border border-destructive/50 rounded-lg p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                💥 Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                An error occurred in this component. The rest of the app should still work.
              </p>
            </div>
            
            <pre className="p-3 bg-black/40 rounded text-xs font-mono overflow-auto max-h-32 mb-4 text-destructive-foreground">
              {this.state.error.message}
            </pre>
            
            <div className="flex gap-2">
              <Button
                onClick={() => this.setState({ error: undefined })}
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Reload App
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
