import { createClient } from "@/lib/supabase/server";
import { generateCSVExport } from "@/lib/assistant/export";

export async function POST(req: Request) {
  try {
    // Auth
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = (await req.json()) as {
      actionName?: string;
      data?: unknown;
    };

    if (!body.data) {
      return new Response(JSON.stringify({ error: "No data provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = generateCSVExport(body.actionName ?? null, body.data);

    if (!result) {
      return new Response(
        JSON.stringify({ error: "Data cannot be exported as CSV" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Return CSV as download
    return new Response(result.csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(JSON.stringify({ error: "Export failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
