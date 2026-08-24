import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongodb';
import { CrawlLogModel } from '@/models/CrawlLog';
import { MonitorModel } from '@/models/Monitor';

export async function GET() {
  try {
    await dbConnect();
    const logs = await CrawlLogModel.find().sort({ createdAt: -1 }).limit(100).lean();
    const monitors = await MonitorModel.find().lean();
    const monitorMap = new Map(monitors.map((m) => [m._id.toString(), m.name]));

    const enrichedLogs = logs.map((log) => ({
      ...log,
      _id: log._id.toString(),
      monitorId: log.monitorId.toString(),
      monitorName: monitorMap.get(log.monitorId.toString()) || 'Unknown Monitor',
    }));

    return NextResponse.json({ success: true, data: enrichedLogs });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
