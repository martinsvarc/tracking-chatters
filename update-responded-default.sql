-- =====================================================
-- Update Database Schema: Fix "responded" Field Default
-- =====================================================
-- This script updates the default value for the "responded" field
-- in the threads table from 'Yes' to 'No' to match the corrected logic.
--
-- Run this in your NEON Postgres database to fix the default value.
-- =====================================================

-- Update the default value for the responded field
ALTER TABLE threads ALTER COLUMN responded SET DEFAULT 'No';

-- Optional: Update existing records that have the old default
-- This will set all existing threads with 'Yes' to be recalculated
-- based on their actual last message status
UPDATE threads 
SET responded = 'No' 
WHERE responded = 'Yes';

-- Verify the change
SELECT 
  column_name, 
  column_default, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'threads' 
  AND column_name = 'responded';

-- Check current responded values
SELECT 
  responded, 
  COUNT(*) as count
FROM threads 
GROUP BY responded
ORDER BY responded;
