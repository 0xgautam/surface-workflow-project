/**
 * Build script to bundle analytics modules into single file
 */

import * as esbuild from "esbuild";
import { readFileSync, writeFileSync } from "fs";

async function build() {
  // Bundle all modules
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const result = await esbuild.build({
    entryPoints: ["src/lib/analytics/index.ts"],
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "__SurfaceAnalytics",
    write: false,
    target: "es2017",
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const bundled = result.outputFiles[0]?.text;

  // Wrap in IIFE and add initialization logic
  const wrapped = `
(function() {
  'use strict';
  
  ${bundled}
  
  const analytics = new __SurfaceAnalytics.Analytics();
  
  // Handle stub queue from snippet
  if (window.analytics && Array.isArray(window.analytics)) {
    const stub = window.analytics;
    window.surfaceAnalytics = analytics;
    window.analytics = analytics;
    
    stub.forEach(([method, args]) => {
      if (typeof analytics[method] === 'function') {
        analytics[method].apply(analytics, args);
      }
    });
  } else {
    window.surfaceAnalytics = analytics;
    window.analytics = analytics;
  }
  
  // Auto-initialize if API key exists
  if (analytics._writeKey) {
    analytics.load(analytics._writeKey);
  }
})();
  `.trim();

  writeFileSync("public/surface_analytics.js", wrapped);
  console.log("✅ Built surface_analytics.js");
}

build().catch(console.error);
