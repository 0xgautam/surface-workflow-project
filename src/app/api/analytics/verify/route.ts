import { NextResponse, type NextRequest } from "next/server";
import { verifyInstallationSchema } from "~/lib/analytics/api/validation";
import { ScriptVerifier } from "~/lib/analytics/api/verify-script";
import { db } from "~/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/analytics/verify
 * Verify script installation on user's website
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const body = await request.json();

    // 2. Validate schema
    const validation = verifyInstallationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { url, api_key } = validation.data;

    // 3. Verify project exists
    const project = await db.project.findUnique({
      where: { apiKey: api_key },
    });

    if (!project) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
    }

    // 4. Verify installation
    const verifier = new ScriptVerifier();
    const result = await verifier.verifyInstallation(url, api_key);

    // 5. Return result
    return NextResponse.json(result);
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json(
      {
        error: "Verification failed",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
