// RAG_PROVIDER options:
//   "pgvector" - recommended for this project (already used in apps/agents via pgvector==0.3.6)
//   "pinecone" - external alternative if needed
const REQUIRED_ENV_KEYS = [
  "RAG_PROVIDER",
  "RAG_VECTOR_INDEX",
  "RAG_EMBED_MODEL",
  "RAG_CHAT_MODEL"
];

function getConfig(env = process.env) {
  return {
    ragProvider: env.RAG_PROVIDER || "pgvector",
    ragVectorIndex: env.RAG_VECTOR_INDEX || "travel-suite-faq",
    ragEmbedModel: env.RAG_EMBED_MODEL || "text-embedding-3-small",
    ragChatModel: env.RAG_CHAT_MODEL || "gpt-4.1-mini",
    maxRetrievedChunks: Number(env.RAG_MAX_CHUNKS || 6),
    confirmationKeyword: env.RAG_CONFIRM_WORD || "yes",
    // pgvector connection - reuse existing Supabase instance
    supabaseUrl: env.SUPABASE_URL || "",
    supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY || ""
  };
}

function validateConfig(config) {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);
  return {
    ok: missing.length === 0,
    missing,
    config
  };
}

module.exports = {
  getConfig,
  validateConfig
};
