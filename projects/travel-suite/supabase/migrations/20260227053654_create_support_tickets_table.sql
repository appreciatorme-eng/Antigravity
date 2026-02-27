CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Bug', 'Feature Request', 'Billing', 'General Inquiry')),
    priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Turn on RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their own org's tickets
CREATE POLICY "Users can view support tickets for their org" 
ON support_tickets
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Create policy for users to create tickets for their org
CREATE POLICY "Users can insert support tickets for their org" 
ON support_tickets
FOR INSERT WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Create specific update function for this table
CREATE OR REPLACE FUNCTION update_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_support_tickets_modtime') THEN
        CREATE TRIGGER update_support_tickets_modtime
        BEFORE UPDATE ON support_tickets FOR EACH ROW
        EXECUTE FUNCTION update_support_tickets_updated_at();
    END IF;
END $$;
