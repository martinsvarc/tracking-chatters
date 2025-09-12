const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const fetch = require('node-fetch');
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
    
    const { operator, model, start, end, lastMessageSince, analyzedOnly, lastMessageType, chatView } = req.query;
    console.log('Query params:', { operator, model, start, end, lastMessageSince, analyzedOnly, lastMessageType, chatView });
    
    // Query to fetch threads with calculated fields and messages
    // Now includes messages array for each thread to display in UI
    // Added real-time responded calculation based on last message type and time
    // For chat view, fetch latest 50 messages per thread
    let query = `
      SELECT 
        t.thread_id,
        t.operator,
        t.model,
        t.converted,
        t.last_message,
        t.avg_response_time,
        CASE 
          WHEN lm.type = 'incoming' THEN 'Yes'
          WHEN lm.type = 'outgoing' AND (NOW() - lm.date) > INTERVAL '3 hours' THEN 'No'
          ELSE 'No'
        END as responded,
        t.acknowledgment_score,
        t.affection_score,
        t.personalization_score,
        COALESCE(t.sales_ability, 0) AS sales_ability,
        COALESCE(t.girl_roleplay_skill, 0) AS girl_roleplay_skill,
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
      LEFT JOIN messages m ON t.thread_id = m.thread_id ${
        chatView === 'true' 
          ? `AND m.id IN (
              SELECT id FROM messages m2 
              WHERE m2.thread_id = t.thread_id 
              ORDER BY m2.date DESC 
              LIMIT 50
            )`
          : ''
      }
      LEFT JOIN (
        SELECT DISTINCT ON (thread_id) thread_id, type, date
        FROM messages 
        ORDER BY thread_id, date DESC
      ) lm ON t.thread_id = lm.thread_id
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
    
    if (lastMessageSince && lastMessageSince !== 'all') {
      // Map interval keys to PostgreSQL INTERVAL format
      const intervalMap = {
        '30m': '30 minutes',
        '60m': '60 minutes',
        '2h': '2 hours',
        '3h': '3 hours',
        '4h': '4 hours',
        '5h': '5 hours',
        '6h': '6 hours',
        '7h': '7 hours',
        '8h': '8 hours',
        '9h': '9 hours',
        '10h': '10 hours',
        '11h': '11 hours',
        '12h': '12 hours',
        '13h': '13 hours',
        '14h': '14 hours',
        '15h': '15 hours',
        '16h': '16 hours',
        '17h': '17 hours',
        '18h': '18 hours',
        '19h': '19 hours',
        '20h': '20 hours',
        '21h': '21 hours',
        '22h': '22 hours',
        '23h': '23 hours',
        '24h': '24 hours',
        '2d': '2 days',
        '3d': '3 days',
        '7d': '7 days',
        '14d': '14 days',
        '30d': '30 days'
      };
      
      const interval = intervalMap[lastMessageSince];
      if (interval) {
        conditions.push(`t.last_message >= NOW() - INTERVAL '${interval}'`);
      }
    }
    
    if (analyzedOnly === 'true') {
      conditions.push(`t.acknowledgment_score IS NOT NULL AND t.affection_score IS NOT NULL AND t.personalization_score IS NOT NULL`);
    }
    
    if (lastMessageType && (lastMessageType === 'incoming' || lastMessageType === 'outgoing')) {
      conditions.push(`lm.type = $${params.length + 1}`);
      params.push(lastMessageType);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY t.thread_id, t.operator, t.model, t.converted, t.last_message, t.avg_response_time, t.acknowledgment_score, t.affection_score, t.personalization_score, t.sales_ability, t.girl_roleplay_skill, lm.type, lm.date
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
      sales_ability: row.sales_ability,
      girl_roleplay_skill: row.girl_roleplay_skill,
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

      // Check if thread meets criteria for automatic webhook analysis
      console.log('🔍 Checking if thread meets auto-analysis criteria');
      const messageCountsQuery = `
        SELECT 
          COUNT(*) FILTER (WHERE type = 'outgoing') as operator_count,
          COUNT(*) FILTER (WHERE type = 'incoming') as client_count
        FROM messages 
        WHERE thread_id = $1
      `;
      
      const countsResult = await client.query(messageCountsQuery, [thread_id]);
      const { operator_count, client_count } = countsResult.rows[0];
      
      console.log(`📊 Message counts for thread ${thread_id}:`, {
        operator_count: parseInt(operator_count),
        client_count: parseInt(client_count)
      });

      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      
      // Check if thread meets criteria for automatic webhook analysis
      // Trigger webhook if >= 3 outgoing (operator) and >= 3 incoming (client) messages
      if (parseInt(operator_count) >= 3 && parseInt(client_count) >= 3) {
        console.log(`🚀 Thread ${thread_id} meets criteria for auto-analysis (${operator_count} outgoing, ${client_count} incoming)`);
        
        // Send to webhook asynchronously (don't block the response)
        setImmediate(async () => {
          try {
            await sendThreadToWebhook(thread_id);
          } catch (error) {
            console.error(`❌ Failed to send thread ${thread_id} to webhook:`, error);
          }
        });
      } else {
        console.log(`⏳ Thread ${thread_id} does not meet criteria yet (${operator_count} outgoing, ${client_count} incoming)`);
      }
      
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
          WHEN type = 'incoming' THEN 'Yes'
          WHEN type = 'outgoing' AND (NOW() - date) > INTERVAL '3 hours' THEN 'No'
          ELSE 'No'
        END as responded
      FROM last_message_info
    `;
    
    const respondedResult = await client.query(respondedQuery, [threadId]);
    const responded = respondedResult.rows[0]?.responded || 'No';
    console.log('✅ Responded status calculated:', responded);
    
    // Get additional details for logging
    const detailsQuery = `
      SELECT type, date, NOW() - date as time_since_message
      FROM messages
      WHERE thread_id = $1
      ORDER BY date DESC
      LIMIT 1
    `;
    const detailsResult = await client.query(detailsQuery, [threadId]);
    const lastMessage = detailsResult.rows[0];
    
    console.log('📊 Responded calculation details:', {
      threadId,
      lastMessageType: lastMessage?.type || 'unknown',
      lastMessageDate: lastMessage?.date || 'unknown',
      timeSinceMessage: lastMessage?.time_since_message || 'unknown',
      calculatedResponded: responded
    });

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

// Helper function to send thread data to webhook for automatic analysis
async function sendThreadToWebhook(threadId) {
  console.log(`🚀 Sending thread ${threadId} to webhook for automatic analysis`);
  
  try {
    if (!pool) {
      throw new Error('Database pool not available');
    }

    // Fetch thread metadata
    const threadQuery = `
      SELECT 
        thread_id,
        operator,
        model,
        converted,
        last_message,
        avg_response_time,
        responded
      FROM threads 
      WHERE thread_id = $1
    `;
    
    const threadResult = await pool.query(threadQuery, [threadId]);
    
    if (threadResult.rows.length === 0) {
      throw new Error(`Thread ${threadId} not found`);
    }
    
    const thread = threadResult.rows[0];
    console.log('📊 Thread metadata fetched:', thread);

    // Fetch all messages for this thread
    const messagesQuery = `
      SELECT type, message, date
      FROM messages 
      WHERE thread_id = $1 
      ORDER BY date ASC
    `;
    
    const messagesResult = await pool.query(messagesQuery, [threadId]);
    const messages = messagesResult.rows.map(msg => ({
      type: msg.type,
      message: msg.message,
      date: msg.date
    }));
    
    console.log(`📝 Fetched ${messages.length} messages for thread ${threadId}`);

    // Prepare payload similar to existing analysis payload
    const payload = {
      thread_id: thread.thread_id,
      operator: thread.operator,
      model: thread.model,
      messages: messages,
      converted: thread.converted,
      last_message: thread.last_message,
      avg_response_time: thread.avg_response_time ? Math.round(thread.avg_response_time / 1000) : null, // Convert to seconds
      responded: thread.responded
    };

    console.log('📦 Prepared webhook payload:', {
      thread_id: payload.thread_id,
      operator: payload.operator,
      model: payload.model,
      message_count: payload.messages.length,
      converted: payload.converted,
      responded: payload.responded
    });

    // Send to webhook
    const webhookUrl = 'https://n8n.automatedsolarbiz.com/webhook/b69cd496-1b6d-42f5-88c8-4af3697c2db8';
    
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([payload]) // Wrap in array to match existing format
    });

    if (!webhookResponse.ok) {
      throw new Error(`Webhook responded with status: ${webhookResponse.status}`);
    }

    const webhookResult = await webhookResponse.text();
    console.log(`✅ Successfully sent thread ${threadId} to webhook for analysis`);
    console.log('📤 Webhook response:', webhookResult);

  } catch (error) {
    console.error(`❌ Error sending thread ${threadId} to webhook:`, error);
    throw error;
  }
}

// GET /api/stats - Get aggregated statistics for header
app.get('/api/stats', async (req, res) => {
  console.log('📥 GET /api/stats called');
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  try {
    const { operator, model, start, end, lastMessageSince, analyzedOnly } = req.query;
    console.log('Query params:', { operator, model, start, end, lastMessageSince, analyzedOnly });
    
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
        AVG(personalization_score) as avg_personalization,
        AVG(COALESCE(sales_ability, 0)) as avg_sales_ability,
        AVG(COALESCE(girl_roleplay_skill, 0)) as avg_girl_roleplay_skill,
        (SELECT COUNT(*) FROM messages WHERE date >= NOW() - INTERVAL '60 minutes' AND type = 'outgoing') as operator_messages_60min,
        (SELECT COUNT(*) FROM messages WHERE date >= NOW() - INTERVAL '60 minutes' AND type = 'incoming') as new_chats_60min
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
    
    if (lastMessageSince && lastMessageSince !== 'all') {
      // Map interval keys to PostgreSQL INTERVAL format
      const intervalMap = {
        '30m': '30 minutes',
        '60m': '60 minutes',
        '2h': '2 hours',
        '3h': '3 hours',
        '4h': '4 hours',
        '5h': '5 hours',
        '6h': '6 hours',
        '7h': '7 hours',
        '8h': '8 hours',
        '9h': '9 hours',
        '10h': '10 hours',
        '11h': '11 hours',
        '12h': '12 hours',
        '13h': '13 hours',
        '14h': '14 hours',
        '15h': '15 hours',
        '16h': '16 hours',
        '17h': '17 hours',
        '18h': '18 hours',
        '19h': '19 hours',
        '20h': '20 hours',
        '21h': '21 hours',
        '22h': '22 hours',
        '23h': '23 hours',
        '24h': '24 hours',
        '2d': '2 days',
        '3d': '3 days',
        '7d': '7 days',
        '14d': '14 days',
        '30d': '30 days'
      };
      
      const interval = intervalMap[lastMessageSince];
      if (interval) {
        conditions.push(`t.last_message >= NOW() - INTERVAL '${interval}'`);
      }
    }
    
    if (analyzedOnly === 'true') {
      conditions.push(`t.acknowledgment_score IS NOT NULL AND t.affection_score IS NOT NULL AND t.personalization_score IS NOT NULL`);
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
    const avgSalesAbility = row.avg_sales_ability ? Math.round(row.avg_sales_ability) : 0;
    const avgGirlRoleplaySkill = row.avg_girl_roleplay_skill ? Math.round(row.avg_girl_roleplay_skill) : 0;
    const operatorMessages60min = parseInt(row.operator_messages_60min) || 0;
    const newChats60min = parseInt(row.new_chats_60min) || 0;
    
    const stats = {
      avgAcknowledgment: avgAcknowledgment,
      avgAffection: avgAffection,
      avgResponseTime: avgResponseTime,
      responseRate: totalChats > 0 ? Math.round((respondedCount / totalChats) * 100) : 0,
      avgPersonalization: avgPersonalization,
      avgSalesAbility: avgSalesAbility,
      avgGirlRoleplaySkill: avgGirlRoleplaySkill,
      totalConverted: totalConverted,
      totalChats: totalChats,
      conversionRate: totalChats > 0 ? Math.round((totalConverted / totalChats) * 100) : 0,
      operatorMessages60min: operatorMessages60min,
      newChats60min: newChats60min
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

// POST /api/analyze - Run AI Analysis on filtered threads
app.post('/api/analyze', async (req, res) => {
  console.log('📥 POST /api/analyze called');
  console.log('Request body:', req.body);
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  try {
    const { filters, numberOfChats, threadDepth } = req.body;
    
    if (!numberOfChats || !threadDepth) {
      console.error('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields: numberOfChats, threadDepth' 
      });
    }

    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database not available' });
    }

    // Build query to fetch threads matching filters
    let query = `
      SELECT 
        t.thread_id,
        t.operator,
        t.model,
        t.converted,
        t.last_message,
        t.avg_response_time,
        t.responded
      FROM threads t
    `;
    
    const params = [];
    const conditions = [];

    // Add filtering conditions
    if (filters.operators && filters.operators.length > 0) {
      conditions.push(`t.operator = ANY($${params.length + 1})`);
      params.push(filters.operators);
    }
    
    if (filters.models && filters.models.length > 0) {
      conditions.push(`t.model = ANY($${params.length + 1})`);
      params.push(filters.models);
    }
    
    if (filters.startDate) {
      conditions.push(`t.last_message >= $${params.length + 1}`);
      params.push(filters.startDate);
    }
    
    if (filters.endDate) {
      conditions.push(`t.last_message <= $${params.length + 1}`);
      params.push(filters.endDate);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` ORDER BY t.last_message DESC LIMIT $${params.length + 1}`;
    params.push(numberOfChats);

    console.log('Executing threads query:', query);
    console.log('Query params:', params);
    
    const threadsResult = await pool.query(query, params);
    console.log(`✅ Found ${threadsResult.rows.length} threads matching filters`);
    
    if (threadsResult.rows.length === 0) {
      return res.json({
        success: true,
        threadsAnalyzed: 0,
        webhookSuccess: true,
        message: 'No threads found matching the specified filters'
      });
    }

    // For each thread, fetch messages up to threadDepth
    const threadsWithMessages = [];
    
    for (const thread of threadsResult.rows) {
      console.log(`📝 Fetching messages for thread: ${thread.thread_id}`);
      
      const messagesQuery = `
        SELECT type, message, date
        FROM messages 
        WHERE thread_id = $1 
        ORDER BY date DESC 
        LIMIT $2
      `;
      
      const messagesResult = await pool.query(messagesQuery, [thread.thread_id, threadDepth]);
      
      const threadData = {
        thread_id: thread.thread_id,
        operator: thread.operator,
        model: thread.model,
        messages: messagesResult.rows.map(msg => ({
          type: msg.type,
          message: msg.message,
          date: msg.date
        })),
        converted: thread.converted,
        last_message: thread.last_message,
        avg_response_time: thread.avg_response_time ? Math.round(thread.avg_response_time / 1000) : null, // Convert to seconds
        responded: thread.responded
      };
      
      threadsWithMessages.push(threadData);
    }

    console.log(`📊 Prepared ${threadsWithMessages.length} threads with messages for webhook`);

    // Send payload to webhook
    const webhookUrl = 'https://n8n.automatedsolarbiz.com/webhook/b69cd496-1b6d-42f5-88c8-4af3697c2db8';
    
    try {
      console.log('🚀 Sending payload to webhook:', webhookUrl);
      
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threadsWithMessages)
      });

      if (!webhookResponse.ok) {
        throw new Error(`Webhook responded with status: ${webhookResponse.status}`);
      }

      const webhookResult = await webhookResponse.text();
      console.log('✅ Webhook response:', webhookResult);

      res.json({
        success: true,
        threadsAnalyzed: threadsWithMessages.length,
        webhookSuccess: true,
        message: `Successfully sent ${threadsWithMessages.length} threads to webhook for analysis`,
        webhookResponse: webhookResult
      });

    } catch (webhookError) {
      console.error('❌ Webhook error:', webhookError);
      
      res.json({
        success: true,
        threadsAnalyzed: threadsWithMessages.length,
        webhookSuccess: false,
        message: `Prepared ${threadsWithMessages.length} threads but failed to send to webhook`,
        error: webhookError.message
      });
    }

  } catch (error) {
    console.error('❌ Error in analyze endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to run analysis',
      details: error.message 
    });
  }
});

// PUT /api/threads/:id - Update thread analysis scores
app.put('/api/threads/:id', async (req, res) => {
  console.log('📥 PUT /api/threads/:id called');
  console.log('Thread ID:', req.params.id);
  console.log('Request body:', req.body);
  console.log('Database connected:', dbConnected);
  console.log('Pool exists:', !!pool);
  
  try {
    const threadId = req.params.id;
    const { acknowledgment_score, affection_score, personalization_score, sales_ability, girl_roleplay_skill } = req.body;
    
    if (!threadId) {
      console.error('❌ Missing thread ID');
      return res.status(400).json({ 
        error: 'Missing thread ID' 
      });
    }

    if (!pool) {
      console.error('❌ Database pool not available');
      return res.status(500).json({ error: 'Database not available' });
    }

    // Validate scores are numbers between 0-100 if provided
    const scores = { acknowledgment_score, affection_score, personalization_score, sales_ability, girl_roleplay_skill };
    for (const [key, value] of Object.entries(scores)) {
      if (value !== null && value !== undefined) {
        if (typeof value !== 'number' || value < 0 || value > 100) {
          return res.status(400).json({ 
            error: `${key} must be a number between 0 and 100` 
          });
        }
      }
    }

    // Update thread with new scores
    const updateQuery = `
      UPDATE threads 
      SET 
        acknowledgment_score = COALESCE($1, acknowledgment_score),
        affection_score = COALESCE($2, affection_score),
        personalization_score = COALESCE($3, personalization_score),
        sales_ability = COALESCE($4, sales_ability),
        girl_roleplay_skill = COALESCE($5, girl_roleplay_skill)
      WHERE thread_id = $6
      RETURNING *
    `;
    
    console.log('Executing update query:', updateQuery);
    console.log('Update params:', [acknowledgment_score, affection_score, personalization_score, sales_ability, girl_roleplay_skill, threadId]);
    
    const result = await pool.query(updateQuery, [acknowledgment_score, affection_score, personalization_score, sales_ability, girl_roleplay_skill, threadId]);
    
    if (result.rows.length === 0) {
      console.error('❌ Thread not found:', threadId);
      return res.status(404).json({ 
        error: 'Thread not found' 
      });
    }

    const updatedThread = result.rows[0];
    console.log('✅ Thread updated successfully:', updatedThread);

    res.json({
      success: true,
      thread: {
        thread_id: updatedThread.thread_id,
        operator: updatedThread.operator,
        model: updatedThread.model,
        acknowledgment_score: updatedThread.acknowledgment_score,
        affection_score: updatedThread.affection_score,
        personalization_score: updatedThread.personalization_score,
        sales_ability: updatedThread.sales_ability,
        girl_roleplay_skill: updatedThread.girl_roleplay_skill,
        converted: updatedThread.converted,
        last_message: updatedThread.last_message,
        avg_response_time: updatedThread.avg_response_time,
        responded: updatedThread.responded
      }
    });

  } catch (error) {
    console.error('❌ Error updating thread:', error);
    res.status(500).json({ 
      error: 'Failed to update thread',
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
