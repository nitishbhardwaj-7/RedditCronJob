'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { CommentCard } from '@/components/comments/CommentCard';
import {
  ArrowLeft,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Calendar,
} from 'lucide-react';
import { IMonitor, SeverityLevel, FeedbackCategory } from '@/types/domain';
import { CommentCardData } from '@/components/comments/CommentCard';

interface MonitorDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function MonitorDetailPage({ params }: MonitorDetailPageProps) {
  const { id } = use(params);

  const [monitor, setMonitor] = useState<IMonitor | null>(null);
  const [comments, setComments] = useState<CommentCardData[]>([]);
  const [stats, setStats] = useState({ totalComments: 0, negativeComments: 0 });

  const [isLoading, setIsLoading] = useState(true);
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlStepText, setCrawlStepText] = useState('');
  const [lastCrawlResult, setLastCrawlResult] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchMonitorDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/monitors/${id}`);
      const json = await res.json();
      if (json.success) {
        setMonitor(json.data);
        setStats({
          totalComments: json.data.totalComments,
          negativeComments: json.data.negativeComments,
        });
      }
    } catch (err) {
      console.error('Error loading monitor details:', err);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams();
      if (severityFilter !== 'all') queryParams.append('severity', severityFilter);
      if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);
      if (search.trim()) queryParams.append('search', search);

      const res = await fetch(`/api/monitors/${id}/comments?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setComments(json.data);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  }, [id, severityFilter, categoryFilter, search]);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await fetchMonitorDetails();
      await fetchComments();
      setIsLoading(false);
    };
    loadAll();
  }, [fetchMonitorDetails, fetchComments]);

  const handleManualCrawl = async () => {
    setIsCrawling(true);
    setLastCrawlResult(null);
    setCrawlStepText('Crawl started...');

    try {
      await new Promise((res) => setTimeout(res, 400));
      setCrawlStepText('Fetching Reddit comments...');

      const res = await fetch(`/api/monitors/${id}/check`, { method: 'POST' });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Crawl failed');
      }

      setCrawlStepText('Analyzing new comments with Gemini...');
      await new Promise((res) => setTimeout(res, 500));

      setCrawlStepText('Completed!');
      const data = json.data;
      setLastCrawlResult(
        `Crawl completed! Fetched ${data.commentsFetched} comments, ${data.newComments} new, ${data.negativeComments} negative feedback detected.`
      );

      await fetchMonitorDetails();
      await fetchComments();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLastCrawlResult(`Crawl failed: ${msg}`);
    } finally {
      setIsCrawling(false);
    }
  };

  if (isLoading && !monitor) {
    return (
      <AppLayout>
        <div className="py-20 text-center text-slate-400 text-sm">Loading monitor details...</div>
      </AppLayout>
    );
  }

  if (!monitor) {
    return (
      <AppLayout>
        <div className="py-20 text-center space-y-4">
          <p className="text-red-400 text-sm">Monitor not found.</p>
          <Link href="/monitors">
            <Button variant="outline" size="sm">Back to Monitors</Button>
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Navigation back */}
        <div>
          <Link
            href="/monitors"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Monitors</span>
          </Link>

          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-xl">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">{monitor.name}</h1>
                <Badge variant={monitor.enabled ? 'success' : 'default'}>
                  {monitor.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {monitor.subreddit || 'r/reddit'}
                </span>
                <a
                  href={monitor.redditUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>{monitor.redditUrl}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                isLoading={isCrawling}
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleManualCrawl}
              >
                Check Now
              </Button>
            </div>
          </div>
        </div>

        {/* Real-time Crawl Step Feedback */}
        {isCrawling && (
          <div className="p-4 bg-blue-950/40 border border-blue-800/60 rounded-xl text-xs text-blue-300 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping shrink-0"></span>
            <span className="font-mono">{crawlStepText}</span>
          </div>
        )}

        {lastCrawlResult && (
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-start gap-2">
            {lastCrawlResult.includes('failed') ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <span>{lastCrawlResult}</span>
          </div>
        )}

        {/* Monitor Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Total Comments</span>
            <span className="text-2xl font-bold font-mono text-white mt-1 block">
              {stats.totalComments}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Negative Feedback</span>
            <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
              {stats.negativeComments}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Recipient Email</span>
            <span className="text-xs font-mono text-slate-200 mt-2 truncate block flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {monitor.recipientEmail}
            </span>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Last Checked</span>
            <span className="text-xs text-slate-200 mt-2 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {monitor.lastCheckedAt ? new Date(monitor.lastCheckedAt).toLocaleString() : 'Never'}
            </span>
          </div>
        </div>

        {/* Filter bar */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
            <div className="max-w-md w-full">
              <Input
                placeholder="Search comments by keyword..."
                icon={<Search className="w-4 h-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" />
                <span>Severity:</span>
              </div>
              <select
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="product_quality">Product Quality</option>
                <option value="pricing">Pricing</option>
                <option value="customer_support">Customer Support</option>
                <option value="delivery">Delivery</option>
                <option value="technical_issue">Technical Issue</option>
                <option value="refund">Refund</option>
                <option value="scam_fraud">Scam / Fraud</option>
                <option value="service_quality">Service Quality</option>
                <option value="user_experience">User Experience</option>
                <option value="competitor_comparison">Competitor Comparison</option>
                <option value="general_complaint">General Complaint</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Comments Feed */}
          {comments.length === 0 ? (
            <div className="py-16 text-center border border-slate-800 rounded-xl bg-slate-900/40">
              <p className="text-sm text-slate-400">No comments match the selected filters.</p>
              <p className="text-xs text-slate-500 mt-1">Try resetting severity/category filters or trigger a new crawl.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comments.map((comment) => (
                <CommentCard key={comment._id} comment={{ ...comment, monitorName: monitor.name, subreddit: monitor.subreddit }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
