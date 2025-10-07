import { z } from "zod";

// Event schema from client
export const eventSchema = z.object({
  event: z.string(),
  properties: z.record(z.any()),
  visitor_id: z.string().optional(),
  user_id: z.string().nullable().optional(),
  session_id: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  api_key: z.string().optional(),
  page_url: z.string().url().optional(),
  page_title: z.string().optional(),
});

// Batch schema from client
export const eventBatchSchema = z.object({
  api_key: z.string().min(1, "API key required"),
  events: z.array(eventSchema).min(1, "At least one event required"),
  batch_id: z.string().uuid(),
  sent_at: z.string().datetime(),
});

// Verify installation schema
export const verifyInstallationSchema = z.object({
  url: z.string().url("Valid URL required"),
  api_key: z.string().min(1, "API key required"),
});

// Events query schema
export const eventsQuerySchema = z.object({
  api_key: z.string().min(1, "API key required"),
  event_type: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export type EventBatch = z.infer<typeof eventBatchSchema>;
export type Event = z.infer<typeof eventSchema>;
export type VerifyInstallation = z.infer<typeof verifyInstallationSchema>;
export type EventsQuery = z.infer<typeof eventsQuerySchema>;
