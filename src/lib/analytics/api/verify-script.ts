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

      // Remove HTML comments to avoid false positives
      const htmlWithoutComments = this.removeHtmlComments(html);

      const $ = cheerio.load(html, {
        scriptingEnabled: true,
      });

      console.log("Fetched HTML length:", html.length);

      let snippetFound = false;
      let correctApiKey = false;
      let scriptLoaded = false;

      // Check for NEW snippet pattern (GTM-style) using Cheerio
      $("script").each((_, element) => {
        const scriptContent = $(element).html() ?? "";
        const scriptSrc = $(element).attr("src") ?? "";

        // Look for Surface snippet signature - be flexible with quotes
        const hasSnippetPattern =
          scriptContent.includes("window, document") &&
          (scriptContent.includes("'surface'") ||
            scriptContent.includes('"surface"'));

        if (hasSnippetPattern) {
          snippetFound = true;
          console.log("✅ Surface snippet pattern found in script tag");

          // Check if it has the correct API key
          if (
            scriptContent.includes(`'${apiKey}'`) ||
            scriptContent.includes(`"${apiKey}"`)
          ) {
            correctApiKey = true;
            console.log("✅ Correct API key found in snippet");
          } else {
            console.log("❌ API key not found. Searching for:", apiKey);
          }
        }

        // Check for tag.js script reference
        if (
          scriptSrc.includes("tag.js") &&
          scriptSrc.includes(`id=${apiKey}`)
        ) {
          scriptLoaded = true;
          console.log("✅ tag.js reference found with correct API key");
        }
      });

      // Fallback: Check raw HTML WITHOUT COMMENTS (more reliable)
      if (!snippetFound) {
        console.log(
          "Cheerio didn't find snippet, checking raw HTML (without comments)...",
        );

        // Check for snippet pattern with flexible quotes
        const snippetPatterns = [
          "window, document, 'script', 'surface'",
          'window, document, "script", "surface"',
          "window,document,'script','surface'",
          'window,document,"script","surface"',
        ];

        for (const pattern of snippetPatterns) {
          if (htmlWithoutComments.includes(pattern)) {
            snippetFound = true;
            console.log("✅ Snippet pattern found in raw HTML:", pattern);
            break;
          }
        }

        // Check for API key (only if snippet was found)
        if (snippetFound && htmlWithoutComments.includes(apiKey)) {
          correctApiKey = true;
          console.log("✅ API key found in raw HTML");
        }
      }

      // Check for tag.js in raw HTML WITHOUT COMMENTS
      if (!scriptLoaded && htmlWithoutComments.includes("tag.js")) {
        const tagJsPatterns = [
          `id=${apiKey}`,
          `id='${apiKey}'`,
          `id="${apiKey}"`,
        ];

        for (const pattern of tagJsPatterns) {
          if (htmlWithoutComments.includes(pattern)) {
            scriptLoaded = true;
            console.log("✅ tag.js found in raw HTML with pattern:", pattern);
            break;
          }
        }
      }

      console.log("Final check:", {
        snippetFound,
        correctApiKey,
        scriptLoaded,
      });

      const installed = snippetFound && correctApiKey;

      let message = "";
      if (installed) {
        message = "✅ Surface Tag successfully installed and verified!";
      } else if (snippetFound && !correctApiKey) {
        message = `⚠️ Snippet found but API key does not match. Expected: ${apiKey}`;
      } else if (!snippetFound) {
        message =
          "❌ Surface Tag snippet not found. Please ensure the snippet is installed in your <head> tag.";
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

  /**
   * Remove HTML comments from HTML string
   * This prevents false positives from commented-out scripts
   */
  private removeHtmlComments(html: string): string {
    // Remove single-line and multi-line HTML comments
    // Pattern: <!-- anything -->
    return html.replace(/<!--[\s\S]*?-->/g, "");
  }
}
