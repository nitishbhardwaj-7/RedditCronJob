import mongoose, { Schema, Document, Model } from 'mongoose';
import { SentimentType, SeverityLevel, FeedbackCategory, PlatformType } from '@/types/domain';

export interface ICommentDocument extends Document {
  platform: PlatformType;
  redditCommentId: string;
  monitorId: mongoose.Types.ObjectId;
  postId: string;
  author: string | null;
  body: string;
  redditUrl: string | null;
  redditCreatedAt: Date | null;
  processedAt: Date;

  isNegative: boolean;
  sentiment: SentimentType;
  severity: SeverityLevel;
  category: FeedbackCategory;
  confidence: number;
  summary: string;

  alertSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema: Schema = new Schema(
  {
    platform: {
      type: String,
      enum: ['reddit', 'quora', 'teamblind'],
      default: 'reddit',
      index: true,
    },
    redditCommentId: { type: String, required: true },
    monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true, index: true },
    postId: { type: String, required: true, index: true },
    author: { type: String, default: null },
    body: { type: String, required: true },
    redditUrl: { type: String, default: null },
    redditCreatedAt: { type: Date, default: null },
    processedAt: { type: Date, default: Date.now },

    isNegative: { type: Boolean, required: true, index: true },
    sentiment: {
      type: String,
      enum: ['positive', 'neutral', 'negative', 'mixed'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    summary: { type: String, required: true },

    alertSent: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: true,
  }
);

// Compound index enforcing uniqueness per monitor + comment
CommentSchema.index({ monitorId: 1, redditCommentId: 1 }, { unique: true });
CommentSchema.index({ createdAt: -1 });

export const CommentModel: Model<ICommentDocument> =
  mongoose.models.Comment || mongoose.model<ICommentDocument>('Comment', CommentSchema);
