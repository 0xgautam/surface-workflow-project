/**
 * Session Management Module
 */

export class SessionManager {
  private sessionId: string | null = null;

  getSessionId(): string {
    if (this.sessionId) return this.sessionId;

    try {
      this.sessionId = sessionStorage.getItem("surface_session_id");

      if (!this.sessionId) {
        this.sessionId = `sess_${this.generateUUID()}`;
        sessionStorage.setItem("surface_session_id", this.sessionId);
      }
    } catch (e) {
      this.sessionId = `sess_${this.generateUUID()}`;
    }

    return this.sessionId;
  }

  getUserId(): string | null {
    try {
      return localStorage.getItem("surface_user_id");
    } catch (e) {
      return null;
    }
  }

  setUserId(userId: string): void {
    try {
      localStorage.setItem("surface_user_id", userId);
    } catch (e) {
      // localStorage might be disabled
    }
  }

  private generateUUID(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
