const { getConfig } = require("./config");
const { handleMessage } = require("./orchestrator");

function handleWebChatRequest({ organizationId, userId, text, pendingAction }) {
  return handleMessage({
    tenantId: organizationId,
    userId,
    channel: "web",
    message: text,
    config: getConfig(),
    pendingAction
  });
}

module.exports = {
  handleWebChatRequest
};
