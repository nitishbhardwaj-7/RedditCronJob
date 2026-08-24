import { InternalRedditComment, SentimentClassificationResult, SeverityLevel, PlatformType } from '@/types/domain';

export interface AlertCommentCard {
  author: string | null;
  body: string;
  category: string;
  severity: SeverityLevel;
  confidence: number;
  summary: string;
  redditUrl: string | null;
}

export interface AlertEmailPayload {
  recipientEmail: string;
  monitorName: string;
  platform?: PlatformType;
  postTitle?: string;
  redditUrl: string;
  negativeCount: number;
  highestSeverity: SeverityLevel;
  comments: AlertCommentCard[];
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface RedditProvider {
  name: string;
  fetchComments(url: string, platform?: PlatformType): Promise<InternalRedditComment[]>;
}

export interface SentimentProvider {
  name: string;
  analyzeComments(comments: InternalRedditComment[]): Promise<SentimentClassificationResult[]>;
}

export interface EmailProvider {
  name: string;
  sendAlert(payload: AlertEmailPayload): Promise<EmailSendResult>;
}
