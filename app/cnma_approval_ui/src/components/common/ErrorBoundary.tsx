import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@cnma/react-ui';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[React ErrorBoundary caught error]:', error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-screen flex-col items-center justify-center bg-background p-6 text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
                        <AlertTriangle className="size-8" />
                    </div>
                    <h1 className="text-xl font-bold text-foreground mb-2">
                        Application Error
                    </h1>
                    <p className="max-w-md text-sm text-muted-foreground mb-6 leading-relaxed">
                        {this.state.error?.message || 'An unexpected rendering error occurred in the application.'}
                    </p>
                    {this.state.error?.stack && (
                        <details className="max-w-xl w-full text-left mb-6 rounded-lg bg-muted p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
                            <summary className="cursor-pointer font-semibold text-foreground mb-2">
                                Technical Details & Stack Trace
                            </summary>
                            <pre className="whitespace-pre-wrap break-words text-[11px]">
                                {this.state.error.stack}
                            </pre>
                        </details>
                    )}
                    <Button onClick={this.handleReload} variant="default" className="gap-2">
                        <RotateCcw className="size-4" />
                        Reload Application
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
