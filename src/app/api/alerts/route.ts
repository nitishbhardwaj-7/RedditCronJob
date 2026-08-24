import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongodb';
import { AlertModel } from '@/models/Alert';
import { MonitorModel } from '@/models/Monitor';
import { CommentModel } from '@/models/Comment';

export async function GET() {
  try {
    await dbConnect();
    const alerts = await AlertModel.find().sort({ createdAt: -1 }).lean();

    const monitors = await MonitorModel.find().lean();
    const monitorMap = new Map(monitors.map((m) => [m._id.toString(), m]));

    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert) => {
        const mon = monitorMap.get(alert.monitorId.toString());
        const comments = await CommentModel.find({ _id: { $in: alert.commentIds } }).lean();

        return {
          ...alert,
          _id: alert._id.toString(),
          monitorId: alert.monitorId.toString(),
          monitorName: mon?.name || 'Unknown Monitor',
          redditUrl: mon?.redditUrl || '',
          comments: comments.map((c) => ({
            ...c,
            _id: c._id.toString(),
            monitorId: c.monitorId.toString(),
          })),
        };
      })
    );

    return NextResponse.json({ success: true, data: enrichedAlerts });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
