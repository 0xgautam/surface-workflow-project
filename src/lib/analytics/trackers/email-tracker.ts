/**
 * Email Input Tracker
 */

import { type AnalyticsEvent } from "../core";

export class EmailTracker {
  private handler: ((event: AnalyticsEvent) => void) | null = null;

  setup(onEvent: (event: AnalyticsEvent) => void): void {
    this.handler = onEvent;

    document.addEventListener("blur", this.handleBlur.bind(this), true);
  }

  private async handleBlur(e: FocusEvent): Promise<void> {
    if (!this.handler) return;

    try {
      const element = e.target as HTMLInputElement;

      const isEmailField =
        element.type === "email" ||
        element.name?.toLowerCase().includes("email") ||
        element.id?.toLowerCase().includes("email") ||
        element.placeholder?.toLowerCase().includes("email");

      if (isEmailField && element.value) {
        const email = element.value.trim().toLowerCase();

        if (this.isValidEmail(email)) {
          const emailHash = await this.hashEmail(email);

          const emailEvent: AnalyticsEvent = {
            event: "email_entered",
            properties: {
              email_hash: emailHash,
              field_id: element.id ?? null,
              field_name: element.name ?? null,
              field_type: element.type ?? null,
              page_url: window.location.href,
              form_id: element.form?.id ?? null,
              form_name: element.form?.name ?? null,
            },
          };

          this.handler(emailEvent);
        }
      }
    } catch (err) {
      console.error("Surface Analytics: Email tracking error", err);
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private async hashEmail(email: string): Promise<string> {
    try {
      if (window.crypto?.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(email);
        const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    } catch (e) {
      // Fallback to simple hash
    }

    return this.simpleHash(email);
  }

  private simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return Math.abs(hash).toString(36);
  }
}
