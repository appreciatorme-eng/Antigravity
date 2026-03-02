const { getConfig, validateConfig } = require("./config");
const { handleMessage } = require("./orchestrator");

function runDemo() {
  const config = getConfig();
  const validation = validateConfig(config);

  if (!validation.ok) {
    console.log("Config warning: missing env keys (using defaults for demo):", validation.missing.join(", "));
  }

  const tenantId = "org_demo_123";
  const userId = "user_demo_001";

  let pendingAction = null;

  const messages = [
    { channel: "web", text: "What is pending today?" },
    { channel: "whatsapp", text: "Update itinerary price for Bali honeymoon to 1800 USD" },
    { channel: "whatsapp", text: "yes" }
  ];

  messages.forEach((msg) => {
    const result = handleMessage({
      tenantId,
      userId,
      channel: msg.channel,
      message: msg.text,
      config,
      pendingAction
    });

    console.log(`\n[${msg.channel}] User: ${msg.text}`);
    console.log(`[assistant] ${result.response}`);

    if (result.pendingAction) {
      pendingAction = result.pendingAction;
    }
    if (result.clearPendingAction) {
      pendingAction = null;
    }
  });
}

runDemo();
