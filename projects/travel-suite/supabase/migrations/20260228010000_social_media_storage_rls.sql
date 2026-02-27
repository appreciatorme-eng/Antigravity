-- Storage RLS policies for social-media bucket
-- Users can only read/write files under their own org's folder: {org_id}/...
-- Uses profiles.organization_id to determine org membership

-- Drop existing policies if any (idempotent)
DO $$
BEGIN
    DROP POLICY IF EXISTS "social-media: org members can upload" ON storage.objects;
    DROP POLICY IF EXISTS "social-media: org members can read" ON storage.objects;
    DROP POLICY IF EXISTS "social-media: org members can delete" ON storage.objects;
    DROP POLICY IF EXISTS "social-media: org members can update" ON storage.objects;
    DROP POLICY IF EXISTS "social-media: public read" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Allow public read (bucket is public for sharing rendered images)
CREATE POLICY "social-media: public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'social-media');

-- Allow authenticated users to upload to their org folder
CREATE POLICY "social-media: org members can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'social-media'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Allow authenticated users to update their org files
CREATE POLICY "social-media: org members can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'social-media'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM profiles
        WHERE id = auth.uid()
    )
);

-- Allow authenticated users to delete their org files
CREATE POLICY "social-media: org members can delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'social-media'
    AND (storage.foldername(name))[1] IN (
        SELECT organization_id::text
        FROM profiles
        WHERE id = auth.uid()
    )
);
