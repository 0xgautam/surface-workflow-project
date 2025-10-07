import type { Prisma } from "~/app/generated/prisma";

export type OnboardingStepStatus = "pending" | "in-progress" | "completed";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  status: OnboardingStepStatus;
}

export interface AnalyticsEvent {
  id: string;
  event: string;
  event_name: string;
  visitor_id: string;
  user_id: string | null;
  session_id: string;
  properties: Prisma.JsonValue;
  page_url: string;
  page_title: string | null;
  timestamp: string;
  metadata: {
    user_agent: string | null;
    referrer: string | null;
  };
}

export interface VerificationResult {
  installed: boolean;
  snippetFound: boolean;
  scriptLoaded: boolean;
  message: string;
}
