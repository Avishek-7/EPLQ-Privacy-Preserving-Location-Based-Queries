import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
                    <div className="bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black p-8 max-w-md w-full mx-4">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-black text-gray-900 mb-4">Oops! Something went wrong</h1>
                            <p className="text-gray-600 mb-6">
                                We encountered an unexpected error. Don't worry, your data is safe.
                            </p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="w-full bg-emerald-400 text-black px-6 py-3 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-emerald-300 transition-all duration-200 font-black text-sm uppercase tracking-wide"
                                >
                                    🔄 Reload Page
                                </button>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full bg-white text-black px-6 py-3 rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:bg-gray-100 transition-all duration-200 font-black text-sm uppercase tracking-wide"
                                >
                                    🏠 Go Home
                                </button>
                            </div>
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-6 text-left">
                                    <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                                        Error Details (Development)
                                    </summary>
                                    <pre className="text-xs text-red-600 bg-red-50 p-3 rounded border overflow-auto">
                                        {this.state.error.toString()}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}