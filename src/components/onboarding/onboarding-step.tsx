"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "~/lib/utils";
import type { OnboardingStep } from "~/lib/onboarding/types";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
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
  const [isExpanded, setIsExpanded] = React.useState(isInProgress);

  // Sync expansion state with step status
  React.useEffect(() => {
    setIsExpanded(isInProgress);
  }, [isInProgress]);

  const toggleExpanded = () => {
    if (!isDisabled && !isCompleted) {
      setIsExpanded(!isExpanded);
      if (!isExpanded && !isInProgress) {
        startStep();
      }
    }
  };

  return (
    <motion.div
      className={cn(
        "rounded-lg border-2 border-[#EBEDF3] bg-white shadow-[0px_1.2px_3.99px_0px_#00000007,0px_4.02px_13.4px_0px_#0000000B] transition-all",
        isExpanded && "border-primary/20",
      )}
      initial={false}
      animate={{
        boxShadow: isExpanded
          ? "0px 4px 12px rgba(0, 0, 0, 0.1)"
          : "0px 1.2px 3.99px rgba(0, 0, 0, 0.027)",
      }}
    >
      {/* Step Header - Clickable */}
      <div
        className={cn(
          "flex cursor-pointer flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 md:px-6",
          isDisabled && "cursor-not-allowed opacity-50",
        )}
        onClick={toggleExpanded}
      >
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          {/* Step Number / Checkmark */}
          <motion.div
            className={cn(
              "mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold sm:mt-0",
              isCompleted
                ? "bg-[#CDFEE1] text-[#0C5132]"
                : isInProgress
                  ? "bg-primary/10 text-primary"
                  : "bg-gray-100 text-gray-500",
            )}
            animate={{
              scale: isExpanded ? 1.1 : 1,
              // rotate: isCompleted ? 360 : 0,
            }}
            transition={{ duration: 0.3 }}
          >
            <CheckIcon className="h-4 w-4" />
          </motion.div>

          {/* Title & Description */}
          <div className="flex-1">
            <h3 className="text-base font-medium text-black sm:text-lg">
              {step.title}
            </h3>
            <p className="mt-1 text-sm font-normal text-[#5F6065] sm:text-base">
              {step.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Step Trigger Button */}
          {!isInProgress && !isCompleted && (
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent row click
                startStep();
                setIsExpanded(true);
              }}
              className={cn(
                "w-full sm:w-auto",
                isDisabled ? "bg-[#F1F1F2] text-[#5F6065]" : "",
              )}
              disabled={isDisabled}
            >
              {triggerText}
            </Button>
          )}
        </div>
      </div>

      {/* Step Content - Animated */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.3, ease: "easeInOut" },
              opacity: { duration: 0.2, ease: "easeInOut" },
            }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 px-4 py-4 md:px-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
