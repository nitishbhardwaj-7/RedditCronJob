import { Resend } from 'resend';
import { EmailProvider, AlertEmailPayload, EmailSendResult } from '../providers/types';
import { renderAlertEmailHtml } from './templates';

export class ResendEmailProvider implements EmailProvider {
  public name = 'Resend Email Provider';
  private client: Resend | null = null;
  private fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM || 'Reddit Alerts <onboarding@resend.dev>';
    if (apiKey) {
      this.client = new Resend(apiKey);
    }
  }

  public async sendAlert(payload: AlertEmailPayload): Promise<EmailSendResult> {
    if (!this.client) {
      throw new Error('RESEND_API_KEY is not configured in environment variables.');
    }

    const { recipientEmail, monitorName, negativeCount, highestSeverity } = payload;
    const subject = `🚨 [${highestSeverity.toUpperCase()}] ${negativeCount} New Negative Comment(s) - ${monitorName}`;
    const html = renderAlertEmailHtml(payload);

    try {
      console.log(`📧 Sending Resend email to ${recipientEmail}...`);
      const { data, error } = await this.client.emails.send({
        from: this.fromEmail,
        to: [recipientEmail],
        subject,
        html,
      });

      if (error) {
        console.error('❌ Resend API returned error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(`✅ Resend email sent successfully! Message ID: ${data?.id}`);
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('❌ Resend email sending failed:', msg);
      return {
        success: false,
        error: msg,
      };
    }
  }
}
