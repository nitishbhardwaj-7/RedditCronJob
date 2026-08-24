import { EmailProvider, AlertEmailPayload, EmailSendResult } from '../providers/types';

export class MockEmailProvider implements EmailProvider {
  public name = 'Mock Email Provider (Dev Mode)';

  public async sendAlert(payload: AlertEmailPayload): Promise<EmailSendResult> {
    console.log('\n==================================================');
    console.log(`📧 [MockEmailProvider] SIMULATED EMAIL ALERT SENT`);
    console.log(`TO: ${payload.recipientEmail}`);
    console.log(`MONITOR: ${payload.monitorName}`);
    console.log(`NEGATIVE COMMENTS: ${payload.negativeCount} (Highest Severity: ${payload.highestSeverity.toUpperCase()})`);
    console.log(`POST LINK: ${payload.redditUrl}`);
    console.log('COMMENTS SUMMARY:');
    payload.comments.forEach((c, idx) => {
      console.log(`  ${idx + 1}. u/${c.author || 'anon'} [${c.severity.toUpperCase()} / ${c.category}]: "${c.body.slice(0, 60)}..."`);
    });
    console.log('==================================================\n');

    await new Promise((res) => setTimeout(res, 300));

    return {
      success: true,
      messageId: `mock_msg_${Date.now()}`,
    };
  }
}
