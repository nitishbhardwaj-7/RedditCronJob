import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMonitorDocument extends Document {
  name: string;
  redditPostId: string;
  redditUrl: string;
  subreddit?: string;
  postTitle?: string;
  recipientEmail: string;
  enabled: boolean;
  lastCheckedAt?: Date | null;
  lastCrawlStatus?: 'success' | 'failed' | 'running' | 'idle';
  crawlLockId?: string | null;
  crawlStartedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MonitorSchema: Schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    redditPostId: { type: String, required: true, index: true },
    redditUrl: { type: String, required: true, trim: true },
    subreddit: { type: String, trim: true },
    postTitle: { type: String, trim: true },
    recipientEmail: { type: String, required: true, trim: true, lowercase: true },
    enabled: { type: Boolean, default: true, index: true },
    lastCheckedAt: { type: Date, default: null },
    lastCrawlStatus: {
      type: String,
      enum: ['success', 'failed', 'running', 'idle'],
      default: 'idle',
    },
    crawlLockId: { type: String, default: null },
    crawlStartedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const MonitorModel: Model<IMonitorDocument> =
  mongoose.models.Monitor || mongoose.model<IMonitorDocument>('Monitor', MonitorSchema);
