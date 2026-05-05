-- ============================================
-- 006: Create Storage Bucket for Course Assets
-- ============================================

-- Create a public bucket named 'course-assets'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('course-assets', 'course-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Grant public read access to everyone
CREATE POLICY "Public Access" ON storage.objects 
  FOR SELECT USING (bucket_id = 'course-assets');

-- Allow authenticated users to upload files
CREATE POLICY "Auth Upload" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

-- Allow users to update their own files
CREATE POLICY "Auth Update" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'course-assets' AND auth.role() = 'authenticated');

-- Allow users to delete their own files
CREATE POLICY "Auth Delete" ON storage.objects 
  FOR DELETE USING (bucket_id = 'course-assets' AND auth.role() = 'authenticated');
