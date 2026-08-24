'use client';

import React, { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { CommentCard } from '@/components/comments/CommentCard';
import { Bell, Mail, Calendar, Eye, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { SeverityLevel } from '@/types/domain';
import { CommentCardData } from '@/components/comments/CommentCard';

interface AlertItem {
  _id: string;
  monitorId: string;
  monitorName: string;
  recipientEmail: string;
  negativeCommentCount: number;
  highestSeverity: SeverityLevel;
  sentAt: string;
  status: 'sent' | 'failed';
  error?: string;
  comments: CommentCardData[];
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/alerts');
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data);
      }
    } catch (err) {
      console.error('Error loading alerts history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Bell className="w-6 h-6 text-blue-400" />
              Alert History
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Log of aggregated Resend email alerts dispatched for new negative Reddit comments.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchAlerts}
          >
            Refresh Alerts
          </Button>
        </div>

        {/* Alerts Table */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading alert logs...</div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center border border-slate-800 rounded-xl bg-slate-900/40">
            <p className="text-sm text-slate-400">No email alerts sent yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Email alerts are triggered automatically when a crawl detects new meaningful negative comments.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/60">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Monitor</th>
                  <th className="py-3.5 px-4">Recipient Email</th>
                  <th className="py-3.5 px-4 text-center">Negative Comments</th>
                  <th className="py-3.5 px-4">Highest Severity</th>
                  <th className="py-3.5 px-4">Sent Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">View Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">{alert.monitorName}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-300 flex items-center gap-1.5 mt-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {alert.recipientEmail}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-red-400">
                      {alert.negativeCommentCount}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="severity" severity={alert.highestSeverity}>
                        {alert.highestSeverity}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(alert.sentAt).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {alert.status === 'sent' ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-400 font-semibold" title={alert.error}>
                          <AlertTriangle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => setSelectedAlert(alert)}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Alert Detail Modal */}
        <Modal
          isOpen={Boolean(selectedAlert)}
          onClose={() => setSelectedAlert(null)}
          title={`Alert Details: ${selectedAlert?.monitorName}`}
          description={`Dispatched on ${selectedAlert ? new Date(selectedAlert.sentAt).toLocaleString() : ''} to ${selectedAlert?.recipientEmail}`}
        >
          {selectedAlert && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                <span className="text-slate-400">Contains {selectedAlert.negativeCommentCount} negative comment(s)</span>
                <Badge variant="severity" severity={selectedAlert.highestSeverity}>
                  {selectedAlert.highestSeverity}
                </Badge>
              </div>

              <div className="space-y-3">
                {selectedAlert.comments?.map((comment) => (
                  <CommentCard key={comment._id} comment={comment} />
                ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}
