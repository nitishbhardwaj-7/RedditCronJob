import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { SentimentProvider } from '../providers/types';
import { InternalRedditComment, SentimentClassificationResult } from '@/types/domain';
import { GEMINI_SYSTEM_INSTRUCTION, buildBatchPrompt } from './prompts';

const SingleResultSchema = z.object({
  redditCommentId: z.string(),
  isNegative: z.boolean(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed']).catch('neutral'),
  severity: z.enum(['low', 'medium', 'high', 'critical']).catch('low'),
  category: z
    .enum([
      'product_quality',
      'pricing',
      'customer_support',
      'delivery',
      'technical_issue',
      'refund',
      'scam_fraud',
      'service_quality',
      'user_experience',
      'competitor_comparison',
      'general_complaint',
      'other',
    ])
    .catch('other'),
  confidence: z.number().min(0).max(1).catch(0.5),
  summary: z.string().catch('No summary provided'),
});

const BatchResponseSchema = z.array(SingleResultSchema);

export class GeminiSentimentProvider implements SentimentProvider {
  public name = 'Google Gemini Sentiment Provider';
  private ai: GoogleGenerativeAI | null = null;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey) {
      this.ai = new GoogleGenerativeAI(apiKey);
    }
  }

  public async analyzeComments(
    comments: InternalRedditComment[]
  ): Promise<SentimentClassificationResult[]> {
    if (!this.ai) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    if (comments.length === 0) {
      return [];
    }

    console.log(`🤖 [GeminiSentimentProvider] Batch analyzing ${comments.length} comments using model [${this.modelName}]...`);

    const model = this.ai.getGenerativeModel({
      model: this.modelName,
      systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1, // Low temperature for deterministic classification
      },
    });

    const payload = comments.map((c) => ({
      redditCommentId: c.redditCommentId,
      body: c.body,
    }));

    const prompt = buildBatchPrompt(payload);

    try {
      const response = await model.generateContent(prompt);
      const text = response.response.text();

      // Clean Markdown formatting if present
      const cleanedText = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsedJson = JSON.parse(cleanedText);
      const validatedResults = BatchResponseSchema.parse(parsedJson);

      console.log(`✅ [GeminiSentimentProvider] Successfully classified ${validatedResults.length} comments`);
      return validatedResults;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('❌ Gemini classification error:', msg);

      // Fallback: Return default neutral classification if API fails so pipeline doesn't crash
      return comments.map((c) => ({
        redditCommentId: c.redditCommentId,
        isNegative: false,
        sentiment: 'neutral',
        severity: 'low',
        category: 'other',
        confidence: 0.5,
        summary: 'Error during AI sentiment analysis fallback',
      }));
    }
  }
}
