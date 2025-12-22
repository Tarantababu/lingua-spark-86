-- Create storage bucket for lesson audio files
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-audio', 'lesson-audio', true);

-- Allow authenticated users to upload audio for their own lessons
CREATE POLICY "Users can upload audio for their lessons"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-audio' 
  AND auth.uid() IS NOT NULL
);

-- Allow anyone to view audio files (public bucket)
CREATE POLICY "Anyone can view lesson audio"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-audio');

-- Allow users to delete their own audio files
CREATE POLICY "Users can delete their lesson audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-audio' 
  AND auth.uid() IS NOT NULL
);