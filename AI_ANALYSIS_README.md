# AI Analysis Feature Implementation

## Overview

The AI Analysis feature allows users to run comprehensive analysis on filtered conversation threads by sending data to an external webhook for AI processing. The feature includes both frontend modal integration and backend API endpoints.

## Features Implemented

### 1. Backend API Endpoints

#### POST `/api/analyze`
- **Purpose**: Fetches filtered threads and sends them to the AI analysis webhook
- **Request Body**:
  ```json
  {
    "filters": {
      "operators": ["Sarah", "Emma"],
      "models": ["GPT-4", "GPT-3.5"],
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "numberOfChats": 100,
    "threadDepth": 30
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Analysis sent to webhook successfully",
    "threadsAnalyzed": 85,
    "webhookStatus": 200
  }
  ```

#### PUT `/api/threads/:id`
- **Purpose**: Updates AI scores for a specific thread
- **Request Body**:
  ```json
  {
    "acknowledgment_score": 85,
    "affection_score": 92,
    "personalization_score": 78
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Thread updated successfully",
    "thread": {
      "thread_id": "thread_001",
      "operator": "Sarah",
      "model": "GPT-4",
      "acknowledgment_score": 85,
      "affection_score": 92,
      "personalization_score": 78,
      "converted": "Yes",
      "last_message": "2024-01-15T14:30:00Z",
      "avg_response_time": 45,
      "responded": "Yes"
    }
  }
  ```

### 2. Frontend Integration

#### Modal Component Updates
- **File**: `src/Modal.tsx`
- **Changes**:
  - Added real API call for analysis mode
  - Integrated with `/api/analyze` endpoint
  - Enhanced error handling and user feedback
  - Maintains mock functionality for query mode

#### Filter Bar Integration
- **File**: `src/FilterBar.tsx`
- **Features**:
  - "Run AI Analysis" button triggers analysis modal
  - Passes current filter state to modal
  - Maintains existing filter functionality

### 3. Webhook Integration

#### Webhook URL
```
https://n8n.automatedsolarbiz.com/webhook/b69cd496-1b6d-42f5-88c8-4af3697c2db8
```

#### Payload Structure
The webhook receives a JSON array of threads, each containing:
```json
[
  {
    "thread_id": "thread_001",
    "operator": "Sarah",
    "model": "GPT-4",
    "messages": [
      {
        "type": "incoming",
        "message": "Hello, I need help",
        "date": "2024-01-15T14:30:00Z"
      },
      {
        "type": "outgoing",
        "message": "Hi! How can I help you?",
        "date": "2024-01-15T14:31:00Z"
      }
    ],
    "converted": "Yes",
    "last_message": "2024-01-15T14:31:00Z",
    "avg_response_time": 45,
    "responded": "Yes"
  }
]
```

## Usage Instructions

### 1. Running AI Analysis

1. **Open the Modal**: Click the "Run AI Analysis" button in the filter bar
2. **Configure Parameters**:
   - Set "Number of Chats" (1-10,000)
   - Set "Thread Depth" (1-1,000 messages per thread)
3. **Apply Filters**: Use the filter bar to select operators, models, and date ranges
4. **Run Analysis**: Click "Run Analysis" button
5. **View Results**: The modal will show success/failure status and analysis details

### 2. Updating Thread Scores

Use the PUT endpoint to update AI scores for specific threads:

```bash
curl -X PUT "http://localhost:5000/api/threads/thread_001" \
  -H "Content-Type: application/json" \
  -d '{
    "acknowledgment_score": 85,
    "affection_score": 92,
    "personalization_score": 78
  }'
```

## Testing

### 1. Automated Tests

Run the Node.js test script:
```bash
node test-ai-analysis.js
```

### 2. PowerShell Tests (Windows)

Run the PowerShell test script:
```powershell
.\test-api.ps1
```

### 3. Manual Testing

Use the curl test script:
```bash
./test-curl.sh
```

## Database Schema

The implementation uses the existing database schema with the following key tables:

### `threads` Table
- `thread_id` (PRIMARY KEY)
- `operator`, `model`
- `acknowledgment_score`, `affection_score`, `personalization_score`
- `converted`, `last_message`, `avg_response_time`, `responded`

### `messages` Table
- `id` (PRIMARY KEY)
- `thread_id` (FOREIGN KEY)
- `operator`, `model`, `type`, `message`, `date`

## Error Handling

### Backend Error Handling
- Database connection validation
- Input parameter validation
- Webhook request error handling
- Comprehensive logging

### Frontend Error Handling
- API call error handling
- User-friendly error messages
- Loading states and feedback

## Security Considerations

1. **Input Validation**: All inputs are validated on the backend
2. **SQL Injection Prevention**: Uses parameterized queries
3. **Error Information**: Limited error details exposed to frontend
4. **Webhook Security**: Webhook URL is hardcoded for security

## Performance Considerations

1. **Database Indexes**: Optimized queries with proper indexing
2. **Batch Processing**: Efficient thread and message fetching
3. **Connection Pooling**: Uses PostgreSQL connection pooling
4. **Response Time**: Optimized for large datasets

## Deployment

### Vercel Deployment
1. Ensure environment variables are set:
   - `DATABASE_URL`
   - `NODE_ENV=production`

2. Deploy with:
   ```bash
   vercel --prod
   ```

3. Test the endpoints:
   ```bash
   curl -X POST "https://your-app.vercel.app/api/analyze" \
     -H "Content-Type: application/json" \
     -d '{"filters":{},"numberOfChats":5,"threadDepth":10}'
   ```

## Monitoring and Logging

The implementation includes comprehensive logging:
- Request/response logging
- Database query logging
- Webhook status logging
- Error tracking and reporting

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live analysis results
2. **Batch Processing**: Queue-based processing for large datasets
3. **Caching**: Redis caching for frequently accessed data
4. **Analytics Dashboard**: Dedicated UI for analysis results
5. **Webhook Callbacks**: Handle analysis results from webhook

## Troubleshooting

### Common Issues

1. **Database Connection**: Check `DATABASE_URL` environment variable
2. **Webhook Failures**: Verify webhook URL and network connectivity
3. **Filter Issues**: Ensure filter parameters are properly formatted
4. **Performance**: Monitor database query performance and indexes

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will provide detailed console output for debugging.
