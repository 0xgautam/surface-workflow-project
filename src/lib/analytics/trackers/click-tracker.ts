/**
 * Click Event Tracker
 */

import { type AnalyticsEvent } from "../core";

export class ClickTracker {
  private handler: ((event: AnalyticsEvent) => void) | null = null;

  setup(onEvent: (event: AnalyticsEvent) => void): void {
    this.handler = onEvent;

    document.addEventListener("click", this.handleClick.bind(this), true);
  }

  private handleClick(e: MouseEvent): void {
    if (!this.handler) return;

    try {
      const element = e.target as HTMLElement;
      const tagName = element.tagName?.toLowerCase();

      // Only track interactive elements
      const isInteractive =
        tagName === "button" ||
        tagName === "a" ||
        (tagName === "input" &&
          ["submit", "button"].includes((element as HTMLInputElement).type)) ||
        element.getAttribute("role") === "button" ||
        element.hasAttribute("data-track-surface"); // Explicit opt-in

      if (!isInteractive) return;

      const clickEvent: AnalyticsEvent = {
        event: "click",
        properties: {
          element_id: element.id || null,
          element_tag: tagName,
          element_classes: Array.from(element.classList || []),
          element_text: this.getElementText(element),
          element_href: (element as HTMLAnchorElement).href || null,
          element_type: (element as HTMLInputElement).type || null,
          element_name: (element as HTMLInputElement).name || null,
          element_path: this.getElementPath(element),
          page_url: window.location.href,
          viewport_x: e.clientX,
          viewport_y: e.clientY,
          page_x: e.pageX,
          page_y: e.pageY,
        },
      };

      this.handler(clickEvent);
    } catch (err) {
      console.error("Surface Analytics: Click tracking error", err);
    }
  }

  private getElementText(element: HTMLElement): string {
    const text = element.innerText || element.textContent || "";
    return text.trim().substring(0, 100);
  }

  private getElementPath(element: HTMLElement): string {
    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body && path.length < 5) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector += `#${current.id}`;
        path.unshift(selector);
        break;
      } else if (current.className) {
        const classes = Array.from(current.classList).slice(0, 2).join(".");
        if (classes) {
          selector += `.${classes}`;
        }
      }

      path.unshift(selector);
      current = current.parentElement;
    }

    return path.join(" > ");
  }
}
