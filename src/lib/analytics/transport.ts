/**
 * Event Transport Module
 * Handles sending events to the backend with reliability
 */

import { CONFIG, type EventBatch } from "./core";

export class EventTransport {
  send(batch: EventBatch): void {
    // Try sendBeacon first (most reliable for page unload)
    if (this.sendWithBeacon(batch)) {
      return;
    }

    // Fallback to fetch with keepalive
    this.sendWithFetch(batch);
  }

  private sendWithBeacon(batch: EventBatch): boolean {
    if (!navigator.sendBeacon) return false;

    try {
      const blob = new Blob([JSON.stringify(batch)], {
        type: "application/json",
      });
      return navigator.sendBeacon(CONFIG.API_ENDPOINT, blob);
    } catch (err) {
      console.error("Surface Analytics: Beacon send failed", err);
      return false;
    }
  }

  private sendWithFetch(batch: EventBatch): void {
    fetch(CONFIG.API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(batch),
      keepalive: true,
    }).catch((err) => {
      console.error("Surface Analytics: Fetch send failed", err);
    });
  }
}
