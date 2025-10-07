/**
 * Visitor Identification Module
 * Handles fingerprinting, localStorage, and cookie-based visitor tracking
 */

export class VisitorIdentifier {
  private visitorId: string | null = null;

  getVisitorId(): string {
    if (this.visitorId) return this.visitorId;

    // Try localStorage first
    this.visitorId = this.getFromStorage();

    if (!this.visitorId) {
      // Generate new ID with fingerprint
      const fingerprint = this.generateFingerprint();
      this.visitorId = `vis_${this.generateUUID()}_${fingerprint}`;
      this.setVisitorId(this.visitorId);
    }

    return this.visitorId;
  }

  private getFromStorage(): string | null {
    try {
      const stored = localStorage.getItem("surface_visitor_id");
      if (stored) return stored;
    } catch (e) {
      // localStorage might be disabled
    }

    return this.getCookie("surface_visitor_id");
  }

  setVisitorId(id: string): void {
    this.visitorId = id;

    try {
      localStorage.setItem("surface_visitor_id", id);
    } catch (e) {
      // localStorage might be disabled
    }

    this.setCookie("surface_visitor_id", id, 365);
  }

  private generateFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      screen.colorDepth.toString(),
      new Date().getTimezoneOffset().toString(),
      String(!!window.sessionStorage),
      String(!!window.localStorage),
      (navigator.hardwareConcurrency || 0).toString(),
      (navigator.maxTouchPoints || 0).toString(),
    ];

    const hash = this.simpleHash(components.join("|"));
    return hash.substring(0, 12);
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private simpleHash(str: string): string {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) + hash + str.charCodeAt(i);
    }
    return Math.abs(hash).toString(36);
  }

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() ?? null;
    }
    return null;
  }

  private setCookie(name: string, value: string, days: number): void {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  }
}
