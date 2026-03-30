export const SHARED_ITINERARY_PUBLIC_SELECT = `
  id,
  expires_at,
  template_id,
  itineraries (
    raw_data,
    trip_title,
    destination,
    duration_days,
    budget,
    interests,
    summary,
    user_id,
    profiles!itineraries_user_id_fkey (
      organizations!profiles_organization_id_fkey ( name, logo_url, primary_color )
    )
  )
`;

const DISALLOWED_SHARE_PII_FIELDS = [
  "*,",
  "*\n",
  "email",
  "phone",
  "full_name",
  "traveler_email",
  "traveler_phone",
  "recipient_phone",
  "client_comments",
  "share_code",
];

export function shareSelectContainsPii(select: string): boolean {
  const normalized = select.toLowerCase();
  return DISALLOWED_SHARE_PII_FIELDS.some((field) =>
    normalized.includes(field.toLowerCase()),
  );
}
