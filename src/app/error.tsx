'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        {/* Error Title */}
        <h1 className="mb-2 text-3xl font-black tracking-tight text-gray-900">
          发生错误
        </h1>
        <p className="mb-8 text-sm text-gray-600">
          抱歉，应用出现了问题。请尝试重新加载或返回首页。
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 rounded-lg bg-red-50 p-4 text-left">
            <p className="text-xs font-mono text-red-700">{error.message}</p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">ID: {error.digest}</p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={reset}
            className="w-full h-12 rounded-2xl bg-primary font-black text-base shadow-lg active-scale"
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            重新加载
          </Button>

          <Link href="/" className="block">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl font-bold border-2"
            >
              <Home className="mr-2 h-5 w-5" />
              返回首页
            </Button>
          </Link>
        </div>

        {/* Support Info */}
        <p className="mt-8 text-xs text-gray-500">
          如果问题继续，请联系我们的支持团队
        </p>
      </div>
    </div>
  );
}
