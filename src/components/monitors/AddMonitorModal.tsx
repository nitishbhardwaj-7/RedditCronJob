'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Radio, Mail, Link as LinkIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { createMonitorSchema } from '@/lib/validation/schemas';

interface AddMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddMonitorModal: React.FC<AddMonitorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<'reddit' | 'quora' | 'teamblind'>('reddit');
  const [redditUrl, setRedditUrl] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [enabled, setEnabled] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [crawlStatusText, setCrawlStatusText] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setSuccessInfo(null);

    // Validate with Zod
    const validation = createMonitorSchema.safeParse({
      name,
      platform,
      redditUrl,
      recipientEmail,
      enabled,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setCrawlStatusText('Saving monitor settings...');

    try {
      setCrawlStatusText(`Running initial crawl via ${platform.toUpperCase()} scraper...`);
      const response = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validation.data),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create monitor');
      }

      setCrawlStatusText('Analyzing initial comments with Gemini AI...');
      await new Promise((res) => setTimeout(res, 500));

      const initialCrawl = data.data.initialCrawl;
      if (initialCrawl) {
        setSuccessInfo(
          `Monitor created! Crawled ${initialCrawl.commentsFetched} comment(s), found ${initialCrawl.negativeComments} negative comment(s).`
        );
      } else {
        setSuccessInfo('Monitor created successfully!');
      }

      setTimeout(() => {
        setIsLoading(false);
        onClose();
        // Reset form
        setName('');
        setPlatform('reddit');
        setRedditUrl('');
        setRecipientEmail('');
        setSuccessInfo(null);
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: unknown) {
      setIsLoading(false);
      const msg = err instanceof Error ? err.message : String(err);
      setServerError(msg);
    }
  };

  const urlPlaceholder =
    platform === 'quora'
      ? 'https://www.quora.com/What-are-the-biggest-complaints-about-XYZ-product'
      : platform === 'teamblind'
      ? 'https://www.us.teamblind.com/post/XYZ-Company-Discussion-thread-12345'
      : 'https://www.reddit.com/r/example/comments/abc123/example_post/';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Brand Monitor"
      description="Select a platform and URL to track negative comments automatically."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-lg text-xs text-red-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {successInfo && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span>{successInfo}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Platform
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPlatform('reddit')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                platform === 'reddit'
                  ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 font-semibold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔥</span> Reddit
            </button>
            <button
              type="button"
              onClick={() => setPlatform('quora')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                platform === 'quora'
                  ? 'bg-red-500/20 border-red-500/50 text-red-300 font-semibold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>❓</span> Quora
            </button>
            <button
              type="button"
              onClick={() => setPlatform('teamblind')}
              className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                platform === 'teamblind'
                  ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 font-semibold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>👁️</span> Team Blind
            </button>
          </div>
        </div>

        <Input
          label="Monitor Name"
          placeholder="e.g. Brand Feedback Monitor"
          icon={<Radio className="w-4 h-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          disabled={isLoading}
        />

        <Input
          label={`${platform.toUpperCase()} Post/Thread URL`}
          placeholder={urlPlaceholder}
          icon={<LinkIcon className="w-4 h-4" />}
          value={redditUrl}
          onChange={(e) => setRedditUrl(e.target.value)}
          error={errors.redditUrl}
          helperText={`Must be a direct link to a ${platform} post or question thread.`}
          disabled={isLoading}
        />

        <Input
          label="Alert Email Address"
          placeholder="alerts@yourcompany.com"
          type="email"
          icon={<Mail className="w-4 h-4" />}
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          error={errors.recipientEmail}
          helperText="Email recipient for new negative feedback alerts."
          disabled={isLoading}
        />

        <div className="flex items-center justify-between pt-2 pb-1 border-t border-slate-800">
          <div>
            <span className="text-xs font-medium text-slate-300 uppercase tracking-wider block">
              Hourly Monitoring Status
            </span>
            <span className="text-xs text-slate-500">Automatically crawl every 1 hour</span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="sr-only peer"
              disabled={isLoading}
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {isLoading && crawlStatusText && (
          <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-lg text-xs text-blue-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
            <span>{crawlStatusText}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isLoading}>
            Start Monitoring
          </Button>
        </div>
      </form>
    </Modal>
  );
};
