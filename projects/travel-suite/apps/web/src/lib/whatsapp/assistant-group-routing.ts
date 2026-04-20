import "server-only";

type UnknownRecord = Record<string, unknown>;

const MAX_DEPTH = 8;
const MAX_SHAPE_KEYS = 16;

const EXACT_COMMANDS = new Set([
  "help",
  "?",
  "menu",
  "commands",
  "hi",
  "hello",
  "hey",
  "start",
  "today",
  "trips",
  "pickups",
  "pickup",
  "trips today",
  "leads",
  "lead",
  "new",
  "inbox",
  "payments",
  "payment",
  "pending",
  "due",
  "revenue",
  "money",
  "earnings",
  "income",
  "stats",
  "dashboard",
  "overview",
  "dashboard overview",
  "brief",
  "briefing",
  "summary",
  "morning",
  "daily briefing",
  "followups",
  "followup",
  "next",
  "collections",
  "collection",
  "cash",
  "work",
  "tasks",
  "task",
  "promises",
  "promise",
  "handoff",
  "commercial",
  "approvals",
  "approval",
  "trip check",
  "trip check today",
  "resume",
]);

const COMMAND_PATTERNS: readonly RegExp[] = [
  /^done\s+\d+$/i,
  /^resolve\s+\d+$/i,
  /^approve\s+\d+$/i,
  /^reject\s+\d+$/i,
  /^send payment link(?:\s+\d+)?$/i,
  /^payment promised(?:\s+.+)?$/i,
  /^snooze(?:\s+.+)?$/i,
  /^sent(?:\s+\d+)?$/i,
  /^client replied(?:\s+\d+)?$/i,
  /^not interested(?:\s+\d+)?$/i,
  /^create task\s+.+$/i,
  /^share link(?:\s+for)?\s+.+$/i,
  /^send pickup details(?:\s+\d+)?$/i,
  /^send proposal(?:\s+.+)?$/i,
  /^resend proposal(?:\s+.+)?$/i,
  /^send itinerary(?:\s+.+)?$/i,
  /^client wants changes(?:\s+.+)?$/i,
  /^revise\s+.+$/i,
  /^payment link for\s+.+$/i,
  /^.+\btrip to\b.+$/i,
  /^\d+\s+day\b.+$/i,
  /^.+\b\d+\s+day\b.*\btrip\b.*$/i,
  /^.+\b\d+\s+nights?\b.*\btrip\b.*$/i,
];

const ASSISTANT_AUTHORED_PATTERNS: readonly RegExp[] = [
  /^🧭/u,
  /^📋/u,
  /^new lead\b/i,
  /^quick commands you can type:?$/im,
  /^what do you want to do\?$/im,
  /^reply\s+\*/im,
  /\breply\s+(stats|leads|today|payments|handoff|followups|collections|work|promises|approvals|trip check today)\b/i,
];

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as UnknownRecord;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function extractTextFromNode(node: unknown, depth: number): string {
  if (depth > MAX_DEPTH) return "";

  const record = asRecord(node);
  if (!record) return "";

  const directConversation = readString(record.conversation);
  if (directConversation) return directConversation;

  const extendedText = readString(asRecord(record.extendedTextMessage)?.text);
  if (extendedText) return extendedText;

  const imageCaption = readString(asRecord(record.imageMessage)?.caption);
  if (imageCaption) return imageCaption;

  const videoCaption = readString(asRecord(record.videoMessage)?.caption);
  if (videoCaption) return videoCaption;

  const documentCaption = readString(asRecord(record.documentMessage)?.caption);
  if (documentCaption) return documentCaption;

  const explicitContainers = [
    record.ephemeralMessage,
    record.viewOnceMessage,
    record.viewOnceMessageV2,
    record.viewOnceMessageV2Extension,
    record.editedMessage,
    record.documentWithCaptionMessage,
  ];

  for (const container of explicitContainers) {
    const containerRecord = asRecord(container);
    const nestedText = extractTextFromNode(containerRecord?.message ?? containerRecord, depth + 1);
    if (nestedText) return nestedText;
  }

  for (const value of Object.values(record)) {
    const nestedText = extractTextFromNode(value, depth + 1);
    if (nestedText) return nestedText;
  }

  return "";
}

function containsAudioNode(node: unknown, depth: number): boolean {
  if (depth > MAX_DEPTH) return false;

  const record = asRecord(node);
  if (!record) return false;

  if (asRecord(record.audioMessage)) {
    return true;
  }

  return Object.values(record).some((value) => containsAudioNode(value, depth + 1));
}

function collectShapeKeys(
  node: unknown,
  depth: number,
  prefix: string,
  seen: Set<string>,
): void {
  if (depth > 3 || seen.size >= MAX_SHAPE_KEYS) return;

  const record = asRecord(node);
  if (!record) return;

  for (const [key, value] of Object.entries(record)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!seen.has(path)) {
      seen.add(path);
      if (seen.size >= MAX_SHAPE_KEYS) return;
    }

    if (typeof value === "object" && value !== null) {
      collectShapeKeys(value, depth + 1, path, seen);
      if (seen.size >= MAX_SHAPE_KEYS) return;
    }
  }
}

export function extractAssistantMessageText(message: unknown): string {
  return extractTextFromNode(message, 0);
}

export function hasAudioMessageContent(message: unknown): boolean {
  return containsAudioNode(message, 0);
}

export function describeAssistantMessageShape(message: unknown): string[] {
  const seen = new Set<string>();
  collectShapeKeys(message, 0, "", seen);
  return [...seen];
}

export function shouldAttemptAssistantGroupRouting(messageText: string): boolean {
  const normalized = messageText.trim().toLowerCase();
  if (!normalized) return false;

  if (ASSISTANT_AUTHORED_PATTERNS.some((pattern) => pattern.test(messageText))) {
    return false;
  }

  if (EXACT_COMMANDS.has(normalized)) {
    return true;
  }

  if (COMMAND_PATTERNS.some((pattern) => pattern.test(messageText))) {
    return true;
  }

  return normalized.length <= 240;
}
