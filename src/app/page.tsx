'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MetricCard } from '@/components/overview/MetricCard';
import { RecentActivityTable } from '@/components/overview/RecentActivityTable';
import { RecentNegativeList } from '@/components/overview/RecentNegativeList';
import { Radio, MessageSquare, AlertTriangle, BellRing, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { OverviewData } from '@/types/api';

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/overview');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || 'Failed to load overview data');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();

    const handleMonitorCreated = () => {
      fetchOverview();
    };

    window.addEventListener('monitor-created', handleMonitorCreated);
    return () => window.removeEventListener('monitor-created', handleMonitorCreated);
  }, []);

  const handleCheckNow = async (monitorId: string) => {
    setCheckingId(monitorId);
    try {
      const res = await fetch(`/api/monitors/${monitorId}/check`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(`Check failed: ${json.error}`);
      } else {
        await fetchOverview();
      }
    } catch (err: unknown) {
      alert(`Error running check: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setCheckingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Overview</h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time monitoring metrics, recent crawls, and negative Reddit feedback.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchOverview}
          >
            Refresh
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-950/60 border border-red-800 rounded-xl text-sm text-red-300">
            {error}
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Active Monitors"
            value={data?.metrics.activeMonitors ?? 0}
            description="Reddit posts currently monitored hourly"
            icon={<Radio className="w-5 h-5" />}
            variant="blue"
          />
          <MetricCard
            title="Comments Processed"
            value={data?.metrics.totalCommentsProcessed ?? 0}
            description="Total Reddit comments crawled"
            icon={<MessageSquare className="w-5 h-5" />}
            variant="purple"
          />
          <MetricCard
            title="Negative Comments"
            value={data?.metrics.totalNegativeComments ?? 0}
            description="Meaningful negative feedback identified"
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="red"
          />
          <MetricCard
            title="Alerts Sent"
            value={data?.metrics.alertsSent ?? 0}
            description="Resend email notifications delivered"
            icon={<BellRing className="w-5 h-5" />}
            variant="emerald"
          />
        </div>

        {/* Recent Activity Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-tight">Recent Activity</h2>
            <span className="text-xs text-slate-400">Live Post Monitors</span>
          </div>
          <RecentActivityTable
            activities={data?.recentActivity ?? []}
            onCheckNow={handleCheckNow}
            checkingId={checkingId}
          />
        </div>

        {/* Recent Negative Comments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white tracking-tight">Recent Negative Comments</h2>
            <span className="text-xs text-slate-400">AI Gemini Classified</span>
          </div>
          <RecentNegativeList comments={data?.recentNegativeComments ?? []} />
        </div>
      </div>
    </AppLayout>
  );
}
