"use client";

import React from "react";
import { CodeSnippet } from "./code-snippet";
import {
  SNIPPET_TEMPLATE,
  SNIPPET_TEMPLATE_DEV,
} from "~/lib/onboarding/constants";
import type { VerificationResult } from "~/lib/onboarding/types";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../ui/button";

interface Step1Props {
  apiKey: string;
  websiteUrl: string;
  isVerifying: boolean;
  verificationResult: VerificationResult | null;
  verifyInstallation: (url: string) => Promise<void>;
  nextStep: () => void;
}

export function Step1InstallTag({
  apiKey,
  websiteUrl,
  isVerifying,
  verificationResult,
  verifyInstallation,
  nextStep,
}: Step1Props) {
  const snippet =
    process.env.NODE_ENV === "production"
      ? SNIPPET_TEMPLATE.replace("{{API_KEY}}", apiKey)
      : SNIPPET_TEMPLATE_DEV.replace("{{API_KEY}}", apiKey);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Code Snippet */}
      <CodeSnippet code={snippet} />

      {/* Verification Section */}
      <div className="space-y-3">
        {/* Verifying State */}
        {isVerifying && (
          <div className="flex w-full items-center gap-2 rounded-sm bg-indigo-50 px-2 py-2 text-sm font-normal sm:px-3">
            <InformationCircleIcon className="text-primary-foreground fill-primary h-5 w-5 flex-shrink-0" />
            <p className="text-xs sm:text-sm">Checking for Tag...</p>
          </div>
        )}

        {/* Success State */}
        {!isVerifying && verificationResult && verificationResult.installed && (
          <div className="flex w-full items-center gap-2 rounded-sm bg-green-50 px-2 py-2 text-sm font-normal text-green-800 sm:px-3">
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0 fill-green-500 text-white" />
            <p className="text-xs sm:text-sm">Connected successfully!</p>
          </div>
        )}

        {/* Error State */}
        {!isVerifying &&
          verificationResult &&
          !verificationResult.installed && (
            <div className="flex w-full flex-col gap-2 rounded-sm bg-red-50 px-2 py-3 text-sm font-normal sm:flex-row sm:items-start sm:px-3">
              <ExclamationCircleIcon className="fill-destructive h-5 w-5 flex-shrink-0 text-white" />

              <div className="space-y-1">
                <p className="text-xs sm:text-sm">
                  We couldn&apos;t detect the Surface Tag on your website.
                  Please ensure the snippet is added correctly.
                </p>

                <ul className="mt-2 list-inside list-disc space-y-1 pl-0 text-xs text-gray-500 sm:pl-2 sm:text-sm">
                  <li>
                    Recheck the code snippet to ensure it&apos;s correctly
                    placed before the closing &lt;/head&gt; tag.
                  </li>
                  <li>
                    Ensure there are no blockers (like ad blockers) preventing
                    the script from running.
                  </li>
                  <li>Try again once you&apos;ve made the corrections.</li>
                </ul>
              </div>
            </div>
          )}

        {/* Action Buttons */}
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-end sm:justify-end sm:gap-3">
          {/* Show "Next Step" button only if verification succeeded */}
          {verificationResult?.installed && (
            <Button
              onClick={nextStep}
              disabled={isVerifying}
              className="w-full disabled:cursor-not-allowed sm:w-auto"
            >
              Next Step
            </Button>
          )}

          {/* Show "Try Again" button if verification failed */}
          {verificationResult && !verificationResult.installed && (
            <Button
              onClick={() => verifyInstallation(websiteUrl)}
              disabled={isVerifying}
              className="w-full disabled:cursor-not-allowed sm:w-auto"
            >
              {isVerifying ? "Verifying..." : "Try Again"}
            </Button>
          )}

          {/* Show "Test Connection" button if no verification result exists */}
          {!verificationResult && (
            <Button
              onClick={() => verifyInstallation(websiteUrl)}
              disabled={isVerifying}
              className="w-full disabled:cursor-not-allowed sm:w-auto"
            >
              {isVerifying ? "Verifying..." : "Test Connection"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
