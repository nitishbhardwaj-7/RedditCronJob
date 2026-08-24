import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongodb';
import { CommentModel } from '@/models/Comment';
import { MonitorModel } from '@/models/Monitor';
import { FilterQuery } from 'mongoose';
import { ICommentDocument } from '@/models/Comment';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const monitorId = searchParams.get('monitorId');
    const platform = searchParams.get('platform');

    await dbConnect();

    const query: FilterQuery<ICommentDocument> = { isNegative: true };

    if (platform && platform !== 'all' && ['reddit', 'quora', 'teamblind'].includes(platform)) {
      query.platform = platform;
    }

    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (monitorId && monitorId !== 'all') {
      query.monitorId = monitorId;
    }

    if (search && search.trim().length > 0) {
      query.$or = [
        { body: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    const comments = await CommentModel.find(query).sort({ createdAt: -1 }).lean();

    // Populate monitor names and subreddits
    const monitors = await MonitorModel.find().lean();
    const monitorMap = new Map(monitors.map((m) => [m._id.toString(), m]));

    const enrichedComments = comments.map((c) => {
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
      data: enrichedComments,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
