-- Create storage bucket for trade screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('trade-screenshots', 'trade-screenshots', true);

-- Allow authenticated users to upload their own screenshots
CREATE POLICY "Users can upload their own screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'trade-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own screenshots
CREATE POLICY "Users can view their own screenshots"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'trade-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own screenshots
CREATE POLICY "Users can delete their own screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'trade-screenshots' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);