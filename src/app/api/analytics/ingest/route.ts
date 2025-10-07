import { NextResponse, type NextRequest } from "next/server";
import { eventBatchSchema } from "~/lib/analytics/api/validation";
import { EventProcessor } from "~/lib/analytics/api/process-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/ingest
 * Receive event batches from surface_analytics.js
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate batch schema
    const validation = eventBatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { api_key, events, batch_id } = validation.data;

    console.log("API Key:", api_key);
    console.log(`Ingesting batch ${batch_id} with ${events.length} events`);

    // 3. Process events
    const processor = new EventProcessor();
    const result = await processor.processBatch(api_key, events, batch_id);

    // 4. Return response
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Batch processing failed",
          details: result.errors,
          processedCount: result.processedCount,
        },
        { status: 400 },
      );
    }

    // Success - return 204 No Content (standard for analytics endpoints)
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error("Ingest error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
