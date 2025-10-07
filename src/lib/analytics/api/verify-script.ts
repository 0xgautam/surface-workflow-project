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
        return {
          installed: false,
          snippetFound: false,
          scriptLoaded: false,
          message: `Failed to fetch URL: ${response.status} ${response.statusText}`,
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // 2. Check for snippet in <head>
      let snippetFound = false;
      let correctApiKey = false;
      let scriptLoaded = false;

      // Look for inline script with our snippet pattern
      $("head script").each((_, element) => {
        const scriptContent = $(element).html() ?? "";

        // Check if it's our snippet (contains analytics.load)
        if (
          scriptContent.includes("window.analytics") &&
          scriptContent.includes("analytics.load")
        ) {
          snippetFound = true;

          // Check if it has the correct API key
          if (scriptContent.includes(apiKey)) {
            correctApiKey = true;
          }
        }
      });

      // 3. Check for surface_analytics.js script tag
      $("script").each((_, element) => {
        const src = $(element).attr("src") ?? "";
        if (
          src.includes("surface_analytics.js") ||
          src.includes("analytics.js")
        ) {
          scriptLoaded = true;
        }
      });

      // 4. Determine installation status
      const installed = snippetFound && correctApiKey;

      let message = "";
      if (installed) {
        message = "Script successfully installed and verified!";
      } else if (snippetFound && !correctApiKey) {
        message = "Snippet found but API key does not match";
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
