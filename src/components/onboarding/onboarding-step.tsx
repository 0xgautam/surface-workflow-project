"use client";

import React from "react";
import { cn } from "~/lib/utils";
import type { OnboardingStep } from "~/lib/onboarding/types";
import { CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/button";

interface OnboardingStepProps {
  step: OnboardingStep;
  stepNumber: number;
  children: React.ReactNode;
  triggerText: string;
  startStep: () => void;
  isDisabled?: boolean;
}

export function OnboardingStepComponent({
  step,
  triggerText,
  startStep,
  children,
  isDisabled,
}: OnboardingStepProps) {
  const isCompleted = step.status === "completed";
  const isInProgress = step.status === "in-progress";

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-[#EBEDF3] bg-white px-6 py-3 shadow-[0px_1.2px_3.99px_0px_#00000007,0px_4.02px_13.4px_0px_#0000000B] transition-all",
      )}
    >
      {/* Step Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Step Number / Checkmark */}
          <div
            className={cn(
              "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              isCompleted
                ? "bg-[#CDFEE1] text-[#0C5132]"
                : isInProgress
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-gray-500",
            )}
          >
            <CheckIcon className="h-4 w-4" />
          </div>

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className="text-lg font-medium text-black">{step.title}</h3>
            <p className="mt-1 text-base font-normal text-[#5F6065]">
              {step.description}
            </p>
          </div>
        </div>

        {/* Step Trigger */}
        {!isInProgress && !isCompleted && (
          <Button
            onClick={startStep}
            className={isDisabled ? "bg-[#F1F1F2] text-[#5F6065]" : ""}
            disabled={isDisabled}
          >
            {triggerText}
          </Button>
        )}
      </div>

      {/* Step Content */}
      {isInProgress && <div className="mt-4">{children}</div>}
    </div>
  );
}
