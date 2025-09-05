const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
let pool;
let dbConnected = false;

// Log environment configuration
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('NODE_ENV:', process.env.NODE_ENV);

try {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    // Add connection timeout and retry logic
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
  });

  // Test database connection
  pool.on('connect', () => {
    console.log('✅ Connected to NEON Postgres database');
    dbConnected = true;
  });

  pool.on('error', (err) => {
    console.error('❌ Database connection error:', err);
    dbConnected = false;
  });
  
  // Test initial connection
  pool.query('SELECT NOW() as current_time')
    .then(result => {
      console.log('✅ Database query test successful:', result.rows[0]);
      dbConnected = true;
    })
    .catch(err => {
      console.error('❌ Database query test failed:', err);
      dbConnected = false;
    });
    
} catch (error) {
  console.error('❌ Failed to initialize database pool:', error);
  dbConnected = false;
}

// Initialize database tables and indexes
async function initializeDatabase() {
  console.log('🔧 Initializing database...');
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  if (!pool) {
    console.error('❌ Database pool not initialized - cannot proceed');
    return;
  }
  
  // Force connection test
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connection verified');
    dbConnected = true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    dbConnected = false;
    // Don't return - continue with table creation attempts
  }
  
  try {
    // Create messages table (renamed from threads for clarity)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        thread_id VARCHAR(50),
        operator VARCHAR(50),
        model VARCHAR(50),
        type VARCHAR(10),
        message TEXT,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create threads table for per-thread data
    await pool.query(`
      CREATE TABLE IF NOT EXISTS threads (
        thread_id VARCHAR(50) PRIMARY KEY,
        operator VARCHAR(50),
        model VARCHAR(50),
        converted VARCHAR(10),
        last_message TIMESTAMP,
        avg_response_time INTERVAL,
        responded VARCHAR(3),
        acknowledgment_score INTEGER DEFAULT NULL,
        affection_score INTEGER DEFAULT NULL,
        personalization_score INTEGER DEFAULT NULL
      )
    `);

    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_date ON messages(date)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_operator ON messages(operator)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_messages_model ON messages(model)
    `);

    // Migrate existing data if threads table has old structure
    await migrateExistingData();

    console.log('✅ Database tables and indexes created successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    // Continue execution even if table creation fails
  }
}

// Migrate existing data from old threads table structure
async function migrateExistingData() {
  try {
    // Check if old threads table exists and has data
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'threads' AND column_name = 'message'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('Migrating existing data from old threads table...');
      
      // Get all existing data
      const existingData = await pool.query('SELECT * FROM threads');
      
      if (existingData.rows.length > 0) {
        // Group by operator and model to create thread_ids
        const threadGroups = {};
        
        for (const row of existingData.rows) {
          const threadId = `${row.operator}_${row.model}_${Math.floor(Math.random() * 10000)}`;
          
          if (!threadGroups[threadId]) {
            threadGroups[threadId] = {
              thread_id: threadId,
              operator: row.operator,
              model: row.model,
              messages: []
            };
          }
          
          threadGroups[threadId].messages.push({
            type: row.type,
            message: row.message,
            date: row.date
          });
        }
        
        // Insert into new tables
        for (const [threadId, threadData] of Object.entries(threadGroups)) {
          // Insert thread record
          await pool.query(`
            INSERT INTO threads (thread_id, operator, model, converted, last_message, responded)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (thread_id) DO NOTHING
          `, [threadId, threadData.operator, threadData.model, null, null, 'Yes']);
          
          // Insert messages
          for (const msg of threadData.messages) {
            await pool.query(`
              INSERT INTO messages (thread_id, operator, model, type, message, date)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [threadId, threadData.operator, threadData.model, msg.type, msg.message, msg.date]);
          }
        }
        
        // Drop old threads table
        await pool.query('DROP TABLE IF EXISTS threads_old');
        await pool.query('ALTER TABLE threads RENAME TO threads_old');
        
        console.log(`Migrated ${existingData.rows.length} records to new schema`);
      }
    }
  } catch (error) {
    console.error('Error migrating existing data:', error);
  }
}

// API Routes - All routes are prefixed with /api for Vercel deployment

// Mock data removed - using real database only

// GET /api/threads - Fetch all threads with calculated fields and optional filtering
app.get('/api/threads', async (req, res) => {
  console.log('📥 GET /api/threads called');
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  try {
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database not available' });
    }
    
    const { operator, model, start, end } = req.query;
    console.log('Query params:', { operator, model, start, end });
    
    // Query to fetch threads with calculated fields and messages
    // Now includes messages array for each thread to display in UI
    let query = `
      SELECT 
        t.thread_id,
        t.operator,
        t.model,
        t.converted,
        t.last_message,
        t.avg_response_time,
        t.responded,
        t.acknowledgment_score,
        t.affection_score,
        t.personalization_score,
        EXTRACT(EPOCH FROM (NOW() - t.last_message)) as last_message_seconds_ago,
        EXTRACT(EPOCH FROM t.avg_response_time) as avg_response_seconds,
        COUNT(m.id) as message_count,
        JSON_AGG(
          CASE 
            WHEN m.id IS NOT NULL THEN
              JSON_BUILD_OBJECT(
                'id', m.id,
                'type', m.type,
                'message', m.message,
                'date', m.date
              )
            ELSE NULL
          END
        ) FILTER (WHERE m.id IS NOT NULL) as messages
      FROM threads t
      LEFT JOIN messages m ON t.thread_id = m.thread_id
    `;
    
    const params = [];
    const conditions = [];

    // Add filtering conditions
    if (operator) {
      conditions.push(`t.operator = ANY($${params.length + 1})`);
      params.push(operator.split(','));
    }
    
    if (model) {
      conditions.push(`t.model = ANY($${params.length + 1})`);
      params.push(model.split(','));
    }
    
    if (start) {
      conditions.push(`t.last_message >= $${params.length + 1}`);
      params.push(start);
    }
    
    if (end) {
      conditions.push(`t.last_message <= $${params.length + 1}`);
      params.push(end);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY t.thread_id, t.operator, t.model, t.converted, t.last_message, t.avg_response_time, t.responded, t.acknowledgment_score, t.affection_score, t.personalization_score
      ORDER BY t.last_message DESC
    `;

    console.log('Executing query:', query);
    console.log('Query params:', params);
    
    const result = await pool.query(query, params);
    console.log(`✅ Query executed successfully, returned ${result.rows.length} rows`);
    
    // Format the response with calculated fields and messages
    const formattedThreads = result.rows.map(row => ({
      thread_id: row.thread_id,
      operator: row.operator,
      model: row.model,
      converted: row.converted,
      last_message: row.last_message,
      last_message_relative: formatRelativeTime(row.last_message_seconds_ago),
      avg_response_time: row.avg_response_seconds ? Math.round(row.avg_response_seconds) : null,
      responded: row.responded,
      message_count: parseInt(row.message_count),
      acknowledgment_score: row.acknowledgment_score,
      affection_score: row.affection_score,
      personalization_score: row.personalization_score,
      messages: row.messages || [] // Include messages array, default to empty array if no messages
    }));
    
    console.log('📤 Returning formatted threads:', formattedThreads.length);
    res.json(formattedThreads);
  } catch (error) {
    console.error('❌ Error fetching threads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch threads',
      details: error.message 
    });
  }
});

// Helper function to format relative time
function formatRelativeTime(secondsAgo) {
  if (!secondsAgo) return 'Unknown';
  
  const seconds = Math.floor(secondsAgo);
  
  if (seconds < 60) {
    return `${seconds} sec ago`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// POST /api/threads - Add new message with upsert logic and automated calculations
app.post('/api/threads', async (req, res) => {
  console.log('📥 POST /api/threads called');
  console.log('Request body:', req.body);
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  try {
    const { operator, thread_id, model, type, message, converted } = req.body;
    
    if (!operator || !thread_id || !model || !type || !message) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: operator, thread_id, model, type, message' 
      });
    }

    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database not available' });
    }

    // Start transaction for atomic operations
    const client = await pool.connect();
    try {
      console.log('🔄 Starting database transaction');
      await client.query('BEGIN');

      // Upsert thread record - explicitly set AI scores to NULL
      // AI scores are no longer auto-calculated on POST to prevent automatic generation
      // They should only be set via separate update endpoints or manual input
      const threadUpsertQuery = `
        INSERT INTO threads (thread_id, operator, model, converted, acknowledgment_score, affection_score, personalization_score)
        VALUES ($1, $2, $3, $4, NULL, NULL, NULL)
        ON CONFLICT (thread_id) 
        DO UPDATE SET 
          converted = CASE 
            WHEN EXCLUDED.converted = 'Yes' THEN EXCLUDED.converted 
            ELSE threads.converted 
          END,
          acknowledgment_score = NULL,
          affection_score = NULL,
          personalization_score = NULL
      `;
      console.log('📝 Upserting thread record');
      await client.query(threadUpsertQuery, [thread_id, operator, model, converted || null]);

      // Insert message
      const messageInsertQuery = `
        INSERT INTO messages (thread_id, operator, model, type, message)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      console.log('📝 Inserting message');
      const messageResult = await client.query(messageInsertQuery, [thread_id, operator, model, type, message]);

      // Update automated calculations
      console.log('🧮 Updating thread calculations');
      await updateThreadCalculations(client, thread_id);

      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      const response = {
        ...messageResult.rows[0],
        thread_id,
        converted: converted || null
      };
      
      console.log('📤 Returning response:', response);
      res.status(201).json(response);
    } catch (error) {
      console.error('❌ Transaction error, rolling back:', error);
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Error creating thread:', error);
    res.status(500).json({ 
      error: 'Failed to create thread',
      details: error.message 
    });
  }
});

// Helper function to calculate AI scores for a message
function calculateAIScores(message) {
  // Placeholder function - in production, this would use real NLP analysis
  // For now, we'll generate scores based on message characteristics
  
  const messageLength = message.length;
  const hasQuestion = message.includes('?');
  const hasExclamation = message.includes('!');
  const hasPersonalWords = /\b(I|you|your|we|our|us)\b/i.test(message);
  const hasEmotionalWords = /\b(thank|please|sorry|happy|excited|love|great|amazing|wonderful)\b/i.test(message);
  
  // Acknowledgment score: based on question handling and response quality
  let acknowledgment = 50;
  if (hasQuestion) acknowledgment += 20;
  if (messageLength > 50) acknowledgment += 15;
  if (hasPersonalWords) acknowledgment += 15;
  
  // Affection score: based on emotional language and warmth
  let affection = 50;
  if (hasEmotionalWords) affection += 25;
  if (hasPersonalWords) affection += 15;
  if (hasExclamation) affection += 10;
  
  // Personalization score: based on personal references and customization
  let personalization = 50;
  if (hasPersonalWords) personalization += 20;
  if (messageLength > 100) personalization += 15;
  if (hasEmotionalWords) personalization += 15;
  
  return {
    acknowledgment: Math.min(100, Math.max(0, acknowledgment)),
    affection: Math.min(100, Math.max(0, affection)),
    personalization: Math.min(100, Math.max(0, personalization))
  };
}

// Helper function to update automated calculations for a thread
async function updateThreadCalculations(client, threadId) {
  console.log(`🧮 Updating calculations for thread: ${threadId}`);
  try {
    // Update last_message timestamp
    console.log('📅 Updating last_message timestamp');
    await client.query(`
      UPDATE threads 
      SET last_message = (
        SELECT MAX(date) 
        FROM messages 
        WHERE thread_id = $1
      )
      WHERE thread_id = $1
    `, [threadId]);

    // Calculate average response time
    console.log('⏱️ Calculating average response time');
    const avgResponseTimeQuery = `
      WITH response_times AS (
        SELECT 
          m1.date as incoming_time,
          m2.date as outgoing_time,
          m2.date - m1.date as response_time
        FROM messages m1
        JOIN messages m2 ON m1.thread_id = m2.thread_id
        WHERE m1.thread_id = $1
          AND m1.type = 'incoming'
          AND m2.type = 'outgoing'
          AND m2.date > m1.date
          AND NOT EXISTS (
            SELECT 1 FROM messages m3 
            WHERE m3.thread_id = $1 
              AND m3.type = 'incoming' 
              AND m3.date > m1.date 
              AND m3.date < m2.date
          )
      )
      SELECT AVG(response_time) as avg_time
      FROM response_times
    `;
    
    const avgResult = await client.query(avgResponseTimeQuery, [threadId]);
    const avgResponseTime = avgResult.rows[0]?.avg_time || null;
    console.log('⏱️ Average response time:', avgResponseTime);

    // Calculate responded status
    console.log('✅ Calculating responded status');
    const respondedQuery = `
      WITH last_message_info AS (
        SELECT type, date
        FROM messages
        WHERE thread_id = $1
        ORDER BY date DESC
        LIMIT 1
      )
      SELECT 
        CASE 
          WHEN type = 'outgoing' AND (NOW() - date) > INTERVAL '3 hours' THEN 'No'
          ELSE 'Yes'
        END as responded
      FROM last_message_info
    `;
    
    const respondedResult = await client.query(respondedQuery, [threadId]);
    const responded = respondedResult.rows[0]?.responded || 'Yes';
    console.log('✅ Responded status:', responded);

    // Update threads table with calculated values (excluding AI scores - they remain NULL)
    console.log('💾 Updating threads table with calculated values');
    await client.query(`
      UPDATE threads 
      SET avg_response_time = $2, responded = $3
      WHERE thread_id = $1
    `, [threadId, avgResponseTime, responded]);
    
    console.log('✅ Thread calculations updated successfully');

  } catch (error) {
    console.error('❌ Error updating thread calculations:', error);
    throw error;
  }
}

// GET /api/stats - Get aggregated statistics for header
app.get('/api/stats', async (req, res) => {
  console.log('📥 GET /api/stats called');
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  try {
    const { operator, model, start, end } = req.query;
    console.log('Query params:', { operator, model, start, end });
    
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Build query with filters
    let query = `
      SELECT 
        COUNT(*) as total_chats,
        COUNT(CASE WHEN converted = 'Yes' THEN 1 END) as total_converted,
        AVG(EXTRACT(EPOCH FROM avg_response_time)) as avg_response_time_seconds,
        COUNT(CASE WHEN responded = 'Yes' THEN 1 END) as responded_count,
        AVG(acknowledgment_score) as avg_acknowledgment,
        AVG(affection_score) as avg_affection,
        AVG(personalization_score) as avg_personalization
      FROM threads t
    `;
    
    const params = [];
    const conditions = [];

    // Add filtering conditions
    if (operator) {
      conditions.push(`t.operator = ANY($${params.length + 1})`);
      params.push(operator.split(','));
    }
    
    if (model) {
      conditions.push(`t.model = ANY($${params.length + 1})`);
      params.push(model.split(','));
    }
    
    if (start) {
      conditions.push(`t.last_message >= $${params.length + 1}`);
      params.push(start);
    }
    
    if (end) {
      conditions.push(`t.last_message <= $${params.length + 1}`);
      params.push(end);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    console.log('Executing stats query:', query);
    console.log('Query params:', params);
    
    const result = await pool.query(query, params);
    const row = result.rows[0];
    
    console.log('Raw stats result:', row);
    
    const totalChats = parseInt(row.total_chats) || 0;
    const totalConverted = parseInt(row.total_converted) || 0;
    const avgResponseTime = row.avg_response_time_seconds ? Math.round(row.avg_response_time_seconds) : 0;
    const respondedCount = parseInt(row.responded_count) || 0;
    const avgAcknowledgment = row.avg_acknowledgment ? Math.round(row.avg_acknowledgment) : 0;
    const avgAffection = row.avg_affection ? Math.round(row.avg_affection) : 0;
    const avgPersonalization = row.avg_personalization ? Math.round(row.avg_personalization) : 0;
    
    const stats = {
      avgAcknowledgment: avgAcknowledgment,
      avgAffection: avgAffection,
      avgResponseTime: avgResponseTime,
      responseRate: totalChats > 0 ? Math.round((respondedCount / totalChats) * 100) : 0,
      avgPersonalization: avgPersonalization,
      totalConverted: totalConverted,
      totalChats: totalChats,
      conversionRate: totalChats > 0 ? Math.round((totalConverted / totalChats) * 100) : 0
    };
    
    console.log('📤 Returning calculated stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: error.message 
    });
  }
});

// GET /api/filters - Fetch unique operators and models for filter options
// This endpoint provides dynamic filter options for the frontend FilterBar component
// Replaces hardcoded operator and model lists with real data from the database
app.get('/api/filters', async (req, res) => {
  console.log('📥 GET /api/filters called');
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  try {
    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database not available' });
    }
    
    // Fetch unique operators and models separately for better performance and clarity
    // This ensures we get distinct values from each column
    const operatorsQuery = `SELECT DISTINCT operator FROM threads WHERE operator IS NOT NULL ORDER BY operator`;
    const modelsQuery = `SELECT DISTINCT model FROM threads WHERE model IS NOT NULL ORDER BY model`;
    
    console.log('Executing separate queries for operators and models');
    
    const [operatorsResult, modelsResult] = await Promise.all([
      pool.query(operatorsQuery),
      pool.query(modelsQuery)
    ]);
    
    const uniqueOperators = operatorsResult.rows.map(row => row.operator);
    const uniqueModels = modelsResult.rows.map(row => row.model);
    
    console.log('📊 Unique operators found:', uniqueOperators);
    console.log('📊 Unique models found:', uniqueModels);
    
    const response = {
      operators: uniqueOperators,
      models: uniqueModels
    };
    
    console.log('📤 Returning filter options:', response);
    res.json(response);
  } catch (error) {
    console.error('❌ Error fetching filter options:', error);
    res.status(500).json({ 
      error: 'Failed to fetch filter options',
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, async () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database URL: ${process.env.DATABASE_URL ? 'CONFIGURED' : 'NOT SET'}`);
  await initializeDatabase();
});

module.exports = app;
