# WebSocket Connection Error - Troubleshooting Guide

## Problem Summary
The frontend is failing to connect to the backend WebSocket server with the error:
```
WebSocket connection to 'wss://service-booking-1-g46o.onrender.com/socket.io/?EIO=4&transport=websocket' failed
POST https://service-booking-1-g46o.onrender.com/api/api/auth/register net::ERR_INTERNET_DISCONNECTED
```

## Root Causes

1. **Backend server is down or unreachable** - The most likely cause
2. **Incorrect API URL configuration** - Frontend pointing to wrong backend
3. **CORS policy not configured correctly** - WebSocket connections blocked
4. **Double `/api` path in some requests** - Misconfiguration in API calls
5. **Network/Internet connectivity issues** - Temporary network problems

## Solutions

### Step 1: Verify Backend Server is Running

#### For Local Development:
```bash
# Navigate to backend directory
cd Backend

# Install dependencies
npm install

# Start the server
npm start
# or
node server.js
```

The server should log:
```
✅ Server running on http://localhost:5000
✅ Socket.IO initialized
```

#### For Production (Render):
1. Go to your Render dashboard
2. Check if the service is running (should show "Live")
3. Check recent logs for errors
4. If down, manually trigger a re-deployment

### Step 2: Configure Environment Variables

#### Frontend (.env file in Frontend directory):
```env
VITE_API_URL=http://localhost:5000
```

For production, set it to your backend URL:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

#### Backend (.env file in Backend directory):
```env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-secret-key
```

For production on Render:
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key-change-this
```

### Step 3: Verify CORS Configuration

The backend now has CORS configured to allow:
- ✅ Any `vercel.app` subdomain
- ✅ Any `render.com` subdomain  
- ✅ Localhost origins (development)
- ✅ No-origin requests (mobile apps)

If you're using a different URL, add it to the `allowedOrigins` array in:
- `Backend/server.js` (line 77-82)
- `Backend/socket/index.js` (line 9-15)

### Step 4: Check Browser Console for Detailed Errors

The improved error logging now shows:

```javascript
// Socket connection details
🔌 Socket URL: http://localhost:5000
🔌 Using localhost:5000
✅ Socket.IO connected successfully {
  socketId: "...",
  url: "http://localhost:5000",
  transport: "websocket"
}

// API request logs
🌐 API Request: POST http://localhost:5000/api/auth/register
```

### Step 5: Test Basic Connectivity

#### Test with curl:
```bash
# Test API endpoint
curl -X GET http://localhost:5000/api/health

# Should respond with something like:
# {"status":"ok","message":"Health check passed"}
```

#### Test from browser console:
```javascript
// Check API URL
console.log('API URL:', import.meta.env.VITE_API_URL);

// Test a simple API call
fetch('http://localhost:5000/api/auth/test')
  .then(r => r.json())
  .then(console.log)
  .catch(err => console.error('Connection error:', err));
```

### Step 6: Check for Network Issues

1. **Test Internet Connection**: Can you reach other websites?
2. **Check Firewall**: Ensure port 5000 is not blocked
3. **VPN Issues**: Try disabling VPN if one is active
4. **Browser Cache**: Clear browser cache and cookies
5. **Check DNS**: Try using a different DNS (8.8.8.8)

### Step 7: Database Connection

The API also depends on the database being available. Check:

```bash
# For PostgreSQL (if using)
psql -h localhost -U postgres -d service_booking
```

If database connection fails, you'll see errors like:
```
❌ Database connection error: connect ECONNREFUSED 127.0.0.1:5432
```

## Common Error Messages and Solutions

### "WebSocket connection failed"
- **Cause**: Backend server not running
- **Solution**: Start the backend with `npm start`

### "net::ERR_INTERNET_DISCONNECTED"
- **Cause**: Cannot reach the backend server
- **Solution**: 
  1. Verify backend is running
  2. Check firewall settings
  3. Verify API URL in .env file

### "Authentication required" (Socket)
- **Cause**: No token in localStorage
- **Solution**: Log in first, token should be stored automatically

### "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Cause**: Backend CORS not allowing request origin
- **Solution**: Backend now allows all domains, but verify in logs

### "Invalid or expired token"
- **Cause**: JWT token is invalid or expired
- **Solution**: Log in again to get a fresh token

## Deployment Checklist

When deploying to production:

- [ ] Set `NODE_ENV=production` in backend .env
- [ ] Update `VITE_API_URL` to production backend URL in frontend
- [ ] Change `JWT_SECRET` and `SESSION_SECRET` to secure random strings
- [ ] Update database credentials
- [ ] Enable HTTPS (should be automatic on Render)
- [ ] Test WebSocket connection with real production URLs
- [ ] Monitor logs on deployment platform
- [ ] Test all auth flows (login, register, socket connection)

## Debug Mode

The improved code now logs detailed information:

**Frontend**: Check browser DevTools Console for:
- Socket connection attempts and failures
- API request details
- Reconnection attempts
- CORS issues

**Backend**: Check server logs for:
- CORS origin verification
- Socket authentication details
- Connection/disconnection events
- API request handling

## Testing WebSocket Connection

You can test Socket.IO connection directly in browser console:

```javascript
// Test Socket.IO connection
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

socket.on('connect', () => {
  console.log('✅ Connected!', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Need More Help?

If issues persist:

1. **Check backend logs** for error messages
2. **Verify network connectivity** with ping tests
3. **Check browser DevTools** Network tab for request details
4. **Look for firewall/security software** blocking connections
5. **Try from a different device/network** to isolate issues
6. **Check if database is accessible** to the backend
7. **Verify environment variables** are correctly set

## Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Express CORS Documentation](https://expressjs.com/en/resources/middleware/cors.html)
- [HTTP Status Codes](https://httpwg.org/specs/rfc9110.html#overview.of.status.codes)
