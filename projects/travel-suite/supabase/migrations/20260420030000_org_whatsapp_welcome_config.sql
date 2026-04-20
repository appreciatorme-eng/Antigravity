ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS whatsapp_welcome_config JSONB;
