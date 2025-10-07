"use client";

import React, { useState } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/outline";
import { Button } from "../ui/button";
import { cn } from "~/lib/utils";

import SyntaxHighlighter from "react-syntax-highlighter";
import { atomOneLight } from "react-syntax-highlighter/dist/esm/styles/hljs";

interface CodeSnippetProps {
  code: string;
  language?: string;
}

export function CodeSnippet({ code }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="h-[300px] overflow-x-auto overflow-y-scroll rounded-xl border-2 border-[#E2E4E9] bg-[#F9F9F9] p-4 text-sm shadow-[0px_2px_4px_0px_#1B1C1D0A]">
        <SyntaxHighlighter language="javascript" style={atomOneLight}>
          {code}
        </SyntaxHighlighter>
      </pre>

      {/* Copy Button */}
      <Button
        onClick={copyToClipboard}
        className={cn("absolute top-3 right-3", {
          "bg-green-600 text-green-100 hover:bg-green-500": copied,
        })}
      >
        {copied ? (
          <>
            <CheckIcon className="inline h-4 w-4 text-green-100" />
            Copied!
          </>
        ) : (
          <>
            <ClipboardIcon className="inline h-4 w-4" />
            Copy Snippet
          </>
        )}
      </Button>
    </div>
  );
}
