import { z } from 'zod';
import { PlatformType } from '@/types/domain';

export const createMonitorSchema = z.object({
  name: z.string().min(2, 'Monitor name must be at least 2 characters').max(100),
  platform: z.enum(['reddit', 'quora', 'teamblind']).default('reddit'),
  redditUrl: z
    .string()
    .url('Invalid URL format')
    .refine((url) => {
      const lower = url.toLowerCase();
      return (
        lower.includes('reddit.com') ||
        lower.includes('quora.com') ||
        lower.includes('teamblind.com') ||
        lower.includes('blind.com')
      );
    }, 'Must be a valid Reddit, Quora, or Team Blind URL'),
  recipientEmail: z.string().email('Invalid alert email address'),
  enabled: z.boolean().default(true),
});

export const updateMonitorSchema = z.object({
  name: z.string().min(2, 'Monitor name must be at least 2 characters').max(100).optional(),
  platform: z.enum(['reddit', 'quora', 'teamblind']).optional(),
  recipientEmail: z.string().email('Invalid email address').optional(),
  enabled: z.boolean().optional(),
});

export const settingsSchema = z.object({
  geminiModel: z.string().min(1, 'Gemini model is required'),
  minConfidenceThreshold: z.number().min(0).max(1),
  minSeverityAlert: z.enum(['low', 'medium', 'high', 'critical']),
  defaultRecipientEmail: z.string().email('Invalid email address'),
});

export function detectPlatformFromUrl(url: string): PlatformType {
  const lower = url.toLowerCase();
  if (lower.includes('quora.com')) return 'quora';
  if (lower.includes('teamblind.com') || lower.includes('blind.com')) return 'teamblind';
  return 'reddit';
}

export function parseRedditUrl(url: string, targetPlatform?: PlatformType): { postId: string; subreddit?: string } {
  try {
    const platform = targetPlatform || detectPlatformFromUrl(url);
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    if (platform === 'quora') {
      const questionSlug = pathParts[0] || 'quora_question';
      return {
        postId: questionSlug.replace(/[^a-zA-Z0-9_-]/g, '_'),
        subreddit: 'Quora Topics',
      };
    }

    if (platform === 'teamblind') {
      const blindSlug = pathParts[pathParts.length - 1] || 'blind_post';
      return {
        postId: blindSlug.replace(/[^a-zA-Z0-9_-]/g, '_'),
        subreddit: 'Team Blind',
      };
    }

    // Default Reddit Parsing
    let subreddit: string | undefined;
    let postId: string | undefined;

    const rIndex = pathParts.findIndex((p) => p.toLowerCase() === 'r');
    if (rIndex !== -1 && pathParts[rIndex + 1]) {
      subreddit = `r/${pathParts[rIndex + 1]}`;
    }

    const commentsIndex = pathParts.findIndex((p) => p.toLowerCase() === 'comments');
    if (commentsIndex !== -1 && pathParts[commentsIndex + 1]) {
      postId = pathParts[commentsIndex + 1];
    }

    if (!postId) {
      const match = url.match(/\/comments\/([a-zA-Z0-9]+)/i);
      if (match && match[1]) {
        postId = match[1];
      }
    }

    return {
      postId: postId || 'unknown_post_id',
      subreddit: subreddit || 'Reddit',
    };
  } catch {
    return { postId: 'unknown_post_id' };
  }
}
