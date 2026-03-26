import "server-only";

/* ------------------------------------------------------------------
 * Automation Rule Templates -- pre-built workflow configurations.
 *
 * Each template defines a common operator automation pattern:
 * trigger conditions → delay → action (WhatsApp/email) → stop conditions.
 *
 * Pure type definitions + static template configurations.
 * ------------------------------------------------------------------ */

// Types

export interface TriggerConfig {
  readonly entity_type: "proposal" | "payment" | "trip" | "booking" | "client" | "itinerary";
  readonly delay_hours: number;
  readonly trigger_event: "created" | "updated" | "status_changed" | "date_approaching";
  readonly status_filter?: readonly string[];
  readonly date_field?: string;
  readonly days_before?: number;
}

export interface ActionConfig {
  readonly channel: "whatsapp" | "email" | "both";
  readonly message_template: string;
  readonly message_variables: readonly string[];
}

export interface StopCondition {
  readonly field: string;
  readonly operator: "equals" | "not_equals" | "exists" | "greater_than" | "less_than";
  readonly value: string | boolean | number;
  readonly description: string;
}

export type AutomationTemplateId =
  | "proposal_followup" | "payment_reminder" | "review_request" | "trip_countdown"
  | "welcome_message" | "itinerary_shared" | "booking_confirmation" | "packing_reminder"
  | "departure_day" | "post_trip_thanks" | "anniversary_reminder" | "payment_received";

export interface AutomationTemplate {
  readonly id: AutomationTemplateId;
  readonly name: string;
  readonly description: string;
  readonly category: "sales" | "operations" | "customer_success";
  readonly trigger_config: TriggerConfig;
  readonly action_config: ActionConfig;
  readonly stop_conditions: readonly StopCondition[];
  readonly enabled_by_default: boolean;
  readonly priority: number;
}

// Templates

const proposalFollowupTemplate: AutomationTemplate = {
  id: "proposal_followup",
  name: "Proposal Follow-Up",
  description: "Send WhatsApp follow-up 24 hours after proposal is sent if client hasn't viewed it",
  category: "sales",
  trigger_config: {
    entity_type: "proposal",
    delay_hours: 24,
    trigger_event: "created",
    status_filter: ["sent", "pending"],
  },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! 👋\n\nI sent you a travel proposal for {{destination}} yesterday. Have you had a chance to review it?\n\nLet me know if you have any questions or need any changes!\n\n{{operator_name}}",
    message_variables: ["client_name", "destination", "operator_name"],
  },
  stop_conditions: [
    {
      field: "viewed_at",
      operator: "exists",
      value: true,
      description: "Stop if proposal was viewed",
    },
    {
      field: "status",
      operator: "equals",
      value: "accepted",
      description: "Stop if proposal was accepted",
    },
    {
      field: "status",
      operator: "equals",
      value: "rejected",
      description: "Stop if proposal was rejected",
    },
  ],
  enabled_by_default: true,
  priority: 1,
};

const paymentReminderTemplate: AutomationTemplate = {
  id: "payment_reminder",
  name: "Payment Reminder",
  description: "Send automated reminder 3 days before payment due date",
  category: "operations",
  trigger_config: {
    entity_type: "payment",
    delay_hours: 0,
    trigger_event: "date_approaching",
    date_field: "due_date",
    days_before: 3,
    status_filter: ["pending", "overdue"],
  },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! 💳\n\nFriendly reminder that your payment of ₹{{amount}} for {{trip_name}} is due on {{due_date}}.\n\nYou can make the payment here: {{payment_link}}\n\nThank you!\n{{operator_name}}",
    message_variables: ["client_name", "amount", "trip_name", "due_date", "payment_link", "operator_name"],
  },
  stop_conditions: [
    {
      field: "status",
      operator: "equals",
      value: "paid",
      description: "Stop if payment was completed",
    },
    {
      field: "status",
      operator: "equals",
      value: "cancelled",
      description: "Stop if payment was cancelled",
    },
  ],
  enabled_by_default: true,
  priority: 2,
};

const reviewRequestTemplate: AutomationTemplate = {
  id: "review_request",
  name: "Review Request",
  description: "Request review 24 hours after trip completion",
  category: "customer_success",
  trigger_config: {
    entity_type: "trip",
    delay_hours: 24,
    trigger_event: "status_changed",
    status_filter: ["completed"],
  },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! 🌟\n\nI hope you had an amazing trip to {{destination}}! We'd love to hear about your experience.\n\nWould you mind sharing a quick review? It helps us improve and helps other travelers too!\n\nReview link: {{review_link}}\n\nThank you!\n{{operator_name}}",
    message_variables: ["client_name", "destination", "review_link", "operator_name"],
  },
  stop_conditions: [
    {
      field: "review_submitted",
      operator: "exists",
      value: true,
      description: "Stop if review was already submitted",
    },
    {
      field: "status",
      operator: "equals",
      value: "cancelled",
      description: "Stop if trip was cancelled",
    },
  ],
  enabled_by_default: true,
  priority: 3,
};

const tripCountdownTemplate: AutomationTemplate = {
  id: "trip_countdown",
  name: "Trip Countdown",
  description: "Send countdown reminder to travelers before trip start date",
  category: "customer_success",
  trigger_config: {
    entity_type: "trip",
    delay_hours: 0,
    trigger_event: "date_approaching",
    date_field: "start_date",
    days_before: 7,
    status_filter: ["confirmed", "active"],
  },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! 🎒\n\nYour trip to {{destination}} is coming up in {{days_remaining}} days ({{start_date}})!\n\nMake sure you have:\n✅ Travel documents\n✅ Bookings confirmed\n✅ Emergency contacts saved\n\nExcited for your adventure!\n{{operator_name}}",
    message_variables: ["client_name", "destination", "days_remaining", "start_date", "operator_name"],
  },
  stop_conditions: [
    {
      field: "status",
      operator: "equals",
      value: "cancelled",
      description: "Stop if trip was cancelled",
    },
    {
      field: "status",
      operator: "equals",
      value: "completed",
      description: "Stop if trip already completed",
    },
  ],
  enabled_by_default: true,
  priority: 4,
};

// ── New templates ────────────────────────────────────────────────────────────

const welcomeMessageTemplate: AutomationTemplate = {
  id: "welcome_message",
  name: "Welcome Message",
  description: "Send a warm welcome when a new client is added to your CRM",
  category: "sales",
  trigger_config: { entity_type: "client", delay_hours: 0, trigger_event: "created" },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! 👋 Welcome aboard! I'm {{operator_name}}, your personal travel consultant. I'll help you plan unforgettable trips. Feel free to message me anytime with your travel ideas!",
    message_variables: ["client_name", "operator_name"],
  },
  stop_conditions: [],
  enabled_by_default: true,
  priority: 1,
};

const itinerarySharedTemplate: AutomationTemplate = {
  id: "itinerary_shared",
  name: "Itinerary Shared",
  description: "Confirm when an itinerary link is shared with a client",
  category: "sales",
  trigger_config: { entity_type: "itinerary", delay_hours: 0, trigger_event: "status_changed", status_filter: ["shared"] },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! ✈️ Your {{destination}} itinerary is ready! Check it out and let me know if you'd like any changes. I'm here to make it perfect for you!",
    message_variables: ["client_name", "destination"],
  },
  stop_conditions: [{ field: "status", operator: "equals", value: "approved", description: "Client already approved" }],
  enabled_by_default: true,
  priority: 2,
};

const bookingConfirmationTemplate: AutomationTemplate = {
  id: "booking_confirmation",
  name: "Booking Confirmation",
  description: "Celebrate when a trip is confirmed with the client",
  category: "operations",
  trigger_config: { entity_type: "trip", delay_hours: 0, trigger_event: "status_changed", status_filter: ["confirmed"] },
  action_config: {
    channel: "whatsapp",
    message_template: "Great news, {{client_name}}! 🎉 Your {{destination}} trip is confirmed for {{trip_date}}. We'll keep you updated as the departure date approaches. Get excited!",
    message_variables: ["client_name", "destination", "trip_date"],
  },
  stop_conditions: [],
  enabled_by_default: true,
  priority: 3,
};

const packingReminderTemplate: AutomationTemplate = {
  id: "packing_reminder",
  name: "Packing Reminder",
  description: "Friendly reminder 3 days before trip to start packing",
  category: "operations",
  trigger_config: { entity_type: "trip", delay_hours: 0, trigger_event: "date_approaching", date_field: "start_date", days_before: 3 },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! 🧳 Your {{destination}} trip is in 3 days! Time to start packing. Don't forget your passport, travel insurance docs, and comfortable shoes. Need any last-minute help?",
    message_variables: ["client_name", "destination"],
  },
  stop_conditions: [{ field: "status", operator: "equals", value: "cancelled", description: "Trip was cancelled" }],
  enabled_by_default: true,
  priority: 6,
};

const departureDayTemplate: AutomationTemplate = {
  id: "departure_day",
  name: "Day-of Departure",
  description: "Wish safe travels on the departure day",
  category: "operations",
  trigger_config: { entity_type: "trip", delay_hours: 0, trigger_event: "date_approaching", date_field: "start_date", days_before: 0 },
  action_config: {
    channel: "whatsapp",
    message_template: "Today's the day, {{client_name}}! 🌟 Safe travels to {{destination}}! If you need anything during your trip, I'm just a message away. Have an amazing time!",
    message_variables: ["client_name", "destination"],
  },
  stop_conditions: [{ field: "status", operator: "equals", value: "cancelled", description: "Trip was cancelled" }],
  enabled_by_default: true,
  priority: 7,
};

const postTripThanksTemplate: AutomationTemplate = {
  id: "post_trip_thanks",
  name: "Post-Trip Thank You",
  description: "Thank the client 2 days after their trip ends",
  category: "customer_success",
  trigger_config: { entity_type: "trip", delay_hours: 48, trigger_event: "status_changed", status_filter: ["completed"] },
  action_config: {
    channel: "whatsapp",
    message_template: "Welcome back, {{client_name}}! 🏠 Hope you had an amazing time in {{destination}}! I'd love to hear about your favorite moments. When you have a minute, a quick review would mean the world to us! ⭐",
    message_variables: ["client_name", "destination"],
  },
  stop_conditions: [],
  enabled_by_default: true,
  priority: 9,
};

const anniversaryReminderTemplate: AutomationTemplate = {
  id: "anniversary_reminder",
  name: "Anniversary Reminder",
  description: "Reach out 1 year after their trip for repeat business",
  category: "customer_success",
  trigger_config: { entity_type: "trip", delay_hours: 0, trigger_event: "date_approaching", date_field: "start_date", days_before: -365 },
  action_config: {
    channel: "whatsapp",
    message_template: "Hi {{client_name}}! 🎂 Can you believe it's been a year since your {{destination}} trip? Time flies! Ready for another adventure? I have some amazing destinations in mind for you!",
    message_variables: ["client_name", "destination"],
  },
  stop_conditions: [],
  enabled_by_default: true,
  priority: 12,
};

const paymentReceivedTemplate: AutomationTemplate = {
  id: "payment_received",
  name: "Payment Received",
  description: "Confirm payment and mention GST invoice",
  category: "operations",
  trigger_config: { entity_type: "payment", delay_hours: 0, trigger_event: "status_changed", status_filter: ["paid", "captured"] },
  action_config: {
    channel: "whatsapp",
    message_template: "Payment of ₹{{amount}} received! 🧾 Thank you, {{client_name}}! Your GST invoice will be sent to your email shortly. Your {{destination}} trip is all set!",
    message_variables: ["client_name", "amount", "destination"],
  },
  stop_conditions: [],
  enabled_by_default: true,
  priority: 4,
};

// Template Registry

export const AUTOMATION_TEMPLATES: readonly AutomationTemplate[] = [
  welcomeMessageTemplate,
  proposalFollowupTemplate,
  itinerarySharedTemplate,
  bookingConfirmationTemplate,
  paymentReceivedTemplate,
  paymentReminderTemplate,
  packingReminderTemplate,
  departureDayTemplate,
  tripCountdownTemplate,
  postTripThanksTemplate,
  reviewRequestTemplate,
  anniversaryReminderTemplate,
] as const;

// Helper Functions

/**
 * Get template by ID
 */
export function getTemplateById(
  id: AutomationTemplateId
): AutomationTemplate | undefined {
  return AUTOMATION_TEMPLATES.find((t) => t.id === id);
}

/**
 * Get all templates for a category
 */
export function getTemplatesByCategory(
  category: AutomationTemplate["category"]
): readonly AutomationTemplate[] {
  return AUTOMATION_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get templates sorted by priority
 */
export function getTemplatesByPriority(): readonly AutomationTemplate[] {
  return [...AUTOMATION_TEMPLATES].sort((a, b) => a.priority - b.priority);
}

/**
 * Build default rule configuration from template
 */
export function buildDefaultRuleConfig(
  templateId: AutomationTemplate["id"]
): {
  rule_type: AutomationTemplate["id"];
  enabled: boolean;
  trigger_config: TriggerConfig;
  action_config: ActionConfig;
} | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    rule_type: template.id,
    enabled: template.enabled_by_default,
    trigger_config: template.trigger_config,
    action_config: template.action_config,
  };
}

/**
 * Validate trigger config against template
 */
export function validateTriggerConfig(
  templateId: AutomationTemplate["id"],
  config: unknown
): config is TriggerConfig {
  const template = getTemplateById(templateId);
  if (!template) return false;

  if (typeof config !== "object" || config === null) return false;
  const c = config as Record<string, unknown>;

  // Required fields
  if (typeof c.entity_type !== "string") return false;
  if (typeof c.delay_hours !== "number") return false;
  if (typeof c.trigger_event !== "string") return false;

  // Entity type must match template
  if (c.entity_type !== template.trigger_config.entity_type) return false;

  // Conditional fields
  if (c.trigger_event === "date_approaching") {
    if (typeof c.date_field !== "string") return false;
    if (typeof c.days_before !== "number") return false;
  }

  return true;
}

/**
 * Validate action config against template
 */
export function validateActionConfig(
  templateId: AutomationTemplate["id"],
  config: unknown
): config is ActionConfig {
  const template = getTemplateById(templateId);
  if (!template) return false;

  if (typeof config !== "object" || config === null) return false;
  const c = config as Record<string, unknown>;

  // Required fields
  if (typeof c.channel !== "string") return false;
  if (!["whatsapp", "email", "both"].includes(c.channel)) return false;
  if (typeof c.message_template !== "string") return false;
  if (!Array.isArray(c.message_variables)) return false;

  return true;
}
