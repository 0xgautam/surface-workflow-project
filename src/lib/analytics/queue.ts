/**
 * Event Queue Module
 * Handles batching and flushing events
 */

import { CONFIG, type AnalyticsEvent, type EventBatch } from "./core";
import { EventTransport } from "./transport";

export class EventQueue {
  private queue: AnalyticsEvent[] = [];
  private flushTimer: number | null = null;
  private transport: EventTransport;

  constructor(
    private apiKey: string,
    transport?: EventTransport,
  ) {
    this.transport = transport ?? new EventTransport();
    this.setupFlushInterval();
    this.setupUnloadHandlers();
  }

  enqueue(event: AnalyticsEvent): void {
    this.queue.push(event);

    // Auto-flush if queue is full
    if (
      this.queue.length >= CONFIG.BATCH_SIZE ||
      this.queue.length >= CONFIG.MAX_QUEUE_SIZE
    ) {
      this.flush();
    }
  }

  flush(): void {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    const batch: EventBatch = {
      api_key: this.apiKey,
      events,
      batch_id: this.generateUUID(),
      sent_at: new Date().toISOString(),
    };

    this.transport.send(batch);
  }

  private setupFlushInterval(): void {
    this.flushTimer = window.setInterval(() => {
      if (this.queue.length > 0) {
        this.flush();
      }
    }, CONFIG.FLUSH_INTERVAL);
  }

  private setupUnloadHandlers(): void {
    const flushOnUnload = () => this.flush();

    window.addEventListener("beforeunload", flushOnUnload);
    window.addEventListener("pagehide", flushOnUnload);

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        this.flush();
      }
    });
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}
