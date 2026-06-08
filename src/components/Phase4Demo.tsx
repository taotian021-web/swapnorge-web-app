/**
 * 🔧 Phase 4 示例组件
 * 
 * 展示如何使用跨标签页通信、缓存和离线功能
 */

'use client';

import React, { useState } from 'react';
import { useNetworkStatus, useIsOnline } from '@/hooks/use-network-status';
import { useGlobalAuthCompatible } from '@/contexts/AuthContext';
import { authSync } from '@/lib/storage-sync';
import { getCacheInfo, clearAllCaches } from '@/lib/cache-manager';

/**
 * 示例 1: 网络状态指示器
 */
export function NetworkStatusIndicatorExample() {
  const { isOnline, effectiveType, saveData } = useNetworkStatus();

  return (
    <div className="p-4 rounded-lg border">
      <h3 className="font-bold mb-2">网络状态</h3>
      <div className="space-y-1 text-sm">
        <p>
          状态: {isOnline ? (
            <span className="text-green-600">🟢 在线</span>
          ) : (
            <span className="text-red-600">🔴 离线</span>
          )}
        </p>
        <p>连接类型: {effectiveType || '未知'}</p>
        <p>节省流量: {saveData ? '是' : '否'}</p>
      </div>
    </div>
  );
}

/**
 * 示例 2: 跨标签页同步状态
 */
export function CrossTabSyncExample() {
  const { user } = useGlobalAuthCompatible();
  const [tabId, setTabId] = useState<string>('');

  React.useEffect(() => {
    setTabId(authSync.getTabId());
  }, []);

  return (
    <div className="p-4 rounded-lg border">
      <h3 className="font-bold mb-2">跨标签页同步</h3>
      <div className="space-y-1 text-sm">
        <p>当前标签页ID: {tabId}</p>
        <p>用户状态: {user ? `已登入 (${user.email})` : '未登入'}</p>
        <p className="text-xs text-gray-500 mt-2">
          💡 在另一个标签页登入/登出，此信息会自动更新
        </p>
      </div>
    </div>
  );
}

/**
 * 示例 3: 缓存信息查看
 */
export function CacheInfoExample() {
  const [cacheInfo, setCacheInfo] = useState<ReturnType<typeof getCacheInfo> | null>(null);

  React.useEffect(() => {
    setCacheInfo(getCacheInfo());
  }, []);

  return (
    <div className="p-4 rounded-lg border">
      <h3 className="font-bold mb-2">缓存信息</h3>
      {cacheInfo ? (
        <div className="space-y-2 text-sm font-mono">
          <details>
            <summary className="cursor-pointer font-bold">会话缓存</summary>
            <pre className="ml-4 text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(cacheInfo.session, null, 2)}
            </pre>
          </details>
          <details>
            <summary className="cursor-pointer font-bold">用户缓存</summary>
            <pre className="ml-4 text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(cacheInfo.user, null, 2)}
            </pre>
          </details>
          <details>
            <summary className="cursor-pointer font-bold">资料缓存</summary>
            <pre className="ml-4 text-xs bg-gray-100 p-2 rounded mt-1">
              {JSON.stringify(cacheInfo.profile, null, 2)}
            </pre>
          </details>
        </div>
      ) : (
        <p className="text-xs text-gray-500">加载中...</p>
      )}
      <button
        onClick={() => {
          clearAllCaches();
          setCacheInfo(getCacheInfo());
          alert('缓存已清除');
        }}
        className="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
      >
        清除所有缓存
      </button>
    </div>
  );
}

/**
 * 示例 4: 离线消息显示
 */
export function OfflineMessageExample() {
  const isOnline = useIsOnline();

  if (isOnline) {
    return null;
  }

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
      <p className="text-sm">
        ⚠️ 你当前处于离线状态。应用正在使用缓存的数据。
      </p>
    </div>
  );
}

/**
 * 示例 5: 完整的 Phase 4 演示页面
 */
export function Phase4DemoPage() {
  const [logs, setLogs] = useState<string[]>([]);

  React.useEffect(() => {
    // 监听同步事件
    const unsubscribe = authSync.subscribe((event) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = `[${timestamp}] ${event.type} (TabID: ${event.tabId.slice(0, 8)})`;
      setLogs((prev) => [message, ...prev].slice(0, 10));
    });

    return unsubscribe;
  }, []);

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Phase 4 - 跨标签页通信演示</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NetworkStatusIndicatorExample />
        <CrossTabSyncExample />
        <CacheInfoExample />
        <OfflineMessageExample />
      </div>

      <div className="p-4 rounded-lg border">
        <h3 className="font-bold mb-2">同步事件日志</h3>
        <div className="space-y-1 text-xs font-mono bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">等待事件...</p>
          ) : (
            logs.map((log, i) => <div key={i}>{log}</div>)
          )}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-2 px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          清除日志
        </button>
      </div>

      <div className="p-4 rounded-lg border bg-blue-50">
        <h3 className="font-bold mb-2">📝 使用说明</h3>
        <ol className="space-y-2 text-sm list-decimal list-inside">
          <li>打开这个页面的两个浏览器标签页</li>
          <li>在一个标签页登入或登出</li>
          <li>观察另一个标签页自动更新状态</li>
          <li>打开开发者工具 (F12) → Network</li>
          <li>设置为离线 (Offline)</li>
          <li>观察页面仍然显示缓存的数据</li>
          <li>恢复网络连接并观察自动同步</li>
        </ol>
      </div>

      <div className="p-4 rounded-lg border bg-green-50">
        <h3 className="font-bold mb-2">✨ Phase 4 功能</h3>
        <ul className="space-y-1 text-sm list-disc list-inside">
          <li>✅ 跨标签页登入状态实时同步</li>
          <li>✅ 智能缓存策略（24小时会话，1小时资料）</li>
          <li>✅ 完整的离线支持</li>
          <li>✅ 网络状态实时监测</li>
          <li>✅ 浏览器兼容性方案（BroadcastChannel + Storage Events）</li>
        </ul>
      </div>
    </div>
  );
}

export default Phase4DemoPage;
