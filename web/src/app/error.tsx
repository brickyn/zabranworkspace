'use client'; // Wajib untuk Error Boundaries di Next.js App Router

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, ServerCrash } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error ke layanan pemantauan (Sentry/Datadog) atau sekadar console di dev
    console.error('[ErrorBoundary Captured]', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 rounded-xl m-4 border border-slate-200 dark:border-slate-800">
      <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full mb-6 ring-8 ring-red-50 dark:ring-red-900/10">
        <ServerCrash className="w-12 h-12 text-red-600 dark:text-red-400" strokeWidth={1.5} />
      </div>
      
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2 text-center">
        Sistem Mengalami Kendala
      </h2>
      
      <p className="text-slate-600 dark:text-slate-400 max-w-md text-center mb-8">
        Maaf, terjadi masalah saat memuat halaman atau mengambil data dari server. Tim teknis telah diinformasikan.
      </p>

      {process.env.NODE_ENV === 'development' && (
        <div className="w-full max-w-2xl bg-slate-100 dark:bg-slate-950 p-4 rounded-lg overflow-x-auto text-sm text-red-600 dark:text-red-400 font-mono mb-8 border border-red-200 dark:border-red-900/50">
          <div className="flex items-center gap-2 font-bold mb-2">
            <AlertTriangle className="w-4 h-4" />
            Detail Error (Hanya terlihat di Mode Dev):
          </div>
          {error.message}
        </div>
      )}

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
      >
        <RefreshCcw className="w-4 h-4" />
        Muat Ulang Halaman
      </button>
    </div>
  );
}
