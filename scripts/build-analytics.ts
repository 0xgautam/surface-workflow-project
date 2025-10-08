import * as esbuild from "esbuild";
import { writeFileSync } from "fs";

async function build() {
  // Bundle all modules
  const result = await esbuild.build({
    entryPoints: ["src/lib/analytics/index.ts"],
    bundle: true,
    minify: true,
    format: "iife",
    globalName: "__SurfaceAnalytics",
    write: false,
    target: "es2017",
  });

  const bundled = result.outputFiles[0]?.text;

  // Wrap in IIFE with placeholder for API key injection
  const wrapped = `// @ts-nocheck
  (function() {
  'use strict';
  
  ${bundled}
  
  // Create analytics instance
  const analytics = new __SurfaceAnalytics.Analytics();
  
  // Handle stub queue from snippet (surface array)
  if (window.surface && Array.isArray(window.surface)) {
    const stub = window.surface;
    
    // Process existing events in queue
    stub.forEach((item) => {
      if (item.event === 'surface.js') {
        console.log('Surface Analytics: Snippet loaded at', new Date(item['surface.start']));
      }
    });
  }
  
  // Expose analytics globally
  window.surface = analytics;
  window.analytics = analytics;
  
  // API key placeholder - will be replaced by /tag.js route
  const SURFACE_API_KEY = null;
  
  // Auto-initialize if API key is present
  if (SURFACE_API_KEY) {
    analytics.load(SURFACE_API_KEY);
  } else {
    console.warn('Surface Analytics: No API key found. Script should be loaded via /tag.js?id=YOUR_API_KEY');
  }
})();`;

  writeFileSync("public/surface_analytics.js", wrapped);
  console.log("✅ Built surface_analytics.js");
}

build().catch(console.error);
