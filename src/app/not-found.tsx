'use client';

import { Button } from '@/components/ui/button';
import { Home, Search } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="w-full max-w-md text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center rounded-[3rem] bg-blue-100 px-8 py-6">
            <span className="text-6xl font-black text-blue-600">404</span>
          </div>
        </div>

        {/* Error Title */}
        <h1 className="mb-2 text-3xl font-black tracking-tight text-gray-900">
          页面未找到
        </h1>
        <p className="mb-8 text-sm text-gray-600">
          抱歉，您访问的页面不存在。请检查 URL 或返回首页重新开始。
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link href="/" className="block">
            <Button className="w-full h-12 rounded-2xl bg-primary font-black text-base shadow-lg active-scale">
              <Home className="mr-2 h-5 w-5" />
              返回首页
            </Button>
          </Link>

          <Link href="/search" className="block">
            <Button
              variant="outline"
              className="w-full h-12 rounded-2xl font-bold border-2"
            >
              <Search className="mr-2 h-5 w-5" />
              浏览物品
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-xs text-gray-500">
          💡 提示：使用顶部菜单导航到其他页面
        </p>
      </div>
    </div>
  );
}
