import { RedditProvider, SentimentProvider, EmailProvider } from './types';
import { ApifyRedditProvider } from '../apify/ApifyRedditProvider';
import { MockRedditProvider } from '../apify/MockRedditProvider';
import { GeminiSentimentProvider } from '../gemini/GeminiSentimentProvider';
import { MockGeminiProvider } from '../gemini/MockGeminiProvider';
import { ResendEmailProvider } from '../email/ResendEmailProvider';
import { MockEmailProvider } from '../email/MockEmailProvider';

export function getRedditProvider(): RedditProvider {
  if (process.env.APIFY_API_TOKEN && process.env.APIFY_API_TOKEN.trim().length > 0) {
    return new ApifyRedditProvider();
  }
  return new MockRedditProvider();
}

export function getSentimentProvider(): SentimentProvider {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) {
    return new GeminiSentimentProvider();
  }
  return new MockGeminiProvider();
}

export function getEmailProvider(): EmailProvider {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim().length > 0) {
    return new ResendEmailProvider();
  }
  return new MockEmailProvider();
}

export function getIntegrationStatuses() {
  const hasMongo = Boolean(process.env.MONGODB_URI);
  const hasApify = Boolean(process.env.APIFY_API_TOKEN && process.env.APIFY_API_TOKEN.length > 5);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.length > 5);

  const isMockMode = !hasApify || !hasGemini || !hasResend;

  return {
    mongodb: hasMongo ? ('connected' as const) : ('not_configured' as const),
    apify: hasApify ? ('connected' as const) : ('not_configured' as const),
    gemini: hasGemini ? ('connected' as const) : ('not_configured' as const),
    resend: hasResend ? ('connected' as const) : ('not_configured' as const),
    isMockMode,
  };
}
