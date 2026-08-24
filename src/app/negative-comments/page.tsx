'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { CommentCard, CommentCardData } from '@/components/comments/CommentCard';
import { Search, Filter, MessageSquareWarning, RefreshCw } from 'lucide-react';

export default function NegativeCommentsPage() {
  const [comments, setComments] = useState<CommentCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const fetchNegativeComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (platformFilter !== 'all') queryParams.append('platform', platformFilter);
      if (severityFilter !== 'all') queryParams.append('severity', severityFilter);
      if (categoryFilter !== 'all') queryParams.append('category', categoryFilter);
      if (search.trim()) queryParams.append('search', search);

      const res = await fetch(`/api/comments/negative?${queryParams.toString()}`);
      const json = await res.json();
      if (json.success) {
        setComments(json.data);
      }
    } catch (err) {
      console.error('Error loading negative comments:', err);
    } finally {
      setIsLoading(false);
    }
  }, [platformFilter, severityFilter, categoryFilter, search]);

  useEffect(() => {
    fetchNegativeComments();
  }, [fetchNegativeComments]);

  const platformTabs = [
    { id: 'all', label: 'All Platforms', icon: '🌐' },
    { id: 'reddit', label: 'Reddit', icon: '🔥' },
    { id: 'quora', label: 'Quora', icon: '❓' },
    { id: 'teamblind', label: 'Team Blind', icon: '👁️' },
  ];

  const severityTabs = [
    { id: 'all', label: 'All Severities' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <MessageSquareWarning className="w-6 h-6 text-red-400" />
              Negative Feedback Feed
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Global repository of negative comments classified by Gemini AI across Reddit, Quora, and Team Blind.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            isLoading={isLoading}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={fetchNegativeComments}
          >
            Refresh Feed
          </Button>
        </div>

        {/* Platform & Severity Filter Tabs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            {platformTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPlatformFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  platformFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {severityTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSeverityFilter(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  severityFilter === tab.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
          <div className="max-w-md w-full">
            <Input
              placeholder="Search negative comments by text or user..."
              icon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
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

        {/* Comments Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading negative comments...</div>
        ) : comments.length === 0 ? (
          <div className="py-16 text-center border border-slate-800 rounded-xl bg-slate-900/40">
            <p className="text-sm text-slate-400">No negative comments match the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comments.map((comment) => (
              <CommentCard key={comment._id} comment={comment} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
