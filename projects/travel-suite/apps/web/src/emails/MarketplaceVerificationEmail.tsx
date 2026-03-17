import { Text } from "@react-email/components";
import { BaseEmail } from "@/emails/BaseEmail";

interface MarketplaceVerificationEmailProps {
  orgName: string;
  status: "verified" | "rejected";
  settingsUrl: string;
}

export function MarketplaceVerificationEmail({
  orgName,
  status,
  settingsUrl,
}: MarketplaceVerificationEmailProps) {
  const isApproved = status === "verified";
  return (
    <BaseEmail
      previewText={`Verification ${isApproved ? "approved" : "update"} for ${orgName}`}
      title={isApproved ? "Marketplace Verification Approved" : "Marketplace Verification Update"}
      cta={{ href: settingsUrl, label: "Go to Marketplace Settings" }}
    >
      <Text>Hello,</Text>
      <Text>
        Your request for &ldquo;Verified Partner&rdquo; status for{" "}
        <strong>{orgName}</strong> has been{" "}
        <strong>{status}</strong> by the administration.
      </Text>
      {isApproved ? (
        <Text>
          You now have the &ldquo;Verified Partner&rdquo; badge on your profile
          and can access the Document Vaults of other verified operators.
        </Text>
      ) : (
        <Text>
          Unfortunately, we could not verify your profile at this time. Please
          ensure your organisation details and bio are complete before requesting
          again.
        </Text>
      )}
    </BaseEmail>
  );
}
