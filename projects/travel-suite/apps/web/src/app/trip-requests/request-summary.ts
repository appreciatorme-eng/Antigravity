import type { OperatorTripRequestListItem } from "@/lib/whatsapp/trip-intake.server";

export type OperatorRequestSummary = {
  intakeSource: string;
  travellerProgress: string;
  nextStep: string;
};

function getIntakeSource(item: OperatorTripRequestListItem): string {
  if (item.submitterRole === "operator" || item.sourceChannel === "whatsapp_operator_shared_link") {
    return "Shared intake link";
  }
  if (item.submitterRole === "client" || item.submitterRole === "traveller") {
    return "Customer intake link";
  }
  if (item.sourceChannel.startsWith("whatsapp")) {
    return "WhatsApp intake request";
  }
  return "Trip request form";
}

function getTravellerProgress(item: OperatorTripRequestListItem): string {
  if (item.stage === "cancelled") {
    return "Request was cancelled";
  }
  if (item.stage === "draft" || item.stage === "submitted") {
    return "Waiting for traveller details";
  }
  if (item.stage === "processing") {
    return "Trip package is being prepared";
  }
  if (item.stage === "completed") {
    return item.clientPhone
      ? "Traveller details received and package is ready"
      : "Trip package is ready but traveller details are incomplete";
  }
  return "Trip request is active";
}

function getNextStep(item: OperatorTripRequestListItem): string {
  if (item.generationError) {
    return item.stage === "completed" ? "Regenerate the trip package" : "Retry trip generation";
  }
  if (item.operatorDeliveryError || (item.stage === "completed" && !item.operatorNotified)) {
    return "Review and resend to the operator";
  }
  if (item.clientPhone && (item.clientDeliveryError || (item.stage === "completed" && !item.clientNotified))) {
    return "Resend the trip package to the traveller";
  }
  if (item.stage === "draft" || item.stage === "submitted") {
    return "Wait for traveller details or edit the brief";
  }
  if (item.stage === "processing") {
    return "Wait for the trip package to finish";
  }
  if (item.stage === "cancelled") {
    return "No action needed";
  }
  return "Review the itinerary and follow up if needed";
}

export function buildOperatorRequestSummary(item: OperatorTripRequestListItem): OperatorRequestSummary {
  return {
    intakeSource: getIntakeSource(item),
    travellerProgress: getTravellerProgress(item),
    nextStep: getNextStep(item),
  };
}
