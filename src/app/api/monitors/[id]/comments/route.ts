import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db/mongodb';
import { CommentModel } from '@/models/Comment';
import { FilterQuery } from 'mongoose';
import { ICommentDocument } from '@/models/Comment';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    const severity = searchParams.get('severity');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const isNegativeParam = searchParams.get('isNegative');

    await dbConnect();

    const query: FilterQuery<ICommentDocument> = { monitorId: id };

    if (isNegativeParam !== null && isNegativeParam !== undefined) {
      query.isNegative = isNegativeParam === 'true';
    }

    if (severity && severity !== 'all') {
      query.severity = severity;
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    if (search && search.trim().length > 0) {
      query.$or = [
        { body: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
      ];
    }

    const comments = await CommentModel.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      data: comments.map((c) => ({
        ...c,
        _id: c._id.toString(),
        monitorId: c.monitorId.toString(),
      })),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
