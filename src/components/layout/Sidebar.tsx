'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Radio,
  MessageSquareWarning,
  Bell,
  Settings,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPlatform = searchParams.get('platform');

  const isMonitorsActive = pathname.startsWith('/monitors');

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-screen">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-slate-800/80 gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base tracking-tight leading-none">BrandPulse</h1>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">AI Sentiment Monitor</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-4 space-y-1.5">
          {/* Overview */}
          <Link
            href="/"
            className={clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname === '/'
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <LayoutDashboard className={clsx('w-4 h-4', pathname === '/' ? 'text-blue-400' : 'text-slate-400')} />
            <span>Overview</span>
          </Link>

          {/* Monitors Group */}
          <div className="space-y-1">
            <Link
              href="/monitors"
              className={clsx(
                'flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isMonitorsActive && !currentPlatform
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Radio className={clsx('w-4 h-4', isMonitorsActive ? 'text-blue-400' : 'text-slate-400')} />
                <span>Monitors</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            {/* Platform Specific Monitor Sub-Links */}
            <div className="pl-4 space-y-1 pt-0.5 border-l border-slate-800/80 ml-4">
              <Link
                href="/monitors?platform=reddit"
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  isMonitorsActive && currentPlatform === 'reddit'
                    ? 'bg-orange-500/20 text-orange-300 font-semibold border border-orange-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <span>🔥</span>
                <span>Reddit Monitors</span>
              </Link>

              <Link
                href="/monitors?platform=quora"
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  isMonitorsActive && currentPlatform === 'quora'
                    ? 'bg-red-500/20 text-red-300 font-semibold border border-red-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <span>❓</span>
                <span>Quora Monitors</span>
              </Link>

              <Link
                href="/monitors?platform=teamblind"
                className={clsx(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  isMonitorsActive && currentPlatform === 'teamblind'
                    ? 'bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <span>👁️</span>
                <span>Team Blind Monitors</span>
              </Link>
            </div>
          </div>

          {/* Negative Comments */}
          <Link
            href="/negative-comments"
            className={clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/negative-comments')
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <MessageSquareWarning className={clsx('w-4 h-4', pathname.startsWith('/negative-comments') ? 'text-blue-400' : 'text-slate-400')} />
            <span>Negative Comments</span>
          </Link>

          {/* Alerts */}
          <Link
            href="/alerts"
            className={clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/alerts')
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <Bell className={clsx('w-4 h-4', pathname.startsWith('/alerts') ? 'text-blue-400' : 'text-slate-400')} />
            <span>Alerts</span>
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className={clsx(
              'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              pathname.startsWith('/settings')
                ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
          >
            <Settings className={clsx('w-4 h-4', pathname.startsWith('/settings') ? 'text-blue-400' : 'text-slate-400')} />
            <span>Settings</span>
          </Link>
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80">
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 text-xs text-slate-400">
          <div className="flex items-center justify-between text-[11px] mb-1 font-mono text-slate-400">
            <span>PIPELINE STATUS</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Hourly Apify → Gemini 2.5 Flash → Resend</p>
        </div>
      </div>
    </aside>
  );
}

export const Sidebar: React.FC = () => {
  return (
    <React.Suspense fallback={<div className="w-64 bg-slate-900 min-h-screen" />}>
      <SidebarContent />
    </React.Suspense>
  );
};
