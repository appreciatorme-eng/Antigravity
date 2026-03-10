import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { embedAllTemplates } from "@/lib/embeddings";
import { safeErrorMessage } from "@/lib/security/safe-error";

type AdminAuth = Awaited<ReturnType<typeof requireAdmin>>;

async function auditAdminAction(
  admin: Extract<AdminAuth, { ok: true }>,
  action: string,
  detail: string
) {
  try {
    const nowIso = new Date().toISOString();
    await admin.adminClient.from("notification_logs").insert({
      recipient_id: admin.userId,
      recipient_type: "admin",
      notification_type: "admin_audit",
      title: action,
      body: detail,
      status: "sent",
      sent_at: nowIso,
      updated_at: nowIso,
    });
  } catch {
    // Audit logging should not block admin operations.
  }
}

/**
 * Admin endpoint to generate v2 embeddings for all tour templates
 *
 * This should be run once after applying the RAG migration to embed existing templates.
 * It can also be run periodically to re-generate embeddings after template updates.
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req, { requireOrganization: false });
  if (!admin.ok) return admin.response;

  try {
    await auditAdminAction(
      admin,
      "Generate embeddings triggered",
      `Admin ${admin.userId} triggered template embedding regeneration for Gemini v2 vectors.`
    );

    const result = await embedAllTemplates();

    if (result.errors.length > 0) {
      console.error(`Embedding generation completed with ${result.errors.length} errors:`, result.errors);
    }

    await auditAdminAction(
      admin,
      "Generate embeddings completed",
      `Processed ${result.processed} templates with ${result.errors.length} errors using ${result.model}.`
    );

    return NextResponse.json({
      success: true,
      templatesProcessed: result.processed,
      templatesWithErrors: result.errors.length,
      errors: result.errors,
      embeddingModel: result.model,
      embeddingVersion: result.version,
      message: `Successfully processed ${result.processed} templates with ${result.model}. ${result.errors.length} errors encountered.`,
    });
  } catch (error) {
    console.error("Batch embedding generation failed:", error);

    await auditAdminAction(
      admin,
      "Generate embeddings failed",
      safeErrorMessage(error, "Request failed")
    );

    return NextResponse.json(
      {
        success: false,
        error: safeErrorMessage(error, "Request failed"),
        message: "Failed to generate embeddings. Check server logs for details.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check v2 embedding generation status
 */
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req, { requireOrganization: false });
  if (!admin.ok) return admin.response;

  try {
    // Count templates with and without v2 embeddings
    const { count: total } = await admin.adminClient.from("tour_templates").select("*", { count: "exact", head: true });

    const { count: withEmbeddings } = await admin.adminClient
      .from("tour_templates")
      .select("*", { count: "exact", head: true })
      .not("embedding_v2", "is", null);

    await auditAdminAction(
      admin,
      "Generate embeddings status viewed",
      `Admin ${admin.userId} viewed Gemini v2 embedding coverage status.`
    );

    return NextResponse.json({
      totalTemplates: total || 0,
      withEmbeddingsV2: withEmbeddings || 0,
      withoutEmbeddingsV2: (total || 0) - (withEmbeddings || 0),
      percentageComplete: total ? Math.round(((withEmbeddings || 0) / total) * 100) : 0,
    });
  } catch (error) {
    console.error("Failed to get embedding stats:", error);

    return NextResponse.json(
      {
        success: false,
        error: safeErrorMessage(error, "Request failed"),
      },
      { status: 500 }
    );
  }
}
