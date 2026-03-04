import { NextResponse } from 'next/server';

// Deprecated route kept as a hard fail to prevent unguarded provider-cost bypass.
export async function GET() {
  return NextResponse.json(
    {
      error: 'Deprecated route. Use /api/images/unsplash (authenticated + cost-guarded).',
    },
    { status: 410 }
  );
}
