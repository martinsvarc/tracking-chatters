# Message Analyzer Platform

A web-based platform to analyze and optimize text-based conversations for performance monitoring, focusing on chatter performance to maximize user investment, spending, and emotional connection.

## Features

- **Real-time Analytics Dashboard**: View aggregated metrics including acknowledgment scores, affection scores, response times, and conversion rates
- **Interactive Data Table**: Sortable table with expandable rows showing conversation details
- **Advanced Filtering**: Filter by operator, model, and date range
- **AI Query Assistant**: Ask questions about your filtered data with intelligent analysis
- **Responsive Design**: Modern UI built with React and Tailwind CSS
- **Database Integration**: Connected to NEON Postgres for real-time data storage

## Architecture

### Frontend
- **React.js** with TypeScript
- **Tailwind CSS** for styling
- **Components**:
  - `Header.tsx`: Dashboard with total scores and refresh functionality
  - `Table.tsx`: Sortable table with expandable conversation rows
  - `FilterBar.tsx`: Floating filter bar with operator, model, and date filters
  - `Modal.tsx`: AI query popup for data analysis
  - `App.tsx`: Main container managing state and API integration

### Backend
- **Node.js** with Express.js
- **NEON Postgres** database
- **API Endpoints**:
  - `GET /threads`: Fetch threads with optional filtering
  - `POST /threads`: Add new conversation messages
  - `GET /stats`: Get aggregated statistics
  - `GET /health`: Health check endpoint

### Database Schema
```sql
CREATE TABLE threads (
  id SERIAL PRIMARY KEY,
  message TEXT,
  type VARCHAR(10),
  operator VARCHAR(50),
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  model VARCHAR(50)
);

-- Indexes for performance
CREATE INDEX idx_operator ON threads(operator);
CREATE INDEX idx_model ON threads(model);
CREATE INDEX idx_date ON threads(date);
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- NEON Postgres database account

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

1. Create a NEON Postgres database at [neon.tech](https://neon.tech)
2. Copy your connection string
3. Update `server/.env` with your database URL:

```env
DATABASE_URL=postgres://username:password@hostname:port/database
PORT=5000
```

### 3. Environment Configuration

The React app is configured to connect to the backend at `http://localhost:5000` by default. Update `.env` if needed:

```env
REACT_APP_API_URL=http://localhost:5000
```

### 4. Start the Application

#### Start the Backend Server
```bash
cd server
npm start
```

The server will start on port 5000 and automatically create the database table and indexes.

#### Start the Frontend (in a new terminal)
```bash
npm start
```

The React app will start on port 3000 and open in your browser.

### 5. Add Sample Data

Once both servers are running, you can add sample data by:
1. Clicking the "Add Sample Data (Demo Mode)" button if you see a connection error
2. Or use the API directly:

```bash
curl -X POST http://localhost:5000/threads \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you today?",
    "type": "incoming",
    "operator": "Sarah",
    "model": "GPT-4"
  }'
```

## Usage

### Dashboard
- View aggregated metrics in the header
- Click "Refresh" to update data
- Color-coded scores: Green (>80), Yellow (50-80), Red (<50)

### Data Table
- Click on any row to expand and view conversation messages
- Sort columns by clicking headers
- View up to 10 messages per thread with "Load More" option

### Filtering
- Use the floating filter bar at the bottom
- Filter by multiple operators and models
- Set date ranges for time-based analysis
- Clear all filters with the "Clear Filters" button

### AI Queries
- Click "AI Query" button to open the analysis modal
- Ask questions about your filtered data
- Get insights and recommendations based on current filters

## API Endpoints

### GET /threads
Fetch conversation threads with optional filtering.

**Query Parameters:**
- `operator`: Filter by operator name
- `model`: Filter by AI model
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)

**Example:**
```
GET /threads?operator=Sarah&model=GPT-4&start=2024-01-01&end=2024-01-31
```

### POST /threads
Add a new conversation message.

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "type": "incoming",
  "operator": "Sarah",
  "model": "GPT-4"
}
```

### GET /stats
Get aggregated statistics for the dashboard.

**Response:**
```json
{
  "avgAcknowledgment": 75,
  "avgAffection": 68,
  "avgResponseTime": 45,
  "avgResponseRate": 82,
  "avgPersonalization": 71,
  "totalConverted": 12
}
```

## Development

### Project Structure
```
├── src/
│   ├── App.tsx          # Main application component
│   ├── Header.tsx       # Dashboard header with metrics
│   ├── Table.tsx        # Data table with sorting and expansion
│   ├── FilterBar.tsx    # Floating filter controls
│   ├── Modal.tsx        # AI query modal
│   └── globals.css      # Tailwind CSS configuration
├── server/
│   ├── index.js         # Express server
│   ├── package.json     # Backend dependencies
│   └── .env            # Database configuration
├── public/              # Static assets
└── package.json         # Frontend dependencies
```

### Adding New Features

1. **Scoring Logic**: Update the backend to calculate real metrics from conversation data
2. **AI Integration**: Replace mock AI responses with actual AI model integration
3. **Real-time Updates**: Add WebSocket support for live data updates
4. **Export Features**: Add CSV/PDF export functionality
5. **User Authentication**: Implement user login and role-based access

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify your NEON Postgres connection string in `server/.env`
   - Ensure the database is accessible and credentials are correct

2. **CORS Errors**
   - Make sure the backend server is running on port 5000
   - Check that `REACT_APP_API_URL` matches your backend URL

3. **No Data Displayed**
   - Add sample data using the demo mode button
   - Check browser console for API errors
   - Verify backend server is running and accessible

4. **Styling Issues**
   - Ensure Tailwind CSS is properly configured
   - Check that `globals.css` is imported in your components

### Development Tips

- Use browser developer tools to inspect API calls
- Check server logs for backend errors
- Use the health endpoint (`GET /health`) to verify server status
- Monitor database connections in NEON dashboard

## License

This project is for educational and development purposes.

## Support

For issues and questions, please check the troubleshooting section or review the code comments for implementation details.