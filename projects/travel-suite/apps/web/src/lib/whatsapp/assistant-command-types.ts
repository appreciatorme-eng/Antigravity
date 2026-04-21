import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type {
  ActionContext,
  ConversationMessage,
} from "@/lib/assistant/types";
import type { SessionReferenceItem } from "@/lib/assistant/session";

export type AdminClient = SupabaseClient<Database>;

export interface CommandContext {
  readonly admin: AdminClient;
  readonly orgId: string;
  readonly ownerUserId: string;
  readonly instanceName: string;
  readonly replyInstanceName: string;
  readonly groupJid: string;
  readonly actionCtx: ActionContext;
  readonly sessionId: string;
  readonly conversationHistory: readonly ConversationMessage[];
}

export interface CommandReply {
  readonly reply: string;
  readonly references?: {
    readonly kind: string;
    readonly items: readonly SessionReferenceItem[];
  };
}
