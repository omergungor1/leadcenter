-- Migration: Create exports storage bucket and policies
-- Date: 2024

-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'exports',
    'exports',
    false, -- Private bucket
    52428800, -- 50MB limit
    ARRAY['text/csv', 'text/vcard', 'text/x-vcard']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can only access their own export files
-- This policy allows users to read files in their own group folder
CREATE POLICY "Users can read their own exports"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'exports' AND
    (storage.foldername((storage.objects.name)))[1] = 'groups' AND
    EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN lead_groups lg ON lg.user_id = u.id
        WHERE u.auth_id = auth.uid()
        AND lg.id::text = (storage.foldername((storage.objects.name)))[2]
    )
);

-- Policy: Authenticated users can upload their own export files
-- File path format: groups/{group_id}/{filename}
CREATE POLICY "Users can upload their own exports"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'exports' AND
    (storage.foldername((storage.objects.name)))[1] = 'groups' AND
    EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN lead_groups lg ON lg.user_id = u.id
        WHERE u.auth_id = auth.uid()
        AND lg.id::text = (storage.foldername((storage.objects.name)))[2]
    )
);

-- Policy: Authenticated users can update their own export files
CREATE POLICY "Users can update their own exports"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'exports' AND
    (storage.foldername((storage.objects.name)))[1] = 'groups' AND
    EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN lead_groups lg ON lg.user_id = u.id
        WHERE u.auth_id = auth.uid()
        AND lg.id::text = (storage.foldername((storage.objects.name)))[2]
    )
);

-- Policy: Authenticated users can delete their own export files
CREATE POLICY "Users can delete their own exports"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'exports' AND
    (storage.foldername((storage.objects.name)))[1] = 'groups' AND
    EXISTS (
        SELECT 1
        FROM users u
        INNER JOIN lead_groups lg ON lg.user_id = u.id
        WHERE u.auth_id = auth.uid()
        AND lg.id::text = (storage.foldername((storage.objects.name)))[2]
    )
);
