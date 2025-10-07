import { db } from "~/server/db";
import type { Event } from "./validation";

export class EventProcessor {
  /**
   * Process a batch of events
   */
  async processBatch(
    apiKey: string,
    events: Event[],
    batchId: string,
  ): Promise<{ success: boolean; processedCount: number; errors?: string[] }> {
    try {
      // 1. Verify project exists
      const project = await db.project.findUnique({
        where: { apiKey },
      });

      if (!project) {
        return {
          success: false,
          processedCount: 0,
          errors: ["Invalid API key"],
        };
      }

      // 2. Record batch
      await db.eventBatch.create({
        data: {
          batchId,
          projectId: project.id,
          eventCount: events.length,
          status: "pending",
        },
      });

      // 3. Process each event
      const errors: string[] = [];
      let processedCount = 0;

      for (const event of events) {
        try {
          await this.processEvent(project.id, event);
          processedCount++;
        } catch (err) {
          errors.push(
            `Event ${event.event}: ${err instanceof Error ? err.message : "Unknown error"}`,
          );
        }
      }

      // 4. Update batch status
      await db.eventBatch.update({
        where: { batchId },
        data: {
          status: errors.length === 0 ? "processed" : "failed",
          processedAt: new Date(),
          error: errors.length > 0 ? errors.join("; ") : null,
        },
      });

      return {
        success: errors.length === 0,
        processedCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (err) {
      console.error("Batch processing error:", err);
      return {
        success: false,
        processedCount: 0,
        errors: [err instanceof Error ? err.message : "Unknown error"],
      };
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(projectId: string, event: Event): Promise<void> {
    const visitorId = event.visitor_id;
    if (!visitorId) {
      throw new Error("visitor_id is required");
    }

    // 1. Upsert visitor
    let visitor = await db.visitor.findUnique({
      where: { visitorId },
    });

    if (!visitor) {
      // Extract fingerprint from visitorId (format: vis_uuid_fingerprint)
      const fingerprint = visitorId.split("_")[2] ?? null;

      // Determine initial referrer from properties
      const initialReferrer =
        (event.properties?.referrer as string) ||
        (event.properties?.initial_referrer as string) ||
        "direct";

      visitor = await db.visitor.create({
        data: {
          visitorId,
          fingerprint,
          projectId,
          initialReferrer,
          userId: event.user_id ?? null,
          userTraits: event.properties?.traits ?? null,
        },
      });
    } else {
      // Update visitor if user_id or traits changed
      if (event.user_id || event.properties?.traits) {
        await db.visitor.update({
          where: { id: visitor.id },
          data: {
            userId: event.user_id ?? visitor.userId,
            userTraits: event.properties?.traits ?? visitor.userTraits,
            lastSeen: new Date(),
          },
        });
      }
    }

    // 2. Insert event
    await db.event.create({
      data: {
        projectId,
        visitorId: visitor.id,
        eventType: event.event,
        eventName: event.event,
        properties: event.properties,
        sessionId: event.session_id ?? "unknown",
        userId: event.user_id ?? null,
        pageUrl: event.page_url ?? "unknown",
        pageTitle: event.page_title ?? null,
        referrer: (event.properties?.referrer as string) ?? null,
        userAgent: (event.properties?.user_agent as string) ?? null,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      },
    });
  }
}
