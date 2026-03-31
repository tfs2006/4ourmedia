import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

const API_BASE = import.meta.env.DEV ? 'http://localhost:3001' : '';

function reportClientError(error: Error, errorInfo: ErrorInfo) {
  try {
    const payload = {
      message: error?.message || 'Unknown runtime error',
      stack: error?.stack || '',
      componentStack: errorInfo?.componentStack || '',
      route: `${window.location.pathname}${window.location.search}${window.location.hash}`,
      userAgent: window.navigator.userAgent,
      source: 'react-error-boundary',
    };

    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const sent = navigator.sendBeacon(`${API_BASE}/api/client-error`, blob);
      if (sent) return;
    }

    void fetch(`${API_BASE}/api/client-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Avoid cascading failures from error reporting itself.
  }
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare props: AppErrorBoundaryProps;
  declare state: AppErrorBoundaryState;

  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AppErrorBoundary caught error:', error, errorInfo);
    reportClientError(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.history.replaceState({}, '', '/');
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const showDebug = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
          <div className="w-full rounded-3xl border border-rose-500/30 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rose-300">Recovery Mode</p>
            <h1 className="mt-3 text-3xl font-bold">Something broke, but your session is safe.</h1>
            <p className="mt-3 text-sm text-slate-300">
              The app hit a runtime error and switched to a safe fallback screen. Reload to continue.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReload}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-indigo-500"
              >
                Reload App
              </button>
              <button
                onClick={this.handleGoHome}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:text-white"
              >
                Go To Homepage
              </button>
            </div>

            {showDebug && this.state.errorMessage && (
              <div className="mt-5 rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-left text-xs text-slate-400">
                <p className="font-semibold text-slate-300">Debug:</p>
                <p className="mt-1 break-all">{this.state.errorMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}
