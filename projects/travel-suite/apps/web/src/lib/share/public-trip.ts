export const SHARED_ITINERARY_PUBLIC_SELECT = `
  *,
  itineraries (
    *,
    profiles!itineraries_user_id_fkey (
      organizations!profiles_organization_id_fkey ( name, logo_url, primary_color )
    )
  )
`;

const DISALLOWED_SHARE_PII_FIELDS = [
  "email",
  "phone",
  "full_name",
  "traveler_email",
  "traveler_phone",
];

export function shareSelectContainsPii(select: string): boolean {
  const normalized = select.toLowerCase();
  return DISALLOWED_SHARE_PII_FIELDS.some((field) =>
    normalized.includes(field.toLowerCase()),
  );
}
