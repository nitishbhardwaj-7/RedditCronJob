import { NextResponse } from 'next/server';
import { getIntegrationStatuses } from '@/lib/providers/factory';

export async function GET() {
  try {
    const status = getIntegrationStatuses();
    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
