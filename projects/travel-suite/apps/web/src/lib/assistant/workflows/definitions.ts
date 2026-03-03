import "server-only";

/* ------------------------------------------------------------------
 * Guided Workflow Definitions -- multi-step conversational flows.
 *
 * Each workflow defines a sequence of steps that collect structured
 * input from the user through natural conversation. Steps are
 * executed sequentially -- no LLM call needed for the flow control.
 *
 * Pure type definitions + static workflow configurations.
 * ------------------------------------------------------------------ */

// Types

export interface WorkflowStep {
  readonly id: string;
  readonly prompt: string;
  readonly field: string;
  readonly type: "text" | "date" | "number" | "select";
  readonly options?: readonly string[];
  readonly required: boolean;
  readonly validate?: (value: string) => string | null; // returns error message or null
}

export interface WorkflowDefinition {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly triggerPatterns: readonly RegExp[];
  readonly steps: readonly WorkflowStep[];
  readonly actionName: string;
  readonly buildParams: (collected: Record<string, string>) => Record<string, unknown>;
  readonly successMessage: string;
}

// Validators

const isNotEmpty = (value: string): string | null =>
  value.trim().length > 0 ? null : "This field cannot be empty.";

const isValidDate = (value: string): string | null => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) return "Please use YYYY-MM-DD format (e.g. 2026-03-15).";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Invalid date.";
  return null;
};

const isPositiveNumber = (value: string): string | null => {
  const num = Number(value);
  if (isNaN(num) || num <= 0) return "Please enter a positive number.";
  return null;
};

// Workflow: Create a Trip

const createTripWorkflow: WorkflowDefinition = {
  id: "create_trip",
  name: "Create a Trip",
  description: "Step-by-step trip creation wizard",
  triggerPatterns: [
    /^create\s+(a\s+)?(new\s+)?trip/i,
    /^new\s+trip/i,
    /^add\s+(a\s+)?trip/i,
    /^book\s+(a\s+)?trip/i,
    /^start\s+(a\s+)?(new\s+)?trip/i,
  ],
  steps: [
    {
      id: "client_name",
      prompt: "Who is this trip for? (client name)",
      field: "client_name",
      type: "text",
      required: true,
      validate: isNotEmpty,
    },
    {
      id: "destination",
      prompt: "What's the destination?",
      field: "destination",
      type: "text",
      required: true,
      validate: isNotEmpty,
    },
    {
      id: "start_date",
      prompt: "When does the trip start? (YYYY-MM-DD)",
      field: "start_date",
      type: "date",
      required: true,
      validate: isValidDate,
    },
    {
      id: "end_date",
      prompt: "When does the trip end? (YYYY-MM-DD)",
      field: "end_date",
      type: "date",
      required: true,
      validate: isValidDate,
    },
    {
      id: "num_travelers",
      prompt: "How many travelers?",
      field: "num_travelers",
      type: "number",
      required: true,
      validate: isPositiveNumber,
    },
    {
      id: "notes",
      prompt: "Any special notes or requirements? (or type 'skip')",
      field: "notes",
      type: "text",
      required: false,
    },
  ],
  actionName: "create_trip",
  buildParams: (collected) => ({
    client_name: collected.client_name,
    destination: collected.destination,
    start_date: collected.start_date,
    end_date: collected.end_date,
    num_travelers: Number(collected.num_travelers),
    notes: collected.notes === "skip" ? "" : (collected.notes ?? ""),
  }),
  successMessage: "Trip created successfully! You can view it in your trips dashboard.",
};

// Workflow: Onboard a Client

const onboardClientWorkflow: WorkflowDefinition = {
  id: "onboard_client",
  name: "Onboard a Client",
  description: "Add a new client to your system",
  triggerPatterns: [
    /^(add|create|onboard|register)\s+(a\s+)?(new\s+)?client/i,
    /^new\s+client/i,
  ],
  steps: [
    {
      id: "full_name",
      prompt: "What's the client's full name?",
      field: "full_name",
      type: "text",
      required: true,
      validate: isNotEmpty,
    },
    {
      id: "email",
      prompt: "What's their email address?",
      field: "email",
      type: "text",
      required: true,
      validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "Please enter a valid email.",
    },
    {
      id: "phone",
      prompt: "What's their phone number? (or type 'skip')",
      field: "phone",
      type: "text",
      required: false,
    },
    {
      id: "lifecycle_stage",
      prompt: "What stage is this client? Choose: new_lead, inquiry, proposal_sent, active, repeat_client",
      field: "lifecycle_stage",
      type: "select",
      options: ["new_lead", "inquiry", "proposal_sent", "active", "repeat_client"],
      required: true,
    },
    {
      id: "notes",
      prompt: "Any notes about this client? (or type 'skip')",
      field: "notes",
      type: "text",
      required: false,
    },
  ],
  actionName: "create_client",
  buildParams: (collected) => ({
    full_name: collected.full_name,
    email: collected.email,
    phone: collected.phone === "skip" ? "" : (collected.phone ?? ""),
    lifecycle_stage: collected.lifecycle_stage,
    notes: collected.notes === "skip" ? "" : (collected.notes ?? ""),
  }),
  successMessage: "Client onboarded successfully! They'll appear in your clients list.",
};

// Workflow: Create an Invoice

const createInvoiceWorkflow: WorkflowDefinition = {
  id: "create_invoice",
  name: "Create an Invoice",
  description: "Generate an invoice for a client",
  triggerPatterns: [
    /^(create|generate|make|send)\s+(a\s+)?(new\s+)?invoice/i,
    /^new\s+invoice/i,
    /^invoice\s+(a\s+)?client/i,
  ],
  steps: [
    {
      id: "client_name",
      prompt: "Which client is this invoice for?",
      field: "client_name",
      type: "text",
      required: true,
      validate: isNotEmpty,
    },
    {
      id: "amount",
      prompt: "What's the total amount?",
      field: "amount",
      type: "number",
      required: true,
      validate: isPositiveNumber,
    },
    {
      id: "currency",
      prompt: "Currency? (INR, USD, EUR, GBP)",
      field: "currency",
      type: "select",
      options: ["INR", "USD", "EUR", "GBP"],
      required: true,
    },
    {
      id: "due_date",
      prompt: "When is the payment due? (YYYY-MM-DD)",
      field: "due_date",
      type: "date",
      required: true,
      validate: isValidDate,
    },
    {
      id: "description",
      prompt: "Brief description of the invoice (e.g. 'Rajasthan tour package')",
      field: "description",
      type: "text",
      required: true,
      validate: isNotEmpty,
    },
  ],
  actionName: "create_invoice",
  buildParams: (collected) => ({
    client_name: collected.client_name,
    amount: Number(collected.amount),
    currency: collected.currency,
    due_date: collected.due_date,
    description: collected.description,
  }),
  successMessage: "Invoice created! The client will be notified.",
};

// Registry

export const ALL_WORKFLOWS: readonly WorkflowDefinition[] = [
  createTripWorkflow,
  onboardClientWorkflow,
  createInvoiceWorkflow,
];

/**
 * Find a workflow matching the user's message.
 * Returns null if no workflow trigger matches.
 */
export function findWorkflow(message: string): WorkflowDefinition | null {
  const trimmed = message.trim();
  for (const workflow of ALL_WORKFLOWS) {
    if (workflow.triggerPatterns.some((p) => p.test(trimmed))) {
      return workflow;
    }
  }
  return null;
}
