import React from 'react';
import { Badge } from '../ui/Badge';
import { ExternalLink, User, Calendar, Sparkles } from 'lucide-react';
import { SeverityLevel, SentimentType, FeedbackCategory } from '@/types/domain';

export interface CommentCardData {
  _id: string;
  platform?: 'reddit' | 'quora' | 'teamblind';
  redditCommentId: string;
  author: string | null;
  body: string;
  redditUrl: string | null;
  redditCreatedAt?: string | Date | null;
  createdAt: string | Date;

  isNegative: boolean;
  sentiment: SentimentType;
  severity: SeverityLevel;
  category: FeedbackCategory;
  confidence: number;
  summary: string;

  monitorName?: string;
  subreddit?: string;
}

interface CommentCardProps {
  comment: CommentCardData;
}

export const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  const formattedDate = new Date(comment.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const platform = comment.platform || 'reddit';
  const platformName = platform === 'quora' ? 'Quora' : platform === 'teamblind' ? 'Team Blind' : 'Reddit';
  const platformIcon = platform === 'quora' ? '❓' : platform === 'teamblind' ? '👁️' : '🔥';

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between shadow-sm">
      <div>
        {/* Top bar with Author, Subreddit & Severity */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="font-semibold text-slate-200 flex items-center gap-1 bg-slate-800/80 px-2 py-0.5 rounded">
              <User className="w-3 h-3 text-slate-400" />
              @{comment.author || 'anonymous'}
            </span>
            <span className="font-mono text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60 flex items-center gap-1">
              <span>{platformIcon}</span> {platformName}
            </span>
            {comment.monitorName && (
              <span className="text-slate-400 truncate max-w-[150px]">
                via <span className="text-slate-300 font-medium">{comment.monitorName}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="severity" severity={comment.severity}>
              {comment.severity}
            </Badge>
          </div>
        </div>

        {/* Comment Content */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3.5 mb-3 text-sm text-slate-200 leading-relaxed font-sans border-l-4 border-l-red-500/80">
          &ldquo;{comment.body}&rdquo;
        </div>

        {/* AI Insight Section */}
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-lg p-3 text-xs text-blue-200/90 mb-4 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-blue-400">AI Summary</span>
              <span className="text-[10px] font-mono text-slate-400">
                Confidence: <strong className="text-blue-300">{(comment.confidence * 100).toFixed(0)}%</strong>
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-snug">{comment.summary}</p>
          </div>
        </div>
      </div>

      {/* Footer Info & External Link */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm" className="capitalize">
            {comment.category.replace('_', ' ')}
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="w-3 h-3 text-slate-500" />
            {formattedDate}
          </span>
        </div>

        {comment.redditUrl ? (
          <a
            href={comment.redditUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            <span>View on {platformName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="text-slate-500 text-[11px]">Permalink unavailable</span>
        )}
      </div>
    </div>
  );
};
