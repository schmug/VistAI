# VistAI API Documentation

This document provides comprehensive API documentation for the VistAI backend worker. For interactive documentation, visit `/docs` when the worker is running.

## Base URL

**Development**: `http://localhost:8787` (when running `wrangler dev`)  
**Production**: `https://your-worker-name.your-subdomain.workers.dev`

## Authentication

VistAI uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Tokens are obtained through the `/api/login` or `/api/register` endpoints.

## Endpoints Overview

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/status` | GET | No | API health check |
| `/api/register` | POST | No | Create new user account |
| `/api/login` | POST | No | Authenticate user |
| `/api/me` | GET | Yes | Get current user info |
| `/api/search` | POST | No* | Search across AI models |
| `/api/track-click` | POST | Optional | Track result clicks |
| `/api/model-stats` | GET | No | Get model performance stats |
| `/api/top-models` | GET | No | Get top-performing models |
| `/api/popular-queries` | GET | No | Get most searched queries |
| `/api/recent-queries` | GET | No | Get recent search queries |

*Search requires OpenRouter API key via header or environment variable

## Detailed Endpoint Documentation

### GET `/api/status`

Health check endpoint that returns API status and configuration.

**Response**:
```json
{
  "status": "ok",
  "apiKey": true,
  "db": true,
  "time": "2025-01-01T12:00:00.000Z"
}
```

**Response Fields**:
- `status`: Always "ok" if API is responding
- `apiKey`: Boolean indicating if OpenRouter API key is configured
- `db`: Boolean indicating if database is connected
- `time`: Current server timestamp

---

### POST `/api/register`

Create a new user account.

**Request Body**:
```json
{
  "username": "string (3-50 chars, alphanumeric)",
  "password": "string (8+ chars)"
}
```

**Response** (201 Created):
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid user data
- `409 Conflict`: Username already exists

---

### POST `/api/login`

Authenticate an existing user.

**Request Body**:
```json
{
  "username": "string",
  "password": "string"
}
```

**Response** (200 OK):
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "username": "testuser"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Missing username or password
- `401 Unauthorized`: Invalid credentials

---

### GET `/api/me`

Get information about the currently authenticated user.

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "testuser"
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or missing token
- `404 Not Found`: User not found

---

### POST `/api/search`

Search across multiple AI models simultaneously.

**Headers**:
```
Content-Type: application/json
Accept: application/json OR text/event-stream
openrouter_api_key: sk-... (optional, if not set in environment)
```

**Request Body**:
```json
{
  "query": "string (1-1000 chars)"
}
```

**Response Modes**:

#### JSON Response (Accept: application/json)
```json
{
  "search": {
    "id": 123,
    "query": "What is artificial intelligence?",
    "createdAt": "2025-01-01T12:00:00.000Z"
  },
  "results": [
    {
      "id": 456,
      "searchId": 123,
      "modelId": "openai/gpt-4o-mini",
      "snippet": "AI is the simulation of human intelligence...",
      "content": "Artificial intelligence (AI) is the simulation of human intelligence in machines...",
      "title": "Understanding Artificial Intelligence",
      "responseTime": 1250,
      "createdAt": "2025-01-01T12:00:01.250Z",
      "modelName": "gpt-4o-mini"
    }
  ],
  "totalTime": 2500
}
```

#### Streaming Response (Accept: text/event-stream)
Server-Sent Events stream with the following event types:

**search event**:
```
event: search
data: {"id": 123, "query": "...", "createdAt": "..."}
```

**result event** (sent for each model response):
```
event: result
data: {"id": 456, "searchId": 123, "modelId": "...", "content": "...", ...}
```

**done event** (final event):
```
event: done
data: {"search": {...}, "results": [...], "totalTime": 2500}
```

**error event** (if errors occur):
```
event: error
data: {"message": "Error description", "type": "api"}
```

**Error Responses**:
- `400 Bad Request`: Missing or invalid query
- `500 Internal Server Error`: OpenRouter API key not configured or other server error

---

### POST `/api/track-click`

Track when a user clicks on a search result for analytics.

**Headers**:
```
Content-Type: application/json
Authorization: Bearer <jwt_token> (optional)
```

**Request Body**:
```json
{
  "resultId": 456
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "click": {
    "id": 789,
    "resultId": 456,
    "userId": 1,
    "createdAt": "2025-01-01T12:00:00.000Z"
  },
  "stats": [
    {
      "modelId": "openai/gpt-4o-mini",
      "clickCount": 42,
      "searchCount": 100,
      "updatedAt": "2025-01-01T12:00:00.000Z",
      "percentage": 35,
      "displayName": "GPT-4o Mini"
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid result ID
- `404 Not Found`: Result not found

---

### GET `/api/model-stats`

Get performance statistics for all AI models.

**Response** (200 OK):
```json
[
  {
    "modelId": "openai/gpt-4o-mini",
    "clickCount": 42,
    "searchCount": 100,
    "updatedAt": "2025-01-01T12:00:00.000Z",
    "percentage": 35,
    "displayName": "GPT-4o Mini"
  },
  {
    "modelId": "anthropic/claude-3.7-sonnet",
    "clickCount": 28,
    "searchCount": 85,
    "updatedAt": "2025-01-01T11:00:00.000Z",
    "percentage": 23,
    "displayName": "Claude 3.7 Sonnet"
  }
]
```

---

### GET `/api/top-models`

Get top-performing models by click count.

**Query Parameters**:
- `limit` (optional): Number of models to return (default: 5, max: 50)

**Example**: `GET /api/top-models?limit=3`

**Response** (200 OK):
```json
[
  {
    "modelId": "openai/gpt-4o-mini",
    "clickCount": 42,
    "searchCount": 100,
    "updatedAt": "2025-01-01T12:00:00.000Z",
    "percentage": 35,
    "displayName": "GPT-4o Mini"
  }
]
```

---

### GET `/api/popular-queries`

Get most frequently searched queries.

**Query Parameters**:
- `limit` (optional): Number of queries to return (default: 5, max: 50)

**Response** (200 OK):
```json
[
  {
    "query": "What is artificial intelligence?",
    "count": 25
  },
  {
    "query": "How to learn programming?",
    "count": 18
  }
]
```

---

### GET `/api/recent-queries`

Get most recently searched queries.

**Query Parameters**:
- `limit` (optional): Number of queries to return (default: 5, max: 50)

**Response** (200 OK):
```json
[
  {
    "query": "Latest AI developments 2025",
    "createdAt": "2025-01-01T12:00:00.000Z"
  },
  {
    "query": "Best programming languages",
    "createdAt": "2025-01-01T11:45:00.000Z"
  }
]
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Search endpoints**: 10 requests per minute per user
- **Analytics endpoints**: 100 requests per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1640995200
```

## CORS

The API supports Cross-Origin Resource Sharing (CORS). The following headers are included:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, openrouter_api_key
```

## OpenRouter Integration

VistAI integrates with [OpenRouter](https://openrouter.ai) to access multiple AI models. 

### Supported Models

The API dynamically selects models based on:
1. Top-performing models from OpenRouter
2. Trending models from OpenRouter
3. Fallback models if OpenRouter is unavailable

**Fallback Models**:
- `google/gemini-2.0-flash-001`
- `openai/gpt-4o-mini`
- `anthropic/claude-3.7-sonnet`
- `google/gemini-2.5-pro-preview`
- `deepseek/deepseek-chat-v3-0324:free`

### API Key Configuration

Provide your OpenRouter API key via:

1. **Environment variable** (server-side): `OPENROUTER_API_KEY`
2. **Request header** (client-side): `openrouter_api_key: sk-...`

## Database Schema

The API uses the following database tables:

### users
- `id`: Primary key
- `username`: Unique username
- `password`: Hashed password

### searches
- `id`: Primary key
- `query`: Search query text
- `created_at`: Timestamp

### results
- `id`: Primary key
- `search_id`: Foreign key to searches
- `model_id`: AI model identifier
- `content`: Full response content
- `title`: Extracted title
- `response_time`: Response time in milliseconds
- `created_at`: Timestamp

### clicks
- `id`: Primary key
- `result_id`: Foreign key to results
- `user_id`: Foreign key to users (optional)
- `created_at`: Timestamp

### model_stats
- `id`: Primary key
- `model_id`: AI model identifier
- `click_count`: Number of clicks
- `search_count`: Number of searches
- `updated_at`: Last update timestamp

## SDK Examples

### JavaScript/TypeScript

```typescript
class VistAIClient {
  constructor(private baseUrl: string, private apiKey?: string) {}

  async search(query: string): Promise<SearchResponse> {
    const response = await fetch(`${this.baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'openrouter_api_key': this.apiKey })
      },
      body: JSON.stringify({ query })
    });
    return response.json();
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  }
}

// Usage
const client = new VistAIClient('https://your-worker.workers.dev');
const results = await client.search('What is machine learning?');
```

### Python

```python
import requests

class VistAIClient:
    def __init__(self, base_url: str, api_key: str = None):
        self.base_url = base_url
        self.api_key = api_key

    def search(self, query: str) -> dict:
        headers = {'Content-Type': 'application/json'}
        if self.api_key:
            headers['openrouter_api_key'] = self.api_key
        
        response = requests.post(
            f"{self.base_url}/api/search",
            json={"query": query},
            headers=headers
        )
        return response.json()

# Usage
client = VistAIClient('https://your-worker.workers.dev')
results = client.search('What is machine learning?')
```

## Support

For API support and questions:
- Review this documentation
- Check the interactive docs at `/docs`
- Report issues on the project repository
- Consult the main README.md for deployment help