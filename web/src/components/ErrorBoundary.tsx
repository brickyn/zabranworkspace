'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-3xl p-8 text-center backdrop-blur-xl">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">Terjadi Kesalahan Server</h2>
            <p className="text-muted text-sm mb-6">
              Sistem ZIS ERP mendeteksi masalah tak terduga. Silakan coba muat ulang halaman.
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <span className="block mt-4 text-xs font-mono text-red-400 bg-red-500/5 p-3 rounded-lg text-left overflow-auto max-h-32">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-full font-medium transition-all shadow-lg shadow-red-500/20"
            >
              <RefreshCw className="w-4 h-4" /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
