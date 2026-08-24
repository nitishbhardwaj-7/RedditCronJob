import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongodb';
import { MonitorModel } from '@/models/Monitor';
import { CommentModel } from '@/models/Comment';
import { createMonitorSchema, parseRedditUrl } from '@/lib/validation/schemas';
import { processMonitorCrawl } from '@/lib/monitoring/pipeline';

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');

    const filter: Record<string, any> = {};
    if (platform && ['reddit', 'quora', 'teamblind'].includes(platform)) {
      filter.platform = platform;
    }

    const monitors = await MonitorModel.find(filter).sort({ createdAt: -1 }).lean();

    // Attach comment counts and negative counts for each monitor
    const monitorData = await Promise.all(
      monitors.map(async (m) => {
        const totalComments = await CommentModel.countDocuments({ monitorId: m._id });
        const negativeComments = await CommentModel.countDocuments({
          monitorId: m._id,
          isNegative: true,
        });

        return {
          ...m,
          _id: m._id.toString(),
          totalComments,
          negativeComments,
        };
      })
    );

    return NextResponse.json({ success: true, data: monitorData });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = createMonitorSchema.parse(body);

    await dbConnect();

    const platform = validated.platform || 'reddit';
    const { postId, subreddit } = parseRedditUrl(validated.redditUrl, platform);

    // Create monitor record
    const monitor = new MonitorModel({
      name: validated.name,
      platform: platform,
      redditPostId: postId,
      redditUrl: validated.redditUrl,
      subreddit: subreddit || (platform === 'quora' ? 'Quora Topics' : platform === 'teamblind' ? 'Team Blind' : 'r/reddit'),
      recipientEmail: validated.recipientEmail,
      enabled: validated.enabled ?? true,
      lastCrawlStatus: 'idle',
    });

    await monitor.save();
    console.log(`✨ Created new monitor: ${monitor.name} [ID: ${monitor._id}]`);

    // Trigger initial crawl immediately after creation
    let crawlResult = null;
    let crawlError = null;

    try {
      crawlResult = await processMonitorCrawl(monitor._id.toString());
    } catch (err: unknown) {
      crawlError = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ Initial crawl encountered an issue:`, crawlError);
    }

    const reFetchedMonitor = await MonitorModel.findById(monitor._id).lean();

    return NextResponse.json({
      success: true,
      data: {
        monitor: {
          ...reFetchedMonitor,
          _id: monitor._id.toString(),
        },
        initialCrawl: crawlResult,
        crawlError,
      },
      message: 'Monitor created successfully and initial crawl triggered',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
