/**
 * Main Analytics Class
 * Orchestrates all modules
 */

import { CONFIG, type AnalyticsEvent } from "./core";
import { VisitorIdentifier } from "./visitor-id";
import { SessionManager } from "./session";
import { EventQueue } from "./queue";
import { ClickTracker } from "./trackers/click-tracker";
import { EmailTracker } from "./trackers/email-tracker";

export class Analytics {
  initialized = false;
  SNIPPET_VERSION: string;
  visitorId = "";

  private _writeKey: string | null = null;
  private visitor: VisitorIdentifier;
  private session: SessionManager;
  private queue: EventQueue | null = null;
  private clickTracker: ClickTracker;
  private emailTracker: EmailTracker;
  private readyCallbacks: Array<() => void> = [];
  private isReady = false;

  constructor() {
    this.SNIPPET_VERSION =
      (window as any).analytics?.SNIPPET_VERSION || "1.0.0";
    this._writeKey = (window as any).analytics?._writeKey || null;

    this.visitor = new VisitorIdentifier();
    this.session = new SessionManager();
    this.clickTracker = new ClickTracker();
    this.emailTracker = new EmailTracker();
  }

  load(key?: string): void {
    if (this.initialized) return;

    const apiKey = key ?? this._writeKey;
    if (!apiKey) {
      console.error("Surface Analytics: No API key provided");
      return;
    }

    this._writeKey = apiKey;
    this.initialized = true;

    // Initialize visitor ID
    this.visitorId = this.visitor.getVisitorId();

    // Initialize event queue
    this.queue = new EventQueue(apiKey);

    // Track script initialization
    this.trackScriptInit();

    // Setup auto-tracking
    this.setupAutoTracking();

    // Mark as ready
    this.isReady = true;
    this.executeReadyCallbacks();

    console.log("Surface Analytics initialized with key:", apiKey);
  }

  page(properties?: Record<string, any>): void {
    const pageEvent: AnalyticsEvent = {
      event: "page_view",
      properties: {
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || "direct",
        path: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
        ...properties,
      },
    };

    this.enqueue(pageEvent);
  }

  track(eventName: string, properties?: Record<string, any>): void {
    if (!eventName || typeof eventName !== "string") {
      console.error("Surface Analytics: Event name must be a string");
      return;
    }

    const event: AnalyticsEvent = {
      event: eventName,
      properties: properties ?? {},
    };

    this.enqueue(event);
  }

  identify(userId: string, traits?: Record<string, any>): void {
    const identifyEvent: AnalyticsEvent = {
      event: "identify",
      properties: {
        user_id: userId,
        traits: traits ?? {},
      },
    };

    this.session.setUserId(userId);
    this.enqueue(identifyEvent);
  }

  ready(callback: () => void): void {
    if (typeof callback !== "function") return;

    if (this.isReady) {
      callback();
    } else {
      this.readyCallbacks.push(callback);
    }
  }

  private trackScriptInit(): void {
    const initEvent: AnalyticsEvent = {
      event: "script_init",
      properties: {
        snippet_version: this.SNIPPET_VERSION,
        script_version: CONFIG.VERSION,
        page_url: window.location.href,
        page_title: document.title,
        referrer: document.referrer || "direct",
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        color_depth: screen.colorDepth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezone_offset: new Date().getTimezoneOffset(),
        language: navigator.language,
        platform: navigator.platform,
        cookie_enabled: navigator.cookieEnabled,
        online: navigator.onLine,
      },
    };

    this.enqueue(initEvent);
  }

  private setupAutoTracking(): void {
    // Track initial page view
    this.page();

    // Setup trackers
    this.clickTracker.setup((event) => this.enqueue(event));
    this.emailTracker.setup((event) => this.enqueue(event));
  }

  private enqueue(event: AnalyticsEvent): void {
    if (!this.queue) return;

    const enrichedEvent: AnalyticsEvent = {
      ...event,
      visitor_id: this.visitorId,
      user_id: this.session.getUserId(),
      session_id: this.session.getSessionId(),
      timestamp: new Date().toISOString(),
      api_key: this._writeKey ?? undefined,
      page_url: window.location.href,
      page_title: document.title,
    };

    this.queue.enqueue(enrichedEvent);
  }

  private executeReadyCallbacks(): void {
    this.readyCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error("Surface Analytics: Ready callback error", err);
      }
    });
    this.readyCallbacks = [];
  }
}
