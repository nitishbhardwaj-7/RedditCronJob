import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongodb';
import { MonitorModel } from '@/models/Monitor';
import { CommentModel } from '@/models/Comment';
import { CrawlLogModel } from '@/models/CrawlLog';
import { updateMonitorSchema } from '@/lib/validation/schemas';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await dbConnect();

    const monitor = await MonitorModel.findById(id).lean();
    if (!monitor) {
      return NextResponse.json({ success: false, error: 'Monitor not found' }, { status: 404 });
    }

    const totalComments = await CommentModel.countDocuments({ monitorId: id });
    const negativeComments = await CommentModel.countDocuments({
      monitorId: id,
      isNegative: true,
    });
    const lastCrawlLog = await CrawlLogModel.findOne({ monitorId: id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        ...monitor,
        _id: monitor._id.toString(),
        totalComments,
        negativeComments,
        lastCrawlLog,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = updateMonitorSchema.parse(body);

    await dbConnect();

    const monitor = await MonitorModel.findByIdAndUpdate(id, { $set: validated }, { new: true });
    if (!monitor) {
      return NextResponse.json({ success: false, error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...monitor.toObject(),
        _id: monitor._id.toString(),
      },
      message: 'Monitor updated successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await dbConnect();

    const monitor = await MonitorModel.findByIdAndDelete(id);
    if (!monitor) {
      return NextResponse.json({ success: false, error: 'Monitor not found' }, { status: 404 });
    }

    // Clean up associated comments and crawl logs
    await CommentModel.deleteMany({ monitorId: id });
    await CrawlLogModel.deleteMany({ monitorId: id });

    return NextResponse.json({
      success: true,
      message: 'Monitor and associated comments deleted successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
