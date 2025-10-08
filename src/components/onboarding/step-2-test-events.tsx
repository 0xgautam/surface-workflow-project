"use client";

import React from "react";
import type { AnalyticsEvent } from "~/lib/onboarding/types";
import { Button } from "../ui/button";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

interface Step2Props {
  events: AnalyticsEvent[];
  testTag: () => Promise<void>;
  isTesting: boolean;
}

export function Step2TestEvents({ events, testTag, isTesting }: Step2Props) {
  const getEventText = (event: AnalyticsEvent) => {
    switch (event.event) {
      case "script_init":
        return "Script Init";
      case "page_view":
        return "Page";
      case "click":
        return "Click";
      case "email_entered":
        return "Email";
      case "identify":
        return "Identify";
      default:
        return event.event
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* Events Table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                Visitor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                Metadata
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white text-[#667085]">
            {events.length > 0 ? (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{getEventText(event)}</td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {event.visitor_id.substring(0, 12)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <code className="text-xs">
                      {JSON.stringify(event.properties).substring(0, 50)}...
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm">
                  <ArrowPathIcon className="mx-auto mb-2 h-5 w-5 animate-spin" />
                  No events received yet. Awaiting events from your website...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Test Button */}
      <div className="flex items-center justify-end">
        <Button
          onClick={testTag}
          disabled={isTesting}
          className="disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isTesting ? "Testing..." : "Test Tag"}
        </Button>
      </div>
    </div>
  );
}
