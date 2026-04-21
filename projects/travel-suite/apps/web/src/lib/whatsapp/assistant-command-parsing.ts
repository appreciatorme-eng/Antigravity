export const KEYWORD_ALIASES: Record<string, string> = {
  "help": "help",
  "?": "help",
  "menu": "help",
  "commands": "help",
  "hi": "help",
  "hello": "help",
  "hey": "help",
  "start": "help",
  "today": "today",
  "trips": "today",
  "pickups": "today",
  "pickup": "today",
  "trips today": "today",
  "leads": "leads",
  "lead": "leads",
  "new": "leads",
  "inbox": "leads",
  "payments": "payments",
  "payment": "payments",
  "pending": "payments",
  "due": "payments",
  "revenue": "revenue",
  "money": "revenue",
  "earnings": "revenue",
  "income": "revenue",
  "stats": "stats",
  "dashboard": "stats",
  "overview": "stats",
  "dashboard overview": "stats",
  "brief": "brief",
  "briefing": "brief",
  "summary": "brief",
  "morning": "brief",
  "daily briefing": "brief",
  "followups": "followups",
  "followup": "followups",
  "next": "followups",
  "collections": "collections",
  "collection": "collections",
  "cash": "collections",
  "work": "work",
  "tasks": "work",
  "task": "work",
  "promises": "promises",
  "promise": "promises",
  "handoff": "handoff",
  "commercial": "handoff",
  "approvals": "approvals",
  "approval": "approvals",
  "trip check": "trip_check",
  "trip check today": "trip_check",
};

export function parseIndexCommand(input: string, command: string): number | null {
  const regex = new RegExp(`^${command}\\s+(\\d+)$`, "i");
  const match = regex.exec(input.trim());
  return match ? Number.parseInt(match[1] ?? "0", 10) : null;
}

export function parseSnoozeCommand(
  input: string,
): { readonly index: number | null; readonly days: number | null; readonly dueText: string | null } | null {
  const match = /^snooze(?:\s+(\d+))?\s+(.+)$/i.exec(input.trim());
  if (!match) return null;

  const index = match[1] ? Number.parseInt(match[1], 10) : null;
  const dueText = match[2]?.trim() ?? null;
  if (!dueText) return null;

  const daysMatch = /^(\d+)\s+days?$/i.exec(dueText);
  return {
    index,
    days: daysMatch ? Number.parseInt(daysMatch[1] ?? "0", 10) : null,
    dueText: daysMatch ? null : dueText,
  };
}

export function parsePromiseCommand(
  input: string,
): { readonly index: number | null; readonly dueText: string } | null {
  const match = /^payment promised(?:\s+(\d+))?\s+(.+)$/i.exec(input.trim());
  if (!match || !match[2]) return null;

  return {
    index: match[1] ? Number.parseInt(match[1], 10) : null,
    dueText: match[2].trim(),
  };
}

export function parseCreateTaskCommand(input: string): string | null {
  const match = /^create task\s+(.+)$/i.exec(input.trim());
  return match?.[1]?.trim() || null;
}

export function parseArtifactCommand(
  input: string,
  verb: "send proposal" | "resend proposal" | "send itinerary",
): { readonly index: number | null; readonly query: string | null } | null {
  const match = new RegExp(`^${verb}(?:\\s+(\\d+)|\\s+for\\s+(.+))$`, "i").exec(input.trim());
  if (!match) return null;
  return {
    index: match[1] ? Number.parseInt(match[1], 10) : null,
    query: match[2]?.trim() || null,
  };
}

export function parseTripFormLinkCommand(
  input: string,
): { readonly query: string | null } | null {
  const trimmed = input.trim();
  const exactCommands = new Set([
    "trip form link",
    "trip request link",
    "intake link",
    "share intake link",
    "share trip form",
  ]);

  if (exactCommands.has(trimmed.toLowerCase())) {
    return { query: null };
  }

  const match = /^(?:trip form link|trip request link|intake link)(?:\s+for\s+(.+))$/i.exec(trimmed);
  if (!match) return null;
  return { query: match[1]?.trim() || null };
}
