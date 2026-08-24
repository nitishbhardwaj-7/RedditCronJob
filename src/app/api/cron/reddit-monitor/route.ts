import { NextResponse } from 'next/server';
import { processAllEnabledMonitors } from '@/lib/monitoring/pipeline';

export async function POST(req: Request) {
  return handleCron(req);
}

export async function GET(req: Request) {
  return handleCron(req);
}

async function handleCron(req: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const { searchParams } = new URL(req.url);
    const tokenQuery = searchParams.get('secret');

    // Authenticate Cron Secret
    if (cronSecret && cronSecret.length > 0) {
      const isBearerValid = authHeader === `Bearer ${cronSecret}`;
      const isQueryValid = tokenQuery === cronSecret;

      if (!isBearerValid && !isQueryValid) {
        console.warn('⚠️ Unauthorized cron request attempt');
        return NextResponse.json({ success: false, error: 'Unauthorized: Invalid CRON_SECRET token' }, { status: 401 });
      }
    }

    console.log('⏰ Hourly Cron Execution Triggered');
    const results = await processAllEnabledMonitors();

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} enabled monitor(s)`,
      data: results,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Cron execution error:', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
