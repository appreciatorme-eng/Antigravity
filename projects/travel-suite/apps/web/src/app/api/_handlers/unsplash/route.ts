import { NextResponse } from 'next/server';

// Deprecated route kept as a hard fail to prevent unguarded provider-cost bypass.
export async function GET() {
  try {
    return NextResponse.json(
      {
        error: 'Deprecated route. Use /api/images/unsplash (authenticated + cost-guarded).',
      },
      { status: 410 }
    );
  } catch (error) {
    console.error("[/api/unsplash:GET] Unhandled error:", error);
    return Response.json(
      { data: null, error: "An unexpected error occurred. Please try again." },
      { status: 500 },
    );
  }
}
