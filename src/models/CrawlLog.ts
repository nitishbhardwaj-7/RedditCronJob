import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICrawlLogDocument extends Document {
  monitorId: mongoose.Types.ObjectId;
  startedAt: Date;
  completedAt?: Date | null;
  commentsFetched: number;
  newComments: number;
  negativeComments: number;
  alertSent: boolean;
  status: 'running' | 'completed' | 'failed';
  error?: string | null;
  createdAt: Date;
}

const CrawlLogSchema: Schema = new Schema(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true, index: true },
    startedAt: { type: Date, required: true, default: Date.now },
    completedAt: { type: Date, default: null },
    commentsFetched: { type: Number, default: 0 },
    newComments: { type: Number, default: 0 },
    negativeComments: { type: Number, default: 0 },
    alertSent: { type: Boolean, default: false },
    status: { type: String, enum: ['running', 'completed', 'failed'], required: true },
    error: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const CrawlLogModel: Model<ICrawlLogDocument> =
  mongoose.models.CrawlLog || mongoose.model<ICrawlLogDocument>('CrawlLog', CrawlLogSchema);
