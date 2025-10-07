"use client";

import React from "react";
import { CodeSnippet } from "./code-snippet";
import { SNIPPET_TEMPLATE } from "~/lib/onboarding/constants";
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
  const snippet = SNIPPET_TEMPLATE.replace("{{API_KEY}}", apiKey);

  return (
    <div className="space-y-6">
      {/* Code Snippet */}
      <CodeSnippet code={snippet} />

      {/* Verification Section */}
      <div className="space-y-3">
        {isVerifying && (
          <div className="flex items-center gap-2 rounded-sm bg-indigo-50 px-1.5 py-1 text-sm font-normal">
            <InformationCircleIcon className="text-primary-foreground fill-primary h-5 w-5" />
            <p>Checking for Tag...</p>
          </div>
        )}

        {!isVerifying && verificationResult && verificationResult.installed && (
          <div className="flex items-center gap-2 rounded-sm bg-green-50 px-1.5 py-1 text-sm font-normal text-green-800">
            <CheckCircleIcon className="h-5 w-5 fill-green-500 text-white" />
            <p>Connected successfully!</p>
          </div>
        )}

        {!isVerifying &&
          verificationResult &&
          !verificationResult.installed && (
            <div className="flex items-start gap-2 rounded-sm bg-red-50 px-1.5 py-3 text-sm font-normal">
              <ExclamationCircleIcon className="fill-destructive size-5 text-white" />

              <div className="space-y-1">
                <p>
                  We couldn’t detect the Surface Tag on your website. Please
                  ensure the snippet is added correctly.
                </p>

                <ul className="mt-2 list-inside list-disc space-y-1 pl-2 text-gray-500">
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

        <div className="flex items-end justify-end gap-3">
          {!isVerifying &&
            verificationResult &&
            verificationResult.installed && (
              <Button
                onClick={nextStep}
                disabled={isVerifying}
                className="disabled:cursor-not-allowed"
              >
                Next Step
              </Button>
            )}

          {!isVerifying &&
            verificationResult &&
            !verificationResult.installed && (
              <Button
                onClick={() => verifyInstallation(websiteUrl)}
                disabled={isVerifying}
                className="disabled:cursor-not-allowed"
              >
                Try Again
              </Button>
            )}

          {!(
            !isVerifying &&
            verificationResult &&
            verificationResult.installed
          ) && (
            <Button
              onClick={() => verifyInstallation(websiteUrl)}
              disabled={isVerifying}
              className="disabled:cursor-not-allowed"
            >
              {isVerifying ? "Verifying..." : "Test Connection"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
