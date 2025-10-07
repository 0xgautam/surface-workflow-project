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
  return (
    <div className="space-y-6">
      {/* Events Table */}
      <div className="overflow-hidden rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Visitor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Metadata
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {events.length > 0 ? (
              events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                      {event.event}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-600">
                    {event.visitor_id.substring(0, 12)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <code className="text-xs text-gray-600">
                      {JSON.stringify(event.properties).substring(0, 50)}...
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(event.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-gray-500"
                >
                  <ArrowPathIcon className="mx-auto mb-2 h-5 w-5 animate-spin text-gray-400" />
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
