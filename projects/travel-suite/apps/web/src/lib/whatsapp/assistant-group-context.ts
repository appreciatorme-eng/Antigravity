import "server-only";

export interface AssistantGroupConnectionCandidate {
  readonly organization_id?: string | null;
  readonly assistant_group_jid?: string | null;
  readonly phone_number?: string | null;
  readonly session_name?: string | null;
  readonly session_token?: string | null;
  readonly updated_at?: string | null;
}

export interface AssistantGroupResolution {
  readonly connection: AssistantGroupConnectionCandidate | null;
  readonly matchedBy:
    | "session_row"
    | "assistant_group_jid_session_name"
    | "assistant_group_jid_session_token"
    | "assistant_group_jid"
    | null;
  readonly failureReason:
    | "missing_incoming_group_jid"
    | "missing_session_connection"
    | "no_matching_assistant_group"
    | null;
}

export function normalizeAssistantGroupJid(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveAssistantGroupConnection(params: {
  readonly instanceName: string;
  readonly incomingGroupJid: string | null;
  readonly sessionConnection: AssistantGroupConnectionCandidate | null;
  readonly candidateRows: readonly AssistantGroupConnectionCandidate[];
}): AssistantGroupResolution {
  const incomingGroupJid = normalizeAssistantGroupJid(params.incomingGroupJid);
  if (!incomingGroupJid) {
    return {
      connection: null,
      matchedBy: null,
      failureReason: "missing_incoming_group_jid",
    };
  }

  const sessionConnection = params.sessionConnection;
  const sessionStoredGroupJid = normalizeAssistantGroupJid(sessionConnection?.assistant_group_jid);
  if (sessionConnection?.organization_id && sessionStoredGroupJid === incomingGroupJid) {
    return {
      connection: sessionConnection,
      matchedBy: "session_row",
      failureReason: null,
    };
  }

  const candidates = params.candidateRows.filter((row) => (
    Boolean(row.organization_id)
    && normalizeAssistantGroupJid(row.assistant_group_jid) === incomingGroupJid
  ));

  if (candidates.length === 0) {
    return {
      connection: null,
      matchedBy: null,
      failureReason: sessionConnection ? "no_matching_assistant_group" : "missing_session_connection",
    };
  }

  const sessionNameMatch = candidates.find((row) => row.session_name === params.instanceName);
  if (sessionNameMatch) {
    return {
      connection: sessionNameMatch,
      matchedBy: "assistant_group_jid_session_name",
      failureReason: null,
    };
  }

  const sessionTokenMatch = candidates.find((row) => row.session_token === params.instanceName);
  if (sessionTokenMatch) {
    return {
      connection: sessionTokenMatch,
      matchedBy: "assistant_group_jid_session_token",
      failureReason: null,
    };
  }

  return {
    connection: candidates[0] ?? null,
    matchedBy: "assistant_group_jid",
    failureReason: null,
  };
}
