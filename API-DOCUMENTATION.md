# AV-RENTALS API Documentation

<div align="center">
  <img src="https://img.shields.io/badge/API-RESTful-blue?style=for-the-badge" alt="API">
  <img src="https://img.shields.io/badge/Auth-JWT-green?style=for-the-badge" alt="JWT">
  <img src="https://img.shields.io/badge/Validation-Zod-purple?style=for-the-badge" alt="Zod">
  <img src="https://img.shields.io/badge/Real%20Time-Socket.IO-orange?style=for-the-badge" alt="Socket.IO">
</div>

<br />

Comprehensive API documentation for the AV-RENTALS equipment rental management system. This RESTful API provides complete access to all system functionality including equipment management, rental scheduling, client management, and real-time collaboration features.

## 📋 Table of Contents

- [Authentication](#-authentication)
- [Equipment Management](#-equipment-management)
- [Rental Operations](#-rental-operations)
- [Event Management](#-event-management)
- [Client Management](#-client-management)
- [Category Management](#-category-management)
- [User Management](#-user-management)
- [Real-time Events](#-real-time-events)
- [Error Handling](#-error-handling)
- [Rate Limiting](#-rate-limiting)

## 🔐 Authentication

All API endpoints require authentication via JWT tokens. The API uses Bearer token authentication.

### Authentication Flow

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_123",
    "username": "admin",
    "email": "admin@company.com",
    "role": "Admin",
    "profile": {
      "firstName": "System",
      "lastName": "Administrator"
    }
  },
  "expiresIn": "24h"
}
```

#### Token Usage
Include the token in the Authorization header for all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Refresh
```http
POST /api/auth/refresh
Authorization: Bearer [current-token]
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer [token]
```

## 🛠️ Equipment Management

### Get Equipment List

```http
GET /api/equipment
Authorization: Bearer [token]
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number for pagination | 1 |
| `pageSize` | number | Items per page | 20 |
| `status` | string | Filter by status: `good`, `damaged`, `maintenance` | all |
| `categoryId` | string | Filter by category ID | all |
| `search` | string | Search by name or description | - |

**Response:**
```json
{
  "data": [
    {
      "id": "eq_123",
      "name": "Professional Camera 4K",
      "description": "High-end 4K professional video camera",
      "quantity": 5,
      "status": "good",
      "location": "Warehouse A",
      "dailyRate": 150.00,
      "type": "equipment",
      "imageUrl": "/images/equipment/camera-123.jpg",
      "category": {
        "id": "cat_video",
        "name": "Video Equipment",
        "icon": "video"
      },
      "subcategory": {
        "id": "subcat_cameras",
        "name": "Cameras"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "version": 1
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20,
  "totalPages": 3
}
```

### Create Equipment

```http
POST /api/equipment
Authorization: Bearer [token]
Content-Type: application/json

{
  "name": "Professional Microphone",
  "description": "High-quality condenser microphone",
  "categoryId": "cat_audio",
  "subcategoryId": "subcat_microphones",
  "quantity": 10,
  "status": "good",
  "location": "Storage Room B",
  "dailyRate": 25.00,
  "type": "equipment",
  "imageUrl": "https://example.com/mic.jpg"
}
```

**Response:**
```json
{
  "id": "eq_456",
  "name": "Professional Microphone",
  "description": "High-quality condenser microphone",
  "quantity": 10,
  "status": "good",
  "location": "Storage Room B",
  "dailyRate": 25.00,
  "type": "equipment",
  "imageUrl": "/images/equipment/equipment-456.jpg",
  "categoryId": "cat_audio",
  "subcategoryId": "subcat_microphones",
  "createdAt": "2024-01-15T11:00:00Z",
  "updatedAt": "2024-01-15T11:00:00Z",
  "version": 1
}
```

### Update Equipment

```http
PUT /api/equipment
Authorization: Bearer [token]
Content-Type: application/json

{
  "id": "eq_456",
  "name": "Professional Microphone XLR",
  "description": "High-quality XLR condenser microphone",
  "quantity": 12,
  "status": "good",
  "location": "Storage Room B",
  "dailyRate": 30.00,
  "version": 1
}
```

### Delete Equipment

```http
DELETE /api/equipment?id=eq_456
Authorization: Bearer [token]
```

**Response:**
```json
{
  "success": true,
  "message": "Equipment deleted successfully"
}
```

## 📅 Rental Operations

### Get Rentals

```http
GET /api/rentals
Authorization: Bearer [token]
```

**Response:**
```json
{
  "data": [
    {
      "id": "rental_123",
      "eventId": "event_456",
      "equipmentId": "eq_123",
      "quantityRented": 2,
      "prepStatus": "pending",
      "notes": "Handle with care",
      "createdAt": "2024-01-15T09:00:00Z",
      "event": {
        "id": "event_456",
        "name": "Corporate Event 2024",
        "location": "Convention Center",
        "startDate": "2024-01-20T08:00:00Z",
        "endDate": "2024-01-22T18:00:00Z",
        "client": {
          "id": "client_789",
          "name": "ABC Corporation",
          "email": "events@abc.com"
        }
      },
      "equipment": {
        "id": "eq_123",
        "name": "Professional Camera 4K",
        "dailyRate": 150.00,
        "category": {
          "name": "Video Equipment"
        }
      }
    }
  ]
}
```

### Create Rental

```http
POST /api/rentals
Authorization: Bearer [token]
Content-Type: application/json

{
  "eventId": "event_456",
  "equipment": [
    {
      "equipmentId": "eq_123",
      "quantity": 2
    },
    {
      "equipmentId": "eq_789",
      "quantity": 1
    }
  ],
  "notes": "Equipment needed for main stage"
}
```

**Response:**
```json
{
  "success": true,
  "rentals": [
    {
      "id": "rental_124",
      "eventId": "event_456",
      "equipmentId": "eq_123",
      "quantityRented": 2,
      "prepStatus": "pending",
      "notes": "Equipment needed for main stage",
      "createdAt": "2024-01-15T12:00:00Z"
    },
    {
      "id": "rental_125",
      "eventId": "event_456",
      "equipmentId": "eq_789",
      "quantityRented": 1,
      "prepStatus": "pending",
      "notes": "Equipment needed for main stage",
      "createdAt": "2024-01-15T12:00:00Z"
    }
  ]
}
```

### Update Rental Status

```http
PUT /api/rentals
Authorization: Bearer [token]
Content-Type: application/json

{
  "id": "rental_124",
  "prepStatus": "checked-out",
  "notes": "Equipment checked out at 14:30"
}
```

### Delete Rental

```http
DELETE /api/rentals?id=rental_124
Authorization: Bearer [token]
```

## 🎯 Event Management

### Get Events

```http
GET /api/events
Authorization: Bearer [token]
```

**Response:**
```json
{
  "data": [
    {
      "id": "event_456",
      "name": "Corporate Event 2024",
      "clientId": "client_789",
      "location": "Convention Center",
      "startDate": "2024-01-20T08:00:00Z",
      "endDate": "2024-01-22T18:00:00Z",
      "notes": "Large corporate event with multiple stages",
      "createdAt": "2024-01-10T10:00:00Z",
      "client": {
        "id": "client_789",
        "name": "ABC Corporation",
        "email": "events@abc.com",
        "phone": "+1-555-0123"
      },
      "rentals": [
        {
          "id": "rental_123",
          "equipmentId": "eq_123",
          "quantityRented": 2,
          "equipment": {
            "name": "Professional Camera 4K"
          }
        }
      ],
      "_count": {
        "rentals": 5
      }
    }
  ]
}
```

### Create Event

```http
POST /api/events
Authorization: Bearer [token]
Content-Type: application/json

{
  "name": "Wedding Celebration",
  "clientId": "client_456",
  "location": "Garden Venue",
  "startDate": "2024-02-14T15:00:00Z",
  "endDate": "2024-02-14T23:00:00Z",
  "notes": "Outdoor wedding ceremony and reception"
}
```

**Response:**
```json
{
  "id": "event_789",
  "name": "Wedding Celebration",
  "clientId": "client_456",
  "location": "Garden Venue",
  "startDate": "2024-02-14T15:00:00Z",
  "endDate": "2024-02-14T23:00:00Z",
  "notes": "Outdoor wedding ceremony and reception",
  "createdAt": "2024-01-15T13:00:00Z",
  "updatedAt": "2024-01-15T13:00:00Z"
}
```

### Update Event

```http
PUT /api/events
Authorization: Bearer [token]
Content-Type: application/json

{
  "id": "event_789",
  "name": "Wedding Celebration - Smith & Johnson",
  "location": "Sunset Garden Venue",
  "notes": "Outdoor wedding ceremony and reception - Weather backup plan ready"
}
```

### Delete Event

```http
DELETE /api/events?id=event_789
Authorization: Bearer [token]
```

## 👥 Client Management

### Get Clients

```http
GET /api/clients
Authorization: Bearer [token]
```

**Response:**
```json
{
  "data": [
    {
      "id": "client_789",
      "name": "ABC Corporation",
      "email": "events@abc.com",
      "phone": "+1-555-0123",
      "address": "123 Business St, City, State 12345",
      "contactPerson": "John Smith",
      "notes": "Preferred client - corporate events",
      "createdAt": "2024-01-01T10:00:00Z",
      "updatedAt": "2024-01-01T10:00:00Z",
      "_count": {
        "events": 12
      }
    }
  ]
}
```

### Create Client

```http
POST /api/clients
Authorization: Bearer [token]
Content-Type: application/json

{
  "name": "XYZ Events Co.",
  "email": "contact@xyzevents.com",
  "phone": "+1-555-0456",
  "address": "456 Event Ave, City, State 67890",
  "contactPerson": "Jane Doe",
  "notes": "Event planning company - regular bookings"
}
```

### Update Client

```http
PUT /api/clients
Authorization: Bearer [token]
Content-Type: application/json

{
  "id": "client_123",
  "name": "XYZ Events Co.",
  "email": "info@xyzevents.com",
  "phone": "+1-555-0456",
  "address": "456 Event Ave, Suite 200, City, State 67890",
  "contactPerson": "Jane Doe",
  "notes": "Event planning company - VIP client with priority booking"
}
```

### Delete Client

```http
DELETE /api/clients?id=client_123
Authorization: Bearer [token]
```

## 📂 Category Management

### Get Categories

```http
GET /api/categories
Authorization: Bearer [token]
```

**Response:**
```json
{
  "data": [
    {
      "id": "cat_audio",
      "name": "Audio Equipment",
      "icon": "volume-2",
      "description": "Microphones, speakers, and audio equipment",
      "subcategories": [
        {
          "id": "subcat_microphones",
          "name": "Microphones",
          "categoryId": "cat_audio"
        },
        {
          "id": "subcat_speakers",
          "name": "Speakers",
          "categoryId": "cat_audio"
        }
      ],
      "_count": {
        "equipment": 25,
        "subcategories": 2
      }
    }
  ]
}
```

### Create Category

```http
POST /api/categories
Authorization: Bearer [token]
Content-Type: application/json

{
  "name": "Lighting Equipment",
  "icon": "lightbulb",
  "description": "LED lights, stage lighting, and accessories"
}
```

### Create Subcategory

```http
POST /api/categories/subcategories
Authorization: Bearer [token]
Content-Type: application/json

{
  "name": "LED Panels",
  "categoryId": "cat_lighting"
}
```

## 👤 User Management

### Get Users (Admin Only)

```http
GET /api/admin/users
Authorization: Bearer [token]
```

**Response:**
```json
{
  "data": [
    {
      "id": "user_123",
      "username": "admin",
      "email": "admin@company.com",
      "role": "Admin",
      "isActive": true,
      "profile": {
        "firstName": "System",
        "lastName": "Administrator",
        "phone": "+1-555-0100"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "lastLogin": "2024-01-15T08:30:00Z"
    }
  ]
}
```

### Create User (Admin Only)

```http
POST /api/admin/users
Authorization: Bearer [token]
Content-Type: application/json

{
  "username": "manager01",
  "email": "manager@company.com",
  "password": "SecurePassword123!",
  "role": "Manager",
  "profile": {
    "firstName": "Jane",
    "lastName": "Manager",
    "phone": "+1-555-0200"
  }
}
```

### Update User Role (Admin Only)

```http
PUT /api/admin/users
Authorization: Bearer [token]
Content-Type: application/json

{
  "id": "user_456",
  "role": "Employee",
  "isActive": true
}
```

## 🔄 Real-time Events

The application uses Socket.IO for real-time updates. Connect to the WebSocket endpoint and listen for these events:

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('wss://your-domain.com', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Event Types

#### Equipment Updates
```javascript
// Listen for equipment changes
socket.on('equipment:updated', (data) => {
  console.log('Equipment updated:', data);
  // Update UI with new equipment data
});

// Listen for equipment creation
socket.on('equipment:created', (data) => {
  console.log('New equipment added:', data);
});

// Listen for equipment deletion
socket.on('equipment:deleted', (data) => {
  console.log('Equipment deleted:', data.id);
});
```

#### Rental Updates
```javascript
// Listen for rental changes
socket.on('rental:updated', (data) => {
  console.log('Rental updated:', data);
});

socket.on('rental:created', (data) => {
  console.log('New rental created:', data);
});

socket.on('rental:deleted', (data) => {
  console.log('Rental deleted:', data.id);
});
```

#### User Activity
```javascript
// Listen for user activity
socket.on('user:activity', (data) => {
  console.log('User activity:', data);
  // Show user activity indicators
});
```

## ❌ Error Handling

All API endpoints return consistent error responses with appropriate HTTP status codes.

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `VALIDATION_ERROR` | Request validation failed |
| 401 | `UNAUTHORIZED` | Invalid or missing authentication token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., rental scheduling conflict) |
| 422 | `UNPROCESSABLE_ENTITY` | Business logic validation failed |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |

### Error Examples

#### Validation Error
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "name": "Name is required",
    "quantity": "Quantity must be greater than 0"
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

#### Rental Conflict
```json
{
  "error": "Equipment not available for the selected dates",
  "code": "RENTAL_CONFLICT",
  "details": {
    "equipmentId": "eq_123",
    "conflictingRentals": [
      {
        "id": "rental_456",
        "eventName": "Corporate Event",
        "startDate": "2024-01-20T08:00:00Z",
        "endDate": "2024-01-22T18:00:00Z"
      }
    ]
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## 🚦 Rate Limiting

API endpoints are protected by rate limiting to ensure fair usage and system stability.

### Rate Limits

| Endpoint Category | Requests per Minute | Burst Limit |
|------------------|---------------------|-------------|
| Authentication | 10 | 20 |
| Equipment Operations | 60 | 100 |
| Rental Operations | 30 | 50 |
| File Uploads | 5 | 10 |
| Admin Operations | 30 | 60 |

### Rate Limit Headers

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248000
```

### Rate Limit Error

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMITED",
  "details": {
    "limit": 60,
    "remaining": 0,
    "resetTime": "2024-01-15T12:01:00Z"
  }
}
```

---

<div align="center">

### 🔗 Related Documentation

[📖 Main README](README.md) | [🚀 Deployment Guide](DEPLOYMENT.md) | [🏗️ Architecture Guide](ARCHITECTURE.md) | [🤝 Contributing](CONTRIBUTING.md)

**Complete API Reference for AV-RENTALS** • **RESTful Design** • **Real-time Ready**

</div>