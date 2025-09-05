-- =====================================================
-- Message Analyzer Platform Database Schema
-- =====================================================
-- This script creates the necessary tables and indexes for the 
-- Message Analyzer Platform deployed on Vercel with NEON Postgres.
-- 
-- Tables Created:
-- 1. messages - Stores individual messages within conversation threads
-- 2. threads - Stores per-thread metadata and calculated fields
--
-- Indexes Created:
-- - Performance indexes for filtering and time-based queries
-- - Composite indexes for multi-column filtering
--
-- Compatibility: NEON Postgres (PostgreSQL 15+)
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (if they exist)
-- =====================================================
-- Uncomment the following lines if you need to recreate tables
-- DROP TABLE IF EXISTS messages CASCADE;
-- DROP TABLE IF EXISTS threads CASCADE;

-- =====================================================
-- CREATE MESSAGES TABLE
-- =====================================================
-- Stores individual messages within conversation threads
-- Each message belongs to a thread and has metadata about the operator, model, and type
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,                    -- Auto-incrementing primary key
    thread_id VARCHAR(50) NOT NULL,          -- References the conversation thread
    operator VARCHAR(50) NOT NULL,           -- Name of the operator handling the message
    model VARCHAR(50) NOT NULL,              -- AI model used (e.g., GPT-4, Claude, etc.)
    type VARCHAR(10) NOT NULL CHECK (type IN ('incoming', 'outgoing')), -- Message direction
    message TEXT NOT NULL,                   -- The actual message content
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- When the message was created
);

-- =====================================================
-- CREATE THREADS TABLE
-- =====================================================
-- Stores per-thread metadata and calculated fields
-- This table is updated via upsert logic when new messages are added
CREATE TABLE IF NOT EXISTS threads (
    thread_id VARCHAR(50) PRIMARY KEY,       -- Unique identifier for the conversation thread
    operator VARCHAR(50) NOT NULL,           -- Primary operator for this thread
    model VARCHAR(50) NOT NULL,              -- Primary AI model used in this thread
    converted VARCHAR(10) DEFAULT NULL,      -- Conversion status ('Yes' or NULL)
    last_message TIMESTAMP DEFAULT NULL,     -- Timestamp of the most recent message
    avg_response_time INTERVAL DEFAULT NULL, -- Average time to respond to incoming messages
    responded VARCHAR(3) DEFAULT 'Yes',      -- Response status ('Yes' or 'No')
    acknowledgment_score INTEGER DEFAULT NULL, -- AI-calculated acknowledgment score (0-100)
    affection_score INTEGER DEFAULT NULL,    -- AI-calculated affection score (0-100)
    personalization_score INTEGER DEFAULT NULL -- AI-calculated personalization score (0-100)
);

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================

-- Index on messages.thread_id for efficient thread-based queries
-- Used when fetching all messages for a specific thread
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);

-- Index on messages.date for time-based filtering and sorting
-- Used for date range queries and chronological ordering
CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(date);

-- Index on messages.operator for operator-based filtering
-- Used when filtering messages by specific operators
CREATE INDEX IF NOT EXISTS idx_messages_operator ON messages(operator);

-- Index on messages.model for model-based filtering
-- Used when filtering messages by specific AI models
CREATE INDEX IF NOT EXISTS idx_messages_model ON messages(model);

-- Composite index on messages for multi-column filtering
-- Optimizes queries that filter by thread_id and date together
CREATE INDEX IF NOT EXISTS idx_messages_thread_date ON messages(thread_id, date);

-- Composite index on messages for operator and model filtering
-- Optimizes queries that filter by both operator and model
CREATE INDEX IF NOT EXISTS idx_messages_operator_model ON messages(operator, model);

-- Index on threads.operator for operator-based thread filtering
-- Used when filtering threads by specific operators
CREATE INDEX IF NOT EXISTS idx_threads_operator ON threads(operator);

-- Index on threads.model for model-based thread filtering
-- Used when filtering threads by specific AI models
CREATE INDEX IF NOT EXISTS idx_threads_model ON threads(model);

-- Composite index on threads for operator and model filtering
-- Optimizes queries that filter threads by both operator and model
CREATE INDEX IF NOT EXISTS idx_threads_operator_model ON threads(operator, model);

-- Index on threads.last_message for time-based thread filtering
-- Used for date range queries on threads
CREATE INDEX IF NOT EXISTS idx_threads_last_message ON threads(last_message);

-- Index on threads.converted for conversion status filtering
-- Used when filtering threads by conversion status
CREATE INDEX IF NOT EXISTS idx_threads_converted ON threads(converted);

-- Index on threads.responded for response status filtering
-- Used when filtering threads by response status
CREATE INDEX IF NOT EXISTS idx_threads_responded ON threads(responded);

-- =====================================================
-- ADD TABLE COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE messages IS 'Stores individual messages within conversation threads. Each message contains the content, metadata, and timestamp.';
COMMENT ON TABLE threads IS 'Stores per-thread metadata and calculated fields. Updated via upsert logic when new messages are added.';

COMMENT ON COLUMN messages.id IS 'Auto-incrementing primary key for each message';
COMMENT ON COLUMN messages.thread_id IS 'References the conversation thread this message belongs to';
COMMENT ON COLUMN messages.operator IS 'Name of the operator handling this message';
COMMENT ON COLUMN messages.model IS 'AI model used to generate or process this message';
COMMENT ON COLUMN messages.type IS 'Message direction: incoming (from user) or outgoing (from operator)';
COMMENT ON COLUMN messages.message IS 'The actual text content of the message';
COMMENT ON COLUMN messages.date IS 'Timestamp when the message was created';

COMMENT ON COLUMN threads.thread_id IS 'Unique identifier for the conversation thread';
COMMENT ON COLUMN threads.operator IS 'Primary operator assigned to this thread';
COMMENT ON COLUMN threads.model IS 'Primary AI model used in this thread';
COMMENT ON COLUMN threads.converted IS 'Conversion status: Yes if user converted, NULL otherwise';
COMMENT ON COLUMN threads.last_message IS 'Timestamp of the most recent message in this thread';
COMMENT ON COLUMN threads.avg_response_time IS 'Average time taken to respond to incoming messages';
COMMENT ON COLUMN threads.responded IS 'Response status: Yes if last outgoing message is within 3 hours, No otherwise';
COMMENT ON COLUMN threads.acknowledgment_score IS 'AI-calculated acknowledgment score (0-100) based on message analysis';
COMMENT ON COLUMN threads.affection_score IS 'AI-calculated affection score (0-100) based on message analysis';
COMMENT ON COLUMN threads.personalization_score IS 'AI-calculated personalization score (0-100) based on message analysis';

-- =====================================================
-- CREATE USEFUL VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for thread summary with message counts
CREATE OR REPLACE VIEW thread_summary AS
SELECT 
    t.thread_id,
    t.operator,
    t.model,
    t.converted,
    t.last_message,
    t.avg_response_time,
    t.responded,
    COUNT(m.id) as message_count,
    COUNT(CASE WHEN m.type = 'incoming' THEN 1 END) as incoming_count,
    COUNT(CASE WHEN m.type = 'outgoing' THEN 1 END) as outgoing_count,
    EXTRACT(EPOCH FROM (NOW() - t.last_message)) as last_message_seconds_ago
FROM threads t
LEFT JOIN messages m ON t.thread_id = m.thread_id
GROUP BY t.thread_id, t.operator, t.model, t.converted, t.last_message, t.avg_response_time, t.responded;

COMMENT ON VIEW thread_summary IS 'Provides a summary view of threads with message counts and timing information';

-- =====================================================
-- SAMPLE DATA INSERTION (OPTIONAL)
-- =====================================================
-- Uncomment the following section to insert sample data for testing

/*
-- Insert sample threads
INSERT INTO threads (thread_id, operator, model, converted, last_message, responded) VALUES
('thread_001', 'Sarah', 'GPT-4', 'Yes', '2024-01-15 14:30:00', 'Yes'),
('thread_002', 'Emma', 'GPT-3.5', NULL, '2024-01-15 15:45:00', 'Yes'),
('thread_003', 'Jessica', 'Claude', 'Yes', '2024-01-15 16:20:00', 'No');

-- Insert sample messages
INSERT INTO messages (thread_id, operator, model, type, message, date) VALUES
('thread_001', 'Sarah', 'GPT-4', 'incoming', 'Hello, how are you today?', '2024-01-15 14:25:00'),
('thread_001', 'Sarah', 'GPT-4', 'outgoing', 'I''m doing great, thanks for asking!', '2024-01-15 14:26:00'),
('thread_001', 'Sarah', 'GPT-4', 'incoming', 'What can I help you with?', '2024-01-15 14:30:00'),
('thread_002', 'Emma', 'GPT-3.5', 'incoming', 'I''d like to know more about your services', '2024-01-15 15:40:00'),
('thread_002', 'Emma', 'GPT-3.5', 'outgoing', 'Of course! Let me tell you about our premium features', '2024-01-15 15:45:00'),
('thread_003', 'Jessica', 'Claude', 'incoming', 'Can you help me with my account?', '2024-01-15 16:15:00'),
('thread_003', 'Jessica', 'Claude', 'outgoing', 'I''d be happy to help! What seems to be the issue?', '2024-01-15 16:20:00');
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the schema was created correctly

-- Check if tables exist
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('messages', 'threads')
ORDER BY table_name;

-- Check if indexes exist
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE tablename IN ('messages', 'threads')
ORDER BY tablename, indexname;

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('messages', 'threads')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================
-- The Message Analyzer Platform database schema has been created successfully.
-- 
-- Next Steps:
-- 1. Verify the tables and indexes were created correctly using the verification queries above
-- 2. Update your application's DATABASE_URL environment variable if needed
-- 3. Test the application to ensure data flows correctly
-- 4. Consider running the sample data insertion if you need test data
--
-- For production use:
-- - Monitor query performance and add additional indexes as needed
-- - Consider partitioning the messages table by date for large datasets
-- - Implement proper backup and maintenance procedures
-- =====================================================
