import "server-only";

import { env } from "@/lib/config/env";
import { logEvent, logError } from "@/lib/observability/logger";

export const EMBEDDING_MODEL_V2 = "gemini-embedding-001";
export const EMBEDDING_VERSION_V2 = 2;
export const EMBEDDING_DIMENSIONS_V2 = 1536;

type EmbeddingTaskType =
  | "RETRIEVAL_QUERY"
  | "RETRIEVAL_DOCUMENT"
  | "SEMANTIC_SIMILARITY";

interface GeminiEmbeddingResponse {
  embedding?: {
    values?: number[];
  };
}

function truncateEmbeddingText(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, 8_000);
}

export function isEmbeddingV2Configured(): boolean {
  return Boolean(env.google.geminiApiKey);
}

export function toVectorLiteral(values: readonly number[]): string {
  return `[${values.join(",")}]`;
}

async function requestEmbedding(
  text: string,
  taskType: EmbeddingTaskType,
  title?: string,
): Promise<number[]> {
  const apiKey = env.google.geminiApiKey;
  if (!apiKey) {
    logEvent('warn', "[embeddings-v2] GOOGLE_GEMINI_API_KEY is not configured");
    return [];
  }

  const sanitized = truncateEmbeddingText(text);
  if (!sanitized) {
    return [];
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL_V2}:embedContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: `models/${EMBEDDING_MODEL_V2}`,
          content: {
            parts: [{ text: sanitized }],
          },
          taskType,
          outputDimensionality: EMBEDDING_DIMENSIONS_V2,
          ...(title ? { title } : {}),
        }),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      logError(
        "[embeddings-v2] Gemini embedding request failed",
        response.status,
      );
      return [];
    }

    const body = (await response.json()) as GeminiEmbeddingResponse;
    const values = body.embedding?.values ?? [];

    // Dimension lock: gemini-embedding-001 = 1536. Change this only with a DB migration.
    if (values.length > 0 && values.length !== EMBEDDING_DIMENSIONS_V2) {
      throw new Error(
        `Unexpected embedding dimension: ${values.length}. Expected ${EMBEDDING_DIMENSIONS_V2} (${EMBEDDING_MODEL_V2}). ` +
        "If you changed embedding models, update vector column dimensions in all migrations.",
      );
    }

    return values;
  } catch (error) {
    logError("[embeddings-v2] Gemini embedding error", error);
    return [];
  }
}

export async function generateDocumentEmbeddingV2(
  text: string,
  title?: string,
): Promise<number[]> {
  return requestEmbedding(text, "RETRIEVAL_DOCUMENT", title);
}

export async function generateQueryEmbeddingV2(text: string): Promise<number[]> {
  return requestEmbedding(text, "RETRIEVAL_QUERY");
}

export async function generateSemanticEmbeddingV2(
  text: string,
): Promise<number[]> {
  return requestEmbedding(text, "SEMANTIC_SIMILARITY");
}
