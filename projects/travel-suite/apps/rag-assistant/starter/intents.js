function detectIntent(message) {
  const lower = message.toLowerCase();

  const updateHints = ["update", "change", "set", "move", "assign", "price"];
  const pendingHints = ["pending", "due", "today", "failed", "waiting", "notification", "retry"];
  // Extended with real app feature terms
  const statusHints = [
    "status", "stage", "summary", "which clients", "which trips",
    "kanban", "pipeline", "overdue", "stale", "health", "mapping"
  ];
  const lookupHints = [
    "invoice", "pdf", "share", "live location", "add-on", "addon",
    "template", "media", "library", "driver map"
  ];

  if (updateHints.some((hint) => lower.includes(hint))) {
    return "update_request";
  }
  if (pendingHints.some((hint) => lower.includes(hint))) {
    return "status_lookup";
  }
  if (statusHints.some((hint) => lower.includes(hint))) {
    return "status_lookup";
  }
  if (lookupHints.some((hint) => lower.includes(hint))) {
    return "faq";
  }
  return "faq";
}

function inferAction(message) {
  const lower = message.toLowerCase();
  if (lower.includes("price")) return "update_itinerary_price";
  if (lower.includes("invoice")) return "get_trip_status";
  if (lower.includes("stage") || lower.includes("lead") || lower.includes("payment")) return "move_client_stage";
  if (lower.includes("driver") || lower.includes("assign") || lower.includes("mapping")) return "assign_driver";
  if (lower.includes("notification") || lower.includes("retry")) return "get_pending_items";
  return "get_pending_items";
}

module.exports = {
  detectIntent,
  inferAction
};
