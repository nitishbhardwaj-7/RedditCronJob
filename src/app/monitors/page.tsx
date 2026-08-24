'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { AddMonitorModal } from '@/components/monitors/AddMonitorModal';
import { Plus, Search, ExternalLink, RefreshCw, Trash2, Mail, Calendar, Eye } from 'lucide-react';
import { IMonitor } from '@/types/domain';

interface MonitorWithStats extends IMonitor {
  totalComments?: number;
  negativeComments?: number;
}

function MonitorsContent() {
  const searchParams = useSearchParams();
  const platformParam = searchParams.get('platform');

  const [monitors, setMonitors] = useState<MonitorWithStats[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    if (platformParam && ['reddit', 'quora', 'teamblind', 'all'].includes(platformParam)) {
      setSelectedPlatform(platformParam);
    } else if (!platformParam) {
      setSelectedPlatform('all');
    }
  }, [platformParam]);

  const fetchMonitors = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/monitors');
      const json = await res.json();
      if (json.success) {
        setMonitors(json.data);
      }
    } catch (err) {
      console.error('Error fetching monitors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  const handleToggleEnabled = async (monitorId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`/api/monitors/${monitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res.ok) {
        fetchMonitors();
      }
    } catch (err) {
      console.error('Failed to toggle monitor state:', err);
    }
  };

  const handleCheckNow = async (monitorId: string) => {
    setCheckingId(monitorId);
    try {
      const res = await fetch(`/api/monitors/${monitorId}/check`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(`Check failed: ${json.error}`);
      } else {
        await fetchMonitors();
      }
    } catch (err) {
      alert(`Error running check: ${err}`);
    } finally {
      setCheckingId(null);
    }
  };

  const handleDelete = async (monitorId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove its stored comments.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/monitors/${monitorId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchMonitors();
      }
    } catch (err) {
      console.error('Failed to delete monitor:', err);
    }
  };

  const filteredMonitors = monitors.filter((m) => {
    const matchesPlatform =
      selectedPlatform === 'all' || (m.platform || 'reddit') === selectedPlatform;
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.redditUrl.toLowerCase().includes(search.toLowerCase()) ||
      (m.subreddit && m.subreddit.toLowerCase().includes(search.toLowerCase()));

    return matchesPlatform && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Brand Monitors</h1>
            <p className="text-xs text-slate-400 mt-1">
              Manage configured Reddit, Quora, and Team Blind post scrapers and hourly monitoring routines.
            </p>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Monitor
          </Button>
        </div>

        {/* Platform Tabs & Filter Bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'all', label: 'All Platforms', icon: '🌐' },
              { id: 'reddit', label: 'Reddit', icon: '🔥' },
              { id: 'quora', label: 'Quora', icon: '❓' },
              { id: 'teamblind', label: 'Team Blind', icon: '👁️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedPlatform(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedPlatform === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
            <div className="max-w-md w-full">
              <Input
                placeholder="Search monitors by name, URL, or topic..."
                icon={<Search className="w-4 h-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="text-xs text-slate-400 font-mono ml-auto">
              Showing <strong>{filteredMonitors.length}</strong> of {monitors.length} monitors
            </div>
          </div>
        </div>

        {/* Monitors Cards Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading monitors...</div>
        ) : filteredMonitors.length === 0 ? (
          <div className="py-16 text-center border border-slate-800 rounded-xl bg-slate-900/40 space-y-3">
            <p className="text-sm font-medium text-slate-300">No Reddit monitors found.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add a Reddit post URL to start receiving automated email alerts for negative comments.
            </p>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Monitor Now
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMonitors.map((monitor) => (
              <div
                key={monitor._id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-white text-base leading-tight">
                        {monitor.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
                          {monitor.subreddit || 'r/reddit'}
                        </span>
                        <a
                          href={monitor.redditUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <span className="truncate">{monitor.redditUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={monitor.enabled}
                          onChange={() => handleToggleEnabled(monitor._id, monitor.enabled)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/60 my-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Comments</span>
                      <span className="font-mono font-bold text-slate-200 text-sm">
                        {monitor.totalComments ?? 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Negative Detected</span>
                      <span className="font-mono font-bold text-red-400 text-sm">
                        {monitor.negativeComments ?? 0}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Alert email:</span>
                      <span className="text-slate-200 font-mono">{monitor.recipientEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Last Checked:</span>
                      <span className="text-slate-300">
                        {monitor.lastCheckedAt
                          ? new Date(monitor.lastCheckedAt).toLocaleString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {monitor.lastCrawlStatus === 'running' ? (
                      <Badge variant="warning" size="sm">Running</Badge>
                    ) : monitor.lastCrawlStatus === 'failed' ? (
                      <Badge variant="danger" size="sm">Failed</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Active</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={checkingId === monitor._id}
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                      onClick={() => handleCheckNow(monitor._id)}
                    >
                      Check Now
                    </Button>
                    <Link href={`/monitors/${monitor._id}`}>
                      <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                        Details
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/40"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => handleDelete(monitor._id, monitor.name)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddMonitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchMonitors}
      />
    </AppLayout>
  );
}

export default function MonitorsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading monitors...</div>}>
      <MonitorsContent />
    </Suspense>
  );
}
