import { IMonitor, IComment, IAlert, ICrawlLog, OverviewMetrics } from './domain';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface CreateMonitorInput {
  name: string;
  redditUrl: string;
  recipientEmail: string;
  enabled?: boolean;
}

export interface UpdateMonitorInput {
  name?: string;
  recipientEmail?: string;
  enabled?: boolean;
}

export interface CrawlResultData {
  monitorId: string;
  commentsFetched: number;
  newComments: number;
  negativeComments: number;
  alertSent: boolean;
  crawlLogId: string;
}

export interface OverviewData {
  metrics: OverviewMetrics;
  recentActivity: Array<{
    monitor: IMonitor;
    lastChecked?: string | null;
    newComments: number;
    negativeComments: number;
    status: string;
  }>;
  recentNegativeComments: Array<IComment & { monitorName?: string; subreddit?: string }>;
}

export interface IntegrationStatus {
  mongodb: 'connected' | 'not_configured' | 'error';
  apify: 'connected' | 'not_configured' | 'error';
  gemini: 'connected' | 'not_configured' | 'error';
  resend: 'connected' | 'not_configured' | 'error';
  isMockMode: boolean;
}
