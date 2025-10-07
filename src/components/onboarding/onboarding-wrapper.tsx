"use client";

import React from "react";
import { useOnboarding } from "~/hooks/use-onboarding";
import { OnboardingStepComponent } from "./onboarding-step";
import { Step1InstallTag } from "./step-1-install-tag";
import { Step2TestEvents } from "./step-2-test-events";

interface OnboardingWrapperProps {
  apiKey: string;
}

export function OnboardingWrapper({ apiKey }: OnboardingWrapperProps) {
  const {
    steps,
    isVerifying,
    isTesting,
    events,
    verificationResult,
    verifyInstallation,
    testTag,
    startStep,
    completeStep,
  } = useOnboarding(apiKey);

  return (
    <div className="space-y-6">
      {/* Step 1: Install Tag */}
      <OnboardingStepComponent
        step={steps[0]!}
        stepNumber={1}
        triggerText="Install Tag"
        startStep={() => startStep(steps[0]!.id)}
        isDisabled={false}
      >
        <Step1InstallTag
          apiKey={apiKey}
          websiteUrl={"http://localhost:3000/test-analytics.html"}
          isVerifying={isVerifying}
          verificationResult={verificationResult}
          verifyInstallation={verifyInstallation}
          nextStep={() => {
            completeStep(steps[0]!.id);
            startStep(steps[1]!.id);
          }}
        />
      </OnboardingStepComponent>

      {/* Step 2: Test Events */}
      <OnboardingStepComponent
        step={steps[1]!}
        stepNumber={2}
        triggerText="Test Tag"
        startStep={() => startStep(steps[1]!.id)}
        isDisabled={steps[0]!.status !== "completed"}
      >
        <Step2TestEvents
          events={events}
          testTag={testTag}
          isTesting={isTesting}
        />
      </OnboardingStepComponent>
    </div>
  );
}
