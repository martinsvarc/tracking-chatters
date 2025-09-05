-- Migration script to add AI score columns to existing threads table
-- Run this if you have an existing database without the new score columns

-- Add the new score columns to the threads table
ALTER TABLE threads 
ADD COLUMN IF NOT EXISTS acknowledgment_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS affection_score INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS personalization_score INTEGER DEFAULT NULL;

-- Add comments for the new columns
COMMENT ON COLUMN threads.acknowledgment_score IS 'AI-calculated acknowledgment score (0-100) based on message analysis';
COMMENT ON COLUMN threads.affection_score IS 'AI-calculated affection score (0-100) based on message analysis';
COMMENT ON COLUMN threads.personalization_score IS 'AI-calculated personalization score (0-100) based on message analysis';

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'threads'
ORDER BY ordinal_position;
