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

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Test database connection
  pool.on('connect', () => {
    console.log('Connected to NEON Postgres database');
    dbConnected = true;
  });

  pool.on('error', (err) => {
    console.error('Database connection error:', err);
    dbConnected = false;
  });
} catch (error) {
  console.error('Failed to initialize database pool:', error);
  dbConnected = false;
}

// Initialize database tables and indexes
async function initializeDatabase() {
  if (!dbConnected || !pool) {
    console.log('Database not connected - running in demo mode with mock data');
    return;
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
        responded VARCHAR(3)
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

    console.log('Database tables and indexes created successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
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

// API Routes

// Mock data for demo mode
const mockThreads = [
  {
    id: 1,
    message: "Hello, how are you today?",
    type: 'incoming',
    operator: 'Sarah',
    date: '2024-01-15T10:30:00Z',
    model: 'GPT-4'
  },
  {
    id: 2,
    message: "I'm doing great, thanks for asking!",
    type: 'outgoing',
    operator: 'Sarah',
    date: '2024-01-15T10:31:00Z',
    model: 'GPT-4'
  },
  {
    id: 3,
    message: "What can I help you with today?",
    type: 'incoming',
    operator: 'Emma',
    date: '2024-01-15T11:15:00Z',
    model: 'GPT-3.5'
  },
  {
    id: 4,
    message: "I'd like to know more about your premium features",
    type: 'outgoing',
    operator: 'Emma',
    date: '2024-01-15T11:16:00Z',
    model: 'GPT-3.5'
  },
  {
    id: 5,
    message: "Of course! Let me tell you about our premium services",
    type: 'incoming',
    operator: 'Jessica',
    date: '2024-01-15T14:20:00Z',
    model: 'Claude'
  },
  {
    id: 6,
    message: "That sounds interesting, can you tell me more?",
    type: 'outgoing',
    operator: 'Jessica',
    date: '2024-01-15T14:21:00Z',
    model: 'Claude'
  }
];

// GET /threads - Fetch all threads with calculated fields and optional filtering
app.get('/threads', async (req, res) => {
  try {
    // If database is not connected, return mock data
    if (!dbConnected || !pool) {
      const { operator, model, start, end } = req.query;
      
      let filteredThreads = [...mockThreads];
      
      // Apply filters to mock data
      if (operator) {
        const operators = operator.split(',');
        filteredThreads = filteredThreads.filter(thread => 
          operators.includes(thread.operator)
        );
      }
      
      if (model) {
        const models = model.split(',');
        filteredThreads = filteredThreads.filter(thread => 
          models.includes(thread.model)
        );
      }
      
      if (start) {
        filteredThreads = filteredThreads.filter(thread => 
          new Date(thread.date) >= new Date(start)
        );
      }
      
      if (end) {
        filteredThreads = filteredThreads.filter(thread => 
          new Date(thread.date) <= new Date(end)
        );
      }
      
      return res.json(filteredThreads);
    }
    
    const { operator, model, start, end } = req.query;
    
    // Query to fetch threads with calculated fields
    let query = `
      SELECT 
        t.thread_id,
        t.operator,
        t.model,
        t.converted,
        t.last_message,
        t.avg_response_time,
        t.responded,
        EXTRACT(EPOCH FROM (NOW() - t.last_message)) as last_message_seconds_ago,
        EXTRACT(EPOCH FROM t.avg_response_time) as avg_response_seconds,
        COUNT(m.id) as message_count
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
      GROUP BY t.thread_id, t.operator, t.model, t.converted, t.last_message, t.avg_response_time, t.responded
      ORDER BY t.last_message DESC
    `;

    const result = await pool.query(query, params);
    
    // Format the response with calculated fields
    const formattedThreads = result.rows.map(row => ({
      thread_id: row.thread_id,
      operator: row.operator,
      model: row.model,
      converted: row.converted,
      last_message: row.last_message,
      last_message_relative: formatRelativeTime(row.last_message_seconds_ago),
      avg_response_time: row.avg_response_seconds ? Math.round(row.avg_response_seconds) : null,
      responded: row.responded,
      message_count: parseInt(row.message_count)
    }));
    
    res.json(formattedThreads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
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

// POST /threads - Add new message with upsert logic and automated calculations
app.post('/threads', async (req, res) => {
  try {
    const { operator, thread_id, model, type, message, converted } = req.body;
    
    if (!operator || !thread_id || !model || !type || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields: operator, thread_id, model, type, message' 
      });
    }

    // If database is not connected, simulate adding to mock data
    if (!dbConnected || !pool) {
      const newMessage = {
        id: mockThreads.length + 1,
        thread_id,
        message,
        type,
        operator,
        model,
        date: new Date().toISOString(),
        converted: converted || null
      };
      mockThreads.push(newMessage);
      return res.status(201).json(newMessage);
    }

    // Start transaction for atomic operations
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Upsert thread record
      const threadUpsertQuery = `
        INSERT INTO threads (thread_id, operator, model, converted)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (thread_id) 
        DO UPDATE SET 
          converted = CASE 
            WHEN EXCLUDED.converted = 'Yes' THEN EXCLUDED.converted 
            ELSE threads.converted 
          END
      `;
      await client.query(threadUpsertQuery, [thread_id, operator, model, converted || null]);

      // Insert message
      const messageInsertQuery = `
        INSERT INTO messages (thread_id, operator, model, type, message)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;
      const messageResult = await client.query(messageInsertQuery, [thread_id, operator, model, type, message]);

      // Update automated calculations
      await updateThreadCalculations(client, thread_id);

      await client.query('COMMIT');
      
      res.status(201).json({
        ...messageResult.rows[0],
        thread_id,
        converted: converted || null
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Helper function to update automated calculations for a thread
async function updateThreadCalculations(client, threadId) {
  try {
    // Update last_message timestamp
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

    // Calculate responded status
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

    // Update threads table with calculated values
    await client.query(`
      UPDATE threads 
      SET avg_response_time = $2, responded = $3
      WHERE thread_id = $1
    `, [threadId, avgResponseTime, responded]);

  } catch (error) {
    console.error('Error updating thread calculations:', error);
    throw error;
  }
}

// GET /stats - Get aggregated statistics for header
app.get('/stats', async (req, res) => {
  try {
    const { operator, model, start, end } = req.query;
    
    // If database is not connected, return placeholder stats
    if (!dbConnected || !pool) {
      const stats = {
        avgAcknowledgment: 75,
        avgAffection: 68,
        avgResponseTime: 45,
        avgResponseRate: 82,
        avgPersonalization: 71,
        totalConverted: 12,
        totalChats: 156
      };
      return res.json(stats);
    }
    
    // Build query with filters
    let query = `
      SELECT 
        COUNT(*) as total_chats,
        COUNT(CASE WHEN converted = 'Yes' THEN 1 END) as total_converted,
        AVG(EXTRACT(EPOCH FROM avg_response_time)) as avg_response_time_seconds,
        COUNT(CASE WHEN responded = 'Yes' THEN 1 END) as responded_count
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

    const result = await pool.query(query, params);
    const row = result.rows[0];
    
    const totalChats = parseInt(row.total_chats) || 0;
    const totalConverted = parseInt(row.total_converted) || 0;
    const avgResponseTime = row.avg_response_time_seconds ? Math.round(row.avg_response_time_seconds) : 0;
    const respondedCount = parseInt(row.responded_count) || 0;
    
    const stats = {
      avgAcknowledgment: 75, // Placeholder - will be calculated by AI analysis
      avgAffection: 68, // Placeholder - will be calculated by AI analysis
      avgResponseTime: avgResponseTime,
      avgResponseRate: totalChats > 0 ? Math.round((respondedCount / totalChats) * 100) : 0,
      avgPersonalization: 71, // Placeholder - will be calculated by AI analysis
      totalConverted: totalConverted,
      totalChats: totalChats,
      conversionRate: totalChats > 0 ? Math.round((totalConverted / totalChats) * 100) : 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await initializeDatabase();
});

module.exports = app;
