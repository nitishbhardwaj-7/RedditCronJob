import { AlertEmailPayload } from '../providers/types';

export function renderAlertEmailHtml(payload: AlertEmailPayload): string {
  const { monitorName, platform = 'reddit', postTitle, redditUrl, negativeCount, highestSeverity, comments } = payload;
  const platformName = platform === 'quora' ? 'Quora' : platform === 'teamblind' ? 'Team Blind' : 'Reddit';

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'medium':
        return '#d97706';
      default:
        return '#2563eb';
    }
  };

  const commentCardsHtml = comments
    .map(
      (c) => `
    <div style="background-color: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="color: #94a3b8; font-size: 13px; font-weight: 600;">@${c.author || 'anonymous'}</span>
        <div>
          <span style="background-color: #334155; color: #cbd5e1; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-right: 6px; text-transform: uppercase; font-weight: 600;">${c.category.replace('_', ' ')}</span>
          <span style="background-color: ${getSeverityColor(c.severity)}; color: #ffffff; font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: bold; text-transform: uppercase;">${c.severity}</span>
        </div>
      </div>
      <p style="color: #f1f5f9; font-size: 14px; line-height: 1.5; margin: 8px 0; background-color: #0f172a; padding: 12px; border-radius: 6px; border-left: 3px solid ${getSeverityColor(c.severity)}; font-style: italic;">
        "${c.body.replace(/"/g, '&quot;')}"
      </p>
      <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #94a3b8; font-size: 12px;"><strong>AI Summary:</strong> ${c.summary} (Confidence: ${(c.confidence * 100).toFixed(0)}%)</span>
        ${
          c.redditUrl
            ? `<a href="${c.redditUrl}" target="_blank" style="color: #3b82f6; font-size: 12px; text-decoration: none; font-weight: bold;">View on ${platformName} &rarr;</a>`
            : ''
        }
      </div>
    </div>
  `
    )
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚨 New Negative ${platformName} Feedback</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 640px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 24px; border: 1px solid #334155;">
      
      <div style="border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #ef4444; font-size: 20px; margin: 0 0 6px 0; display: flex; align-items: center; gap: 8px;">
          🚨 New Negative ${platformName} Feedback Detected
        </h1>
        <p style="color: #94a3b8; font-size: 14px; margin: 0;">
          Monitor: <strong style="color: #f1f5f9;">${monitorName}</strong> | Platform: <strong style="color: #60a5fa;">${platformName}</strong>
        </p>
      </div>

      <div style="background-color: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 20px; border: 1px solid #334155;">
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #94a3b8;">TARGET REDDIT POST:</p>
        <p style="margin: 0; font-size: 14px; font-weight: 600;">
          <a href="${redditUrl}" target="_blank" style="color: #60a5fa; text-decoration: none;">${postTitle || redditUrl}</a>
        </p>
      </div>

      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <div style="background-color: #334155; padding: 10px 16px; border-radius: 6px; flex: 1;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Negative Comments</div>
          <div style="font-size: 20px; font-weight: bold; color: #ef4444;">${negativeCount}</div>
        </div>
        <div style="background-color: #334155; padding: 10px 16px; border-radius: 6px; flex: 1;">
          <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Highest Severity</div>
          <div style="font-size: 18px; font-weight: bold; color: ${getSeverityColor(highestSeverity)}; text-transform: uppercase;">${highestSeverity}</div>
        </div>
      </div>

      <h3 style="color: #cbd5e1; font-size: 16px; margin: 0 0 14px 0; font-weight: 600;">New Negative Comments:</h3>
      
      ${commentCardsHtml}

      <div style="border-top: 1px solid #334155; margin-top: 24px; padding-top: 16px; text-align: center; color: #64748b; font-size: 12px;">
        Reddit Scraper Monitoring SaaS • Automated Alert System
      </div>
    </div>
  </body>
  </html>
  `;
}
