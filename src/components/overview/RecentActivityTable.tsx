'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { IMonitor } from '@/types/domain';

interface ActivityItem {
  monitor: IMonitor;
  lastChecked?: string | null;
  newComments: number;
  negativeComments: number;
  status: string;
}

interface RecentActivityTableProps {
  activities: ActivityItem[];
  onCheckNow?: (monitorId: string) => void;
  checkingId?: string | null;
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({
  activities,
  onCheckNow,
  checkingId,
}) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="py-12 text-center border border-slate-800 rounded-xl bg-slate-900/40">
        <p className="text-sm text-slate-400">No active monitors yet.</p>
        <p className="text-xs text-slate-500 mt-1">Add a Reddit post URL to start tracking feedback.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/60">
      <table className="w-full text-left text-sm text-slate-300">
        <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
          <tr>
            <th className="py-3.5 px-4">Brand Monitor</th>
            <th className="py-3.5 px-4">Platform</th>
            <th className="py-3.5 px-4">Last Checked</th>
            <th className="py-3.5 px-4 text-center">Comments</th>
            <th className="py-3.5 px-4 text-center">Negative</th>
            <th className="py-3.5 px-4">Status</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {activities.map(({ monitor, lastChecked, newComments, negativeComments, status }) => {
            const platform = monitor.platform || 'reddit';
            const platformIcon = platform === 'quora' ? '❓' : platform === 'teamblind' ? '👁️' : '🔥';
            const platformLabel = platform === 'quora' ? 'Quora' : platform === 'teamblind' ? 'Team Blind' : 'Reddit';

            return (
              <tr key={monitor._id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">{monitor.name}</span>
                    <a
                      href={monitor.redditUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5 truncate"
                    >
                      <span className="truncate">{monitor.redditUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-xs font-mono">
                  <span className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-slate-300 inline-flex items-center gap-1">
                    <span>{platformIcon}</span> {platformLabel}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-400">
                  {lastChecked ? new Date(lastChecked).toLocaleString() : 'Never'}
                </td>
              <td className="py-3.5 px-4 text-center font-mono text-xs">{newComments}</td>
              <td className="py-3.5 px-4 text-center font-mono text-xs">
                {negativeComments > 0 ? (
                  <span className="font-bold text-red-400 bg-red-950/80 px-2 py-0.5 rounded-full border border-red-800/60">
                    {negativeComments}
                  </span>
                ) : (
                  <span className="text-slate-500">0</span>
                )}
              </td>
              <td className="py-3.5 px-4">
                {status === 'running' ? (
                  <Badge variant="warning" size="sm">Running...</Badge>
                ) : status === 'failed' ? (
                  <Badge variant="danger" size="sm">Failed</Badge>
                ) : (
                  <Badge variant="success" size="sm">Active</Badge>
                )}
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onCheckNow && (
                    <Button
                      variant="ghost"
                      size="sm"
                      isLoading={checkingId === monitor._id}
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                      onClick={() => onCheckNow(monitor._id)}
                      title="Run manual check now"
                    >
                      Check Now
                    </Button>
                  )}
                  <Link href={`/monitors/${monitor._id}`}>
                    <Button variant="outline" size="sm" icon={<Eye className="w-3.5 h-3.5" />}>
                      Details
                    </Button>
                  </Link>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
      </table>
    </div>
  );
};
