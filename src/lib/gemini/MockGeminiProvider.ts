import { SentimentProvider } from '../providers/types';
import { InternalRedditComment, SentimentClassificationResult } from '@/types/domain';

export class MockGeminiProvider implements SentimentProvider {
  public name = 'Mock Gemini Sentiment Provider (Dev Mode)';

  public async analyzeComments(
    comments: InternalRedditComment[]
  ): Promise<SentimentClassificationResult[]> {
    console.log(`🤖 [MockGeminiProvider] Analyzing ${comments.length} mock comments...`);

    const results: SentimentClassificationResult[] = comments.map((comment) => {
      const text = comment.body.toLowerCase();

      // Test anti-prompt injection
      if (text.includes('ignore all previous instructions')) {
        return {
          redditCommentId: comment.redditCommentId,
          isNegative: false,
          sentiment: 'neutral',
          severity: 'low',
          category: 'other',
          confidence: 0.99,
          summary: 'User attempted prompt injection inside comment body (safely ignored).',
        };
      }

      // Check for refund / customer support / bug complaints
      if (text.includes('refund') || text.includes('charged twice')) {
        return {
          redditCommentId: comment.redditCommentId,
          isNegative: true,
          sentiment: 'negative',
          severity: 'high',
          category: 'refund',
          confidence: 0.96,
          summary: 'Customer reports an unresolved refund and double billing issue.',
        };
      }

      if (text.includes('support') || text.includes('ignored 4 of my tickets') || text.includes('doesn\'t work at all')) {
        return {
          redditCommentId: comment.redditCommentId,
          isNegative: true,
          sentiment: 'negative',
          severity: 'critical',
          category: 'customer_support',
          confidence: 0.95,
          summary: 'User reports non-functional premium features and unhelpful customer support.',
        };
      }

      if (text.includes('504 gateway timeout') || text.includes('peak load') || text.includes('api endpoint')) {
        return {
          redditCommentId: comment.redditCommentId,
          isNegative: true,
          sentiment: 'negative',
          severity: 'high',
          category: 'technical_issue',
          confidence: 0.92,
          summary: 'Enterprise user reports server timeouts during peak API usage.',
        };
      }

      // Memes / sarcasm without real complaint
      if (text.includes('lol this thing is terrible') || text.includes('😂')) {
        return {
          redditCommentId: comment.redditCommentId,
          isNegative: false,
          sentiment: 'mixed',
          severity: 'low',
          category: 'other',
          confidence: 0.45,
          summary: 'Casual meme or sarcastic comment without specific actionable complaint.',
        };
      }

      // Positive comments
      if (text.includes('great') || text.includes('loving') || text.includes('awesome')) {
        return {
          redditCommentId: comment.redditCommentId,
          isNegative: false,
          sentiment: 'positive',
          severity: 'low',
          category: 'user_experience',
          confidence: 0.98,
          summary: 'User praises the UI design and dark mode feature.',
        };
      }

      // Fallback
      return {
        redditCommentId: comment.redditCommentId,
        isNegative: false,
        sentiment: 'neutral',
        severity: 'low',
        category: 'other',
        confidence: 0.8,
        summary: 'General neutral commentary.',
      };
    });

    await new Promise((res) => setTimeout(res, 400));
    return results;
  }
}
