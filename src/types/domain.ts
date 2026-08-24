export type SentimentType = 'positive' | 'neutral' | 'negative' | 'mixed';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type FeedbackCategory =
  | 'product_quality'
  | 'pricing'
  | 'customer_support'
  | 'delivery'
  | 'technical_issue'
  | 'refund'
  | 'scam_fraud'
  | 'service_quality'
  | 'user_experience'
  | 'competitor_comparison'
  | 'general_complaint'
  | 'other';

export type PlatformType = 'reddit' | 'quora' | 'teamblind';

export interface InternalRedditComment {
  redditCommentId: string;
  postId: string;
  author: string | null;
  body: string;
  redditUrl: string | null;
  createdAt: Date | null;
  platform?: PlatformType;
}

export interface SentimentClassificationResult {
  redditCommentId: string;
  isNegative: boolean;
  sentiment: SentimentType;
  severity: SeverityLevel;
  category: FeedbackCategory;
  confidence: number;
  summary: string;
}

export interface IMonitor {
  _id: string;
  name: string;
  platform: PlatformType;
  redditPostId: string;
  redditUrl: string;
  subreddit?: string;
  postTitle?: string;
  recipientEmail: string;
  enabled: boolean;
  lastCheckedAt?: Date | string | null;
  lastCrawlStatus?: 'success' | 'failed' | 'running' | 'idle';
  crawlLockId?: string | null;
  crawlStartedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IComment {
  _id: string;
  platform: PlatformType;
  redditCommentId: string;
  monitorId: string;
  postId: string;
  author: string | null;
  body: string;
  redditUrl: string | null;
  redditCreatedAt: Date | string | null;
  processedAt: Date | string;

  isNegative: boolean;
  sentiment: SentimentType;
  severity: SeverityLevel;
  category: FeedbackCategory;
  confidence: number;
  summary: string;

  alertSent: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IAlert {
  _id: string;
  monitorId: string;
  commentIds: string[];
  recipientEmail: string;
  negativeCommentCount: number;
  highestSeverity: SeverityLevel;
  sentAt: Date | string;
  status: 'sent' | 'failed';
  error?: string | null;
  createdAt: Date | string;
}

export interface ICrawlLog {
  _id: string;
  monitorId: string;
  startedAt: Date | string;
  completedAt?: Date | string | null;
  commentsFetched: number;
  newComments: number;
  negativeComments: number;
  alertSent: boolean;
  status: 'running' | 'completed' | 'failed';
  error?: string | null;
  createdAt: Date | string;
}

export interface OverviewMetrics {
  activeMonitors: number;
  totalCommentsProcessed: number;
  totalNegativeComments: number;
  alertsSent: number;
}
