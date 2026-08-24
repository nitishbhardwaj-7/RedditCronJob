import mongoose, { Schema, Document, Model } from 'mongoose';
import { SeverityLevel } from '@/types/domain';

export interface IAlertDocument extends Document {
  monitorId: mongoose.Types.ObjectId;
  commentIds: mongoose.Types.ObjectId[];
  recipientEmail: string;
  negativeCommentCount: number;
  highestSeverity: SeverityLevel;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string | null;
  createdAt: Date;
}

const AlertSchema: Schema = new Schema(
  {
    monitorId: { type: Schema.Types.ObjectId, ref: 'Monitor', required: true, index: true },
    commentIds: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    recipientEmail: { type: String, required: true },
    negativeCommentCount: { type: Number, required: true },
    highestSeverity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
    },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['sent', 'failed'], required: true },
    error: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const AlertModel: Model<IAlertDocument> =
  mongoose.models.Alert || mongoose.model<IAlertDocument>('Alert', AlertSchema);
