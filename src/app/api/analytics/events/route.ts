import { NextResponse, type NextRequest } from "next/server";
import { eventsQuerySchema } from "~/lib/analytics/api/validation";
import { db } from "~/server/db";
import type { Prisma } from "~/app/generated/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/events
 * Fetch events for dashboard with filters
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      api_key: searchParams.get("api_key"),
      event_type: searchParams.get("event_type"),
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      start_date: searchParams.get("start_date"),
      end_date: searchParams.get("end_date"),
    };

    // 2. Validate query schema
    const validation = eventsQuerySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid query parameters",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { api_key, event_type, limit, offset, start_date, end_date } =
      validation.data;

    // 3. Verify project exists
    const project = await db.project.findUnique({
      where: { apiKey: api_key },
    });

    if (!project) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // 4. Build query filters
    const where: Prisma.EventWhereInput = {
      projectId: project.id,
    };

    if (event_type) {
      where.eventType = event_type;
    }

    if (start_date || end_date) {
      where.timestamp = {};
      if (start_date) where.timestamp.gte = new Date(start_date);
      if (end_date) where.timestamp.lte = new Date(end_date);
    }

    // 5. Fetch events with visitor info
    const [events, total] = await Promise.all([
      db.event.findMany({
        where,
        include: {
          visitor: {
            select: {
              visitorId: true,
              userId: true,
              userTraits: true,
            },
          },
        },
        orderBy: {
          timestamp: "desc",
        },
        take: limit,
        skip: offset,
      }),
      db.event.count({ where }),
    ]);

    // 6. Transform response
    const transformedEvents = events.map((event) => ({
      id: event.id,
      event: event.eventType,
      event_name: event.eventName,
      visitor_id: event.visitor.visitorId,
      user_id: event.visitor.userId,
      session_id: event.sessionId,
      properties: event.properties,
      page_url: event.pageUrl,
      page_title: event.pageTitle,
      timestamp: event.timestamp.toISOString(),
      metadata: {
        user_agent: event.userAgent,
        referrer: event.referrer,
      },
    }));

    // 7. Return paginated response
    return NextResponse.json({
      events: transformedEvents,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (err) {
    console.error("Events fetch error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
