import * as cheerio from "cheerio";

export class ScriptVerifier {
  /**
   * Verify if analytics script is installed on a website
   */
  async verifyInstallation(
    url: string,
    apiKey: string,
  ): Promise<{
    installed: boolean;
    snippetFound: boolean;
    scriptLoaded: boolean;
    message: string;
  }> {
    try {
      // 1. Fetch the HTML
      const response = await fetch(url, {
        headers: {
          "User-Agent": "SurfaceAnalytics/1.0 (Verification Bot)",
        },
      });

      if (!response.ok) {
        console.error(
          `Failed to fetch URL: ${response.status} ${response.statusText}`,
        );

        return {
          installed: false,
          snippetFound: false,
          scriptLoaded: false,
          message: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        };
      }

      const html = await response.text();

      const $ = cheerio.load(html, {
        scriptingEnabled: true,
      });

      console.log("Fetched HTML length:", html.length);

      // 2. Check for snippet in <head>
      let snippetFound = false;
      let correctApiKey = false;
      let scriptLoaded = false;

      // Method 1: Check all script tags (not just in head, to be more flexible)
      $("script").each((_, element) => {
        const scriptContent = $(element).html() ?? "";
        const scriptSrc = $(element).attr("src") ?? "";

        // Check for inline snippet
        if (scriptContent) {
          // Look for our snippet signature
          if (
            scriptContent.includes("window.analytics") &&
            (scriptContent.includes("analytics.load") ||
              scriptContent.includes("a.load"))
          ) {
            snippetFound = true;
            console.log("✅ Snippet found in script tag");

            // Check if it has the correct API key
            if (scriptContent.includes(apiKey)) {
              correctApiKey = true;
              console.log("✅ Correct API key found");
            } else {
              console.log(
                "❌ API key not found in snippet. Looking for:",
                apiKey,
              );
            }
          }
        }

        // Check for surface_analytics.js script tag
        if (
          scriptSrc.includes("surface_analytics.js") ||
          scriptSrc.includes("analytics.js")
        ) {
          scriptLoaded = true;
          console.log("✅ Script file reference found:", scriptSrc);
        }
      });

      // Method 2: Fallback - check raw HTML string (in case Cheerio parsing fails)
      if (!snippetFound) {
        console.log("Cheerio didn't find snippet, checking raw HTML...");

        if (
          html.includes("window.analytics") &&
          html.includes("analytics.load")
        ) {
          snippetFound = true;
          console.log("✅ Snippet found in raw HTML");

          if (html.includes(apiKey)) {
            correctApiKey = true;
            console.log("✅ Correct API key found in raw HTML");
          }
        }

        if (
          html.includes("surface_analytics.js") ||
          html.includes("/analytics.js")
        ) {
          scriptLoaded = true;
          console.log("✅ Script reference found in raw HTML");
        }
      }

      console.log(
        "Final check - snippetFound:",
        snippetFound,
        "correctApiKey:",
        correctApiKey,
        "scriptLoaded:",
        scriptLoaded,
      );

      // 4. Determine installation status
      const installed = snippetFound && correctApiKey;

      let message = "";
      if (installed) {
        message = "Script successfully installed and verified!";
      } else if (snippetFound && !correctApiKey) {
        message = `Snippet found but API key does not match. Expected: ${apiKey}`;
      } else if (!snippetFound) {
        message =
          "Snippet not found in <head> tag. Please ensure the snippet is installed.";
      }

      return {
        installed,
        snippetFound,
        scriptLoaded,
        message,
      };
    } catch (err) {
      console.error("Verification error:", err);
      return {
        installed: false,
        snippetFound: false,
        scriptLoaded: false,
        message: `Verification failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }
}
