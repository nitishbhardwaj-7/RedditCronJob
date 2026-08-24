import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongodb';
import { MonitorModel } from '@/models/Monitor';
import { CommentModel } from '@/models/Comment';
import { AlertModel } from '@/models/Alert';

export async function GET() {
  try {
    await dbConnect();

    // 1. Overview metrics
    const activeMonitors = await MonitorModel.countDocuments({ enabled: true });
    const totalCommentsProcessed = await CommentModel.countDocuments();
    const totalNegativeComments = await CommentModel.countDocuments({ isNegative: true });
    const alertsSent = await AlertModel.countDocuments({ status: 'sent' });

    // 2. Recent Activity Table Data
    const monitors = await MonitorModel.find().sort({ updatedAt: -1 }).limit(10).lean();
    const recentActivity = await Promise.all(
      monitors.map(async (m) => {
        const newComments = await CommentModel.countDocuments({ monitorId: m._id });
        const negativeComments = await CommentModel.countDocuments({
          monitorId: m._id,
          isNegative: true,
        });

        return {
          monitor: {
            ...m,
            _id: m._id.toString(),
          },
          lastChecked: m.lastCheckedAt ? m.lastCheckedAt.toISOString() : null,
          newComments,
          negativeComments,
          status: m.lastCrawlStatus || 'idle',
        };
      })
    );

    // 3. Recent Negative Comments Grid Data
    const rawNegativeComments = await CommentModel.find({ isNegative: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const allMonitors = await MonitorModel.find().lean();
    const monitorMap = new Map(allMonitors.map((m) => [m._id.toString(), m]));

    const recentNegativeComments = rawNegativeComments.map((c) => {
      const mon = monitorMap.get(c.monitorId.toString());
      return {
        ...c,
        _id: c._id.toString(),
        monitorId: c.monitorId.toString(),
        monitorName: mon?.name || 'Unknown Monitor',
        subreddit: mon?.subreddit || 'r/reddit',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        metrics: {
          activeMonitors,
          totalCommentsProcessed,
          totalNegativeComments,
          alertsSent,
        },
        recentActivity,
        recentNegativeComments,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
