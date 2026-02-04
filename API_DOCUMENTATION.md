# REDAS API Documentation

## Overview

The REDAS (Remote Deployment and Support) API provides endpoints for managing missions, users, documents, reports, notifications, messages, and events. All API endpoints are protected with authentication, rate limiting, and comprehensive security measures.

## Base URL

```
http://localhost:8000/api
```

## Authentication

### Register

Create a new user account.

**Endpoint:** `POST /register`

**Rate Limit:** 5 requests/minute

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "password_confirmation": "SecurePassword123!",
  "phone": "+234-XXX-XXX-XXXX"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role": "user"
  },
  "token": "1|xxxxxxxxxxxxxxxxxxxxx"
}
```

### Login

Authenticate and receive an access token.

**Endpoint:** `POST /login`

**Rate Limit:** 5 requests/minute

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "role": "user"
  },
  "token": "1|xxxxxxxxxxxxxxxxxxxxx"
}
```

### Get Current User

Get authenticated user details.

**Endpoint:** `GET /me`

**Rate Limit:** 60 requests/minute

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "role": "user",
  "created_at": "2024-01-20T10:00:00.000000Z"
}
```

### Logout

Invalidate the current access token.

**Endpoint:** `POST /logout`

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

## Missions

### List Missions

Get a paginated list of missions.

**Endpoint:** `GET /missions`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 15, max: 100)
- `status` (optional): Filter by status (pending, active, completed, cancelled)
- `search` (optional): Search by name or code

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": 1,
      "name": "Mission Alpha",
      "code": "MSN-001",
      "description": "Mission description",
      "status": "active",
      "start_date": "2024-01-20",
      "end_date": "2024-02-20",
      "location": "Abuja",
      "creator": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      },
      "staff_count": 5,
      "created_at": "2024-01-20T10:00:00.000000Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 50,
    "last_page": 4
  }
}
```

### Get Mission Details

Get detailed information about a specific mission.

**Endpoint:** `GET /missions/{id}`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Mission Alpha",
  "code": "MSN-001",
  "description": "Detailed mission description",
  "status": "active",
  "start_date": "2024-01-20",
  "end_date": "2024-02-20",
  "location": "Abuja",
  "objectives": ["Objective 1", "Objective 2"],
  "creator": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com"
  },
  "staff": [
    {
      "id": 2,
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "supervisor"
    }
  ],
  "created_at": "2024-01-20T10:00:00.000000Z",
  "updated_at": "2024-01-20T10:00:00.000000Z"
}
```

### Create Mission

Create a new mission (Admin/Super Admin only).

**Endpoint:** `POST /missions`

**Rate Limit:** 30 requests/minute

**Request Body:**
```json
{
  "name": "Mission Beta",
  "code": "MSN-002",
  "description": "Mission description",
  "start_date": "2024-02-01",
  "end_date": "2024-03-01",
  "location": "Lagos",
  "objectives": ["Objective 1", "Objective 2"]
}
```

**Response:** `201 Created`

### Update Mission

Update an existing mission.

**Endpoint:** `PUT /missions/{id}`

**Rate Limit:** 30 requests/minute

**Request Body:** Same as Create Mission

**Response:** `200 OK`

### Delete Mission

Delete a mission.

**Endpoint:** `DELETE /missions/{id}`

**Rate Limit:** 30 requests/minute

**Response:** `204 No Content`

## Users

### List Users

Get a paginated list of users (Admin/Super Admin only).

**Endpoint:** `GET /users`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Query Parameters:**
- `page`, `per_page`, `search`, `role`

**Response:** `200 OK`

### Update User Role

Update a user's role (Super Admin only).

**Endpoint:** `PUT /users/{id}/role`

**Rate Limit:** 30 requests/minute

**Request Body:**
```json
{
  "role": "admin"
}
```

**Response:** `200 OK`

## Documents

### List Documents

Get a paginated list of documents.

**Endpoint:** `GET /documents`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`

### Upload Document

Upload a new document.

**Endpoint:** `POST /documents`

**Rate Limit:** 10 requests/minute (heavy operation)

**Request Body:** `multipart/form-data`
- `file`: Document file
- `title`: Document title
- `type`: Document type
- `description`: Document description (optional)

**Response:** `201 Created`

### Download Document

Download a document file.

**Endpoint:** `GET /documents/{id}/download`

**Rate Limit:** 10 requests/minute (heavy operation)

**Response:** File download

## Reports

### List Reports

Get a paginated list of reports.

**Endpoint:** `GET /reports`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`

### Create Report

Create a new report.

**Endpoint:** `POST /reports`

**Rate Limit:** 10 requests/minute (heavy operation)

**Request Body:**
```json
{
  "mission_id": 1,
  "title": "Weekly Report",
  "content": "Report content",
  "type": "weekly"
}
```

**Response:** `201 Created`

### Get Report Statistics

Get report statistics.

**Endpoint:** `GET /reports/statistics`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`
```json
{
  "total": 100,
  "pending": 20,
  "approved": 70,
  "rejected": 10,
  "by_type": {
    "weekly": 50,
    "monthly": 30,
    "final": 20
  }
}
```

## Notifications

### List Notifications

Get user's notifications.

**Endpoint:** `GET /notifications`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`

### Get Unread Count

Get count of unread notifications.

**Endpoint:** `GET /notifications/unread-count`

**Rate Limit:** 60 requests/minute (cached for 30 seconds)

**Response:** `200 OK`
```json
{
  "count": 5
}
```

### Mark as Read

Mark a notification as read.

**Endpoint:** `POST /notifications/{id}/mark-read`

**Rate Limit:** 30 requests/minute

**Response:** `200 OK`

### Mark All as Read

Mark all notifications as read.

**Endpoint:** `POST /notifications/mark-all-read`

**Rate Limit:** 30 requests/minute

**Response:** `200 OK`

## Messages

### Get Conversations

Get user's message conversations.

**Endpoint:** `GET /conversations`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`

### Get Messages

Get messages in a conversation.

**Endpoint:** `GET /conversations/{conversationId}/messages`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`

### Send Message

Send a message in a conversation.

**Endpoint:** `POST /conversations/{conversationId}/messages`

**Rate Limit:** 30 requests/minute

**Request Body:**
```json
{
  "content": "Message content"
}
```

**Response:** `201 Created`

## Events

### List Events

Get a paginated list of events.

**Endpoint:** `GET /events`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`

### Get Upcoming Events

Get upcoming events.

**Endpoint:** `GET /events/upcoming`

**Rate Limit:** 60 requests/minute (cached for 5 minutes)

**Response:** `200 OK`

### Create Event

Create a new event.

**Endpoint:** `POST /events`

**Rate Limit:** 30 requests/minute

**Request Body:**
```json
{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "start_date": "2024-01-25T10:00:00Z",
  "end_date": "2024-01-25T11:00:00Z",
  "location": "Conference Room A"
}
```

**Response:** `201 Created`

## Rate Limiting

All endpoints are protected with rate limiting. Rate limit information is included in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `Retry-After`: Seconds to wait before retrying (when rate limited)

### Rate Limit Tiers

- **Authentication:** 5 requests/minute
- **Read Operations:** 60 requests/minute
- **Write Operations:** 30 requests/minute
- **Heavy Operations:** 10 requests/minute

### Role-Based Multipliers

- **User:** 1x (base rate)
- **Supervisor:** 1.5x
- **Admin:** 2x
- **Super Admin:** 3x

## Error Responses

### 400 Bad Request
```json
{
  "message": "Validation error",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthenticated"
}
```

### 403 Forbidden
```json
{
  "message": "This action is unauthorized"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "message": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error. Please try again later."
}
```

## Security Features

### Request Validation
- All requests are validated for proper content type
- Suspicious user agents are blocked
- Request size limits enforced
- Input sanitization applied

### Audit Logging
- All write operations are logged
- Failed authentication attempts are logged
- Sensitive data is redacted in logs

### CORS
- Configured for allowed origins
- Credentials support enabled
- Rate limit headers exposed

## Best Practices

1. **Always include the Authorization header** for protected endpoints
2. **Handle rate limiting gracefully** by checking response headers
3. **Cache responses** when appropriate to reduce API calls
4. **Use pagination** for list endpoints
5. **Implement retry logic** with exponential backoff
6. **Validate data** on the client side before sending requests
7. **Handle errors** appropriately and show user-friendly messages

## Support

For API issues or questions, contact the development team or refer to the troubleshooting guide.
