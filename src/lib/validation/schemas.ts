import { z } from 'zod';

export const REDDIT_URL_REGEX =
  /^https?:\/\/(www\.|new\.|old\.)?reddit\.com\/r\/([a-zA-Z0-9_]+)\/comments\/([a-zA-Z0-9]+)(\/[a-zA-Z0-9_]+\/?)?$/i;

export const createMonitorSchema = z.object({
  name: z.string().min(2, 'Monitor name must be at least 2 characters').max(100),
  redditUrl: z
    .string()
    .url('Invalid URL format')
    .refine((url) => {
      // Check if URL matches Reddit post pattern or standard reddit post URL format
      return (
        url.includes('reddit.com/r/') &&
        url.includes('/comments/')
      );
    }, 'Must be a valid Reddit post URL (e.g., https://www.reddit.com/r/example/comments/abc123/example_post/)'),
  recipientEmail: z.string().email('Invalid alert email address'),
  enabled: z.boolean().default(true),
});

export const updateMonitorSchema = z.object({
  name: z.string().min(2, 'Monitor name must be at least 2 characters').max(100).optional(),
  recipientEmail: z.string().email('Invalid email address').optional(),
  enabled: z.boolean().optional(),
});

export const settingsSchema = z.object({
  geminiModel: z.string().min(1, 'Gemini model is required'),
  minConfidenceThreshold: z.number().min(0).max(1),
  minSeverityAlert: z.enum(['low', 'medium', 'high', 'critical']),
  defaultRecipientEmail: z.string().email('Invalid email address'),
});

export function parseRedditUrl(url: string): { postId: string; subreddit?: string } {
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);

    // pathParts format: ['r', 'subreddit', 'comments', 'postId', 'slug']
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
      // Fallback: search for alphanumeric part after comments
      const match = url.match(/\/comments\/([a-zA-Z0-9]+)/i);
      if (match && match[1]) {
        postId = match[1];
      }
    }

    return {
      postId: postId || 'unknown_post_id',
      subreddit,
    };
  } catch {
    return { postId: 'unknown_post_id' };
  }
}
