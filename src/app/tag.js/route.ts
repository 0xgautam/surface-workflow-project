import { NextResponse, type NextRequest } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import { db } from "~/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /tag.js?id=SURFACE_TAG_ID
 * Serves the analytics script with the API key baked in
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Get API key from query params
    const searchParams = request.nextUrl.searchParams;
    const apiKey = searchParams.get("id");

    if (!apiKey) {
      return new NextResponse(
        "// Error: Missing API key parameter (?id=SURFACE_TAG_ID)",
        {
          status: 400,
          headers: {
            "Content-Type": "application/javascript",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        },
      );
    }

    // 2. Verify API key exists in database
    const project = await db.project.findUnique({
      where: { apiKey },
    });

    if (!project) {
      return new NextResponse(`// Error: Invalid API key: ${apiKey}`, {
        status: 401,
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });
    }

    // 3. Read the bundled analytics script
    const scriptPath = join(process.cwd(), "public", "surface_analytics.js");
    let scriptContent = readFileSync(scriptPath, "utf-8");

    // 4. Inject the API key into the script
    scriptContent = scriptContent.replace(
      "const SURFACE_API_KEY = null;",
      `const SURFACE_API_KEY = "${apiKey}";`,
    );

    // 5. Return the script with proper headers
    return new NextResponse(scriptContent, {
      status: 200,
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
        "Access-Control-Allow-Origin": "*", // Allow cross-origin loading
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Tag.js error:", err);
    return new NextResponse(
      `// Error loading Surface Analytics: ${err instanceof Error ? err.message : "Unknown error"}`,
      {
        status: 500,
        headers: {
          "Content-Type": "application/javascript",
        },
      },
    );
  }
}
