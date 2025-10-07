/**
 * Core Analytics Configuration
 */
export const CONFIG = {
  VERSION: "1.0.0",
  API_ENDPOINT: "/api/analytics/ingest",
  BATCH_SIZE: 10,
  FLUSH_INTERVAL: 5000,
  MAX_QUEUE_SIZE: 100,
  COOKIE_DURATION: 365,
} as const;

export interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  visitor_id?: string;
  user_id?: string | null;
  session_id?: string;
  timestamp?: string;
  api_key?: string;
  page_url?: string;
  page_title?: string;
}

export interface EventBatch {
  api_key: string;
  events: AnalyticsEvent[];
  batch_id: string;
  sent_at: string;
}
