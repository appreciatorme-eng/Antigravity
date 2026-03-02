const { detectIntent } = require("./intents");
const { retrieveFaqContext } = require("./retrieval");
const { buildActionProposal, isConfirmed, executeAction } = require("./actions");
const { writeAuditEvent } = require("./audit");

function summarizeFaqAnswer(contextRows) {
  if (contextRows.length === 0) {
    return "I could not find enough matching information yet. Please rephrase your question in one line.";
  }
  const top = contextRows[0];
  return `${top.answer} (source: ${top.source})`;
}

function handleMessage({ tenantId, userId, channel, message, config, pendingAction }) {
  const intent = detectIntent(message);

  if (pendingAction) {
    const confirmed = isConfirmed({ message, confirmationKeyword: config.confirmationKeyword });
    if (!confirmed) {
      return {
        response: `Please reply with '${config.confirmationKeyword}' to confirm this update, or send a new request.`
      };
    }

    const result = executeAction({
      ...pendingAction,
      confirmation: {
        confirmed: true,
        confirmation_text: message
      }
    });

    writeAuditEvent({
      tenant_id: tenantId,
      user_id: userId,
      channel,
      type: "action_executed",
      action: pendingAction.action,
      result
    });

    return {
      response: `Done. ${result.message}`,
      actionResult: result,
      clearPendingAction: true
    };
  }

  if (intent === "update_request") {
    const proposal = buildActionProposal({ tenantId, userId, channel, message });
    writeAuditEvent({
      tenant_id: tenantId,
      user_id: userId,
      channel,
      type: "action_proposed",
      action: proposal.action,
      message
    });

    return {
      response: `I can do that. Proposed action: ${proposal.action}. Reply '${config.confirmationKeyword}' to confirm.`,
      pendingAction: proposal
    };
  }

  const context = retrieveFaqContext({ query: message, maxChunks: config.maxRetrievedChunks });
  const response = summarizeFaqAnswer(context);

  writeAuditEvent({
    tenant_id: tenantId,
    user_id: userId,
    channel,
    type: "rag_answer",
    intent,
    message,
    retrieved_ids: context.map((item) => item.id)
  });

  return {
    response,
    citations: context.map((item) => ({ id: item.id, source: item.source }))
  };
}

module.exports = {
  handleMessage
};
