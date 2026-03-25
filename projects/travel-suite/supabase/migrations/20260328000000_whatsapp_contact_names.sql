-- WhatsApp contact names: store pushName from Meta webhook + custom names + personal/business classification
CREATE TABLE IF NOT EXISTS whatsapp_contact_names (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  wa_id text NOT NULL,
  push_name text,
  custom_name text,
  is_personal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id, wa_id)
);

ALTER TABLE whatsapp_contact_names ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_contact_names" ON whatsapp_contact_names
  FOR ALL USING (
    org_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );
