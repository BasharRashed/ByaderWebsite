CREATE POLICY "Public can view workshop images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'workshop-images');