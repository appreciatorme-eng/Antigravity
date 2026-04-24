export const SHARED_ITINERARY_PUBLIC_SELECT = `
  id,
  created_at,
  expires_at,
  payment_config,
  template_id,
  status,
  viewed_at,
  itineraries (
    id,
    created_at,
    raw_data,
    trip_title,
    destination,
    duration_days,
    budget,
    interests,
    summary,
    user_id,
    client_id,
    profiles!itineraries_user_id_fkey (
      organizations!profiles_organization_id_fkey ( name, logo_url, primary_color, billing_city, billing_state )
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
