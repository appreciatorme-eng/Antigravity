const { inferAction } = require("./intents");

function buildActionProposal({ tenantId, userId, channel, message }) {
  return {
    organization_id: tenantId,
    channel: channel || "web",
    action: inferAction(message),
    requested_by: {
      user_id: userId
    },
    target: {},
    updates: {},
    confirmation: {
      confirmed: false,
      confirmation_text: ""
    }
  };
}

function isConfirmed({ message, confirmationKeyword }) {
  return message.trim().toLowerCase() === confirmationKeyword.toLowerCase();
}

function executeAction(payload) {
  return {
    ok: true,
    action: payload.action,
    organization_id: payload.organization_id,
    message: "Action executed in demo mode. Replace with real database transaction."
  };
}

module.exports = {
  buildActionProposal,
  isConfirmed,
  executeAction
};
