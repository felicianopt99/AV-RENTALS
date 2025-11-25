# Socket.IO Server Implementation

This document describes the Socket.IO server implementation for real-time features in the AV-RENTALS application.

## Overview

The Socket.IO server has been fully implemented to enable real-time collaboration features. The server handles:
- Real-time data synchronization
- User notifications
- System-wide notifications
- User activity tracking
- Optimistic locking support

## Architecture

### Server Setup

The Socket.IO server is initialized in `server.js`, which wraps the Next.js application:

```javascript
// server.js creates an HTTP server and attaches Socket.IO
const httpServer = createServer(...)
const io = new SocketIOServer(httpServer, {
  path: '/api/socket',
  cors: { ... }
})
```

### Authentication

Socket.IO connections are authenticated using JWT tokens. The authentication middleware:
1. Extracts the token from handshake auth, headers, or query parameters
2. Verifies the JWT token
3. Fetches user data from the database
4. Attaches user information to the socket

**Note**: Connections without authentication are allowed but marked as unauthenticated.

### Room Management

The server uses Socket.IO rooms for targeted message delivery:

- **User Rooms**: `user-{userId}` - For user-specific notifications
- **Sync Rooms**: `sync-{entityType}` - For entity-specific data changes (e.g., `sync-EquipmentItem`)

### Events

#### Client → Server Events

- `join-data-sync` - Join rooms for specific entity types
- `join-user-room` - Join user-specific room for notifications
- `user:activity` - Broadcast user activity to other users
- `ping` - Health check (responds with `pong`)

#### Server → Client Events

- `data-change` - Broadcast when data changes (CREATE, UPDATE, DELETE)
- `notification` - User-specific notifications
- `system-notification` - System-wide notifications
- `pong` - Response to ping

## Usage in API Routes

To broadcast data changes from API routes, use the `broadcastDataChange` function:

```typescript
import { broadcastDataChange } from '@/lib/realtime-broadcast'

// After creating/updating/deleting data
broadcastDataChange('EquipmentItem', 'CREATE', equipment, userId)
broadcastDataChange('EquipmentItem', 'UPDATE', equipment, userId)
broadcastDataChange('EquipmentItem', 'DELETE', { id }, userId)
```

## Client-Side Usage

The client-side hooks are already implemented in `src/hooks/useRealTimeSync.ts`:

```typescript
import { useRealTimeSync } from '@/hooks/useRealTimeSync'

function MyComponent() {
  const { isConnected, socket } = useRealTimeSync({
    entityTypes: ['EquipmentItem', 'Rental'],
    onDataChange: (event) => {
      // Handle data change
      console.log('Data changed:', event)
    },
    onNotification: (notification) => {
      // Handle notification
      console.log('Notification:', notification)
    }
  })
  
  return <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
}
```

## Development

### Running with Socket.IO

For development, use the custom server:

```bash
npm run dev
```

This uses `server.js` which includes Socket.IO support.

### Running without Socket.IO (Next.js default)

If you need to use Next.js default dev server:

```bash
npm run dev:next
```

**Note**: Socket.IO will not work with `dev:next` - use `npm run dev` instead.

## Production

In production, the `server.js` file is used automatically when running:

```bash
npm run build
npm start
```

The Dockerfile is configured to use `server.js` as the entry point.

## Testing

### Check Socket.IO Status

Visit `/api/socket` to check if the Socket.IO server is running:

```bash
curl http://localhost:3000/api/socket
```

Response:
```json
{
  "success": true,
  "message": "Socket.IO server status",
  "available": true,
  "connectedClients": 2,
  "path": "/api/socket"
}
```

### Test Connection

1. Open the application in multiple browser tabs
2. Make a change to equipment in one tab
3. The change should appear in other tabs automatically

## Troubleshooting

### Socket.IO Not Connecting

1. **Check server is running**: Ensure you're using `npm run dev` (not `dev:next`)
2. **Check CORS**: Verify `NEXT_PUBLIC_APP_URL` is set correctly
3. **Check authentication**: Ensure JWT token is valid
4. **Check browser console**: Look for connection errors

### Events Not Broadcasting

1. **Check Socket.IO is initialized**: Verify `global.io` exists
2. **Check room membership**: Ensure clients have joined the correct rooms
3. **Check entity type**: Ensure entity type matches (case-sensitive)
4. **Check server logs**: Look for broadcast errors

### Authentication Issues

1. **Token not found**: Check if token is being sent in handshake
2. **Invalid token**: Verify JWT_SECRET matches
3. **User not found**: Check database connection and user exists

## Configuration

### Environment Variables

- `JWT_SECRET` - Required for token verification
- `NEXT_PUBLIC_APP_URL` - Used for CORS configuration
- `NODE_ENV` - Determines development vs production mode

### CORS Configuration

Socket.IO CORS is configured in `server.js`:

```javascript
cors: {
  origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true,
}
```

## Integration with API Routes

The following API routes have been updated to broadcast changes:

- ✅ `/api/equipment` - Equipment CRUD operations

**To add broadcasting to other routes:**

1. Import the broadcast function:
```typescript
import { broadcastDataChange } from '@/lib/realtime-broadcast'
```

2. Call after data changes:
```typescript
broadcastDataChange('EntityType', 'CREATE', data, userId)
```

## Next Steps

Consider adding broadcasting to:
- `/api/rentals` - Rental operations
- `/api/events` - Event management
- `/api/clients` - Client management
- `/api/quotes` - Quote generation

## Performance Considerations

- Broadcasts are non-blocking (async)
- Database logging happens asynchronously
- Room-based targeting reduces unnecessary broadcasts
- Connection pooling handles multiple clients efficiently

## Security

- JWT authentication required for authenticated features
- Unauthenticated connections are limited
- User-specific rooms prevent unauthorized access
- CORS configured to prevent unauthorized origins

