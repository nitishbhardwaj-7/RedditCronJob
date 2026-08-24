import { NextResponse } from 'next/server';
import { processMonitorCrawl } from '@/lib/monitoring/pipeline';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    console.log(`⚡ Manual check requested for Monitor ID: ${id}`);

    const result = await processMonitorCrawl(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Manual crawl completed successfully',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}
