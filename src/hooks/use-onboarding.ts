"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  OnboardingStep,
  AnalyticsEvent,
  VerificationResult,
} from "~/lib/onboarding/types";
import { ONBOARDING_STEPS } from "~/lib/onboarding/constants";
import type { Project } from "~/app/generated/prisma";

export function useOnboarding(apiKey: string) {
  const [steps, setSteps] = useState<OnboardingStep[]>(
    ONBOARDING_STEPS.map((step) => ({
      ...step,
      status: "pending" as const,
    })),
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);

  // Update step status
  const updateStepStatus = useCallback(
    (stepId: string, status: OnboardingStep["status"]) => {
      setSteps((prev) =>
        prev.map((step) => (step.id === stepId ? { ...step, status } : step)),
      );
    },
    [],
  );

  // Mark step as in-progress when user interacts
  const startStep = useCallback(
    (stepId: string) => {
      updateStepStatus(stepId, "in-progress");
    },
    [updateStepStatus],
  );

  // Complete step and move to next
  const completeStep = useCallback(
    (stepId: string) => {
      updateStepStatus(stepId, "completed");

      // // Move to next step
      // const currentIndex = steps.findIndex((s) => s.id === stepId);
      // if (currentIndex < steps.length - 1) {
      //   setCurrentStepIndex(currentIndex + 1);
      //   updateStepStatus(steps[currentIndex + 1]!.id, "in-progress");
      // }
    },
    [updateStepStatus],
  );

  // Verify script installation
  const verifyInstallation = useCallback(
    async (url: string) => {
      if (!url) {
        alert("Please enter a website URL");
        return;
      }

      setIsVerifying(true);
      // startStep("install-tag");

      try {
        const response = await fetch("/api/analytics/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, api_key: apiKey }),
        });

        const result: VerificationResult = await response.json();
        setVerificationResult(result);
      } catch (error) {
        console.error("Verification failed:", error);
        setVerificationResult({
          installed: false,
          snippetFound: false,
          scriptLoaded: false,
          message: "Verification failed. Please try again.",
        });
      } finally {
        setIsVerifying(false);
      }
    },
    [apiKey],
  );

  // Test tag (fetch events)
  const testTag = useCallback(async () => {
    setIsTesting(true);
    startStep("test-events");

    try {
      const response = await fetch(
        `/api/analytics/events?api_key=${apiKey}&limit=5`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data: { events: AnalyticsEvent[]; project: Project } =
        await response.json();

      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        completeStep("test-events");
      } else {
        // redirect user to the test website url
        window.open("http://localhost:3000/test-analytics.html", "_blank");
      }
    } catch (error) {
      console.error("Test failed:", error);
      alert("Failed to fetch events. Please try again.");
    } finally {
      setIsTesting(false);
    }
  }, [apiKey, startStep, completeStep]);

  // Poll for events (real-time updates - bonus feature)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/analytics/events?api_key=${apiKey}&limit=5`,
        );
        const data: { events: AnalyticsEvent[] } = await response.json();

        if (data.events) {
          setEvents(data.events);

          // // Auto-complete step if events exist
          // if (data.events.length > 0 && steps[1]?.status === "in-progress") {
          //   completeStep("test-events");
          // }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [apiKey, steps, completeStep]);

  return {
    steps,
    currentStepIndex,
    isVerifying,
    isTesting,
    events,
    verificationResult,
    verifyInstallation,
    testTag,
    startStep,
    completeStep,
  };
}
