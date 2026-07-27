# SpaceSync Backend API & Endpoints Documentation

> **Base URL**: `http://localhost:5000` (or deployed server URL)  
> **Target Frontend Stack**: Next.js (App Router), React 19, Supabase JS Client  
> **Status**: Ready for Frontend Integration

---

## 🚀 Overview of Assigned Features

This backend service implements three core PRD requirements for SpaceSync:
1. **Realtime Calendar Updates**: Live availability querying + Supabase Realtime slot broadcast integration (~1s UI sync across all concurrent users).
2. **Check-In Feature & Auto-Release**: Grace window validation (10 mins before start to 10 mins after start), manual "I'm Here" confirmation, and automated background releasing of no-show bookings.
3. **Resend Transactional Email Reminders**: Automated 24-hour prior reminder, 10-minute prior check-in prompt email, auto-release notification, and weekly no-show admin digests.

---

## 1. 📍 Check-In Feature Endpoints

### 1.1 Perform Check-In ("I'm Here")
* **Endpoint**: `POST /api/check-in/:bookingId`
* **Description**: User claims their room/resource within the 10-minute grace window.
* **Request Body**:
  ```json
  {
    "userId": "usr_12345" // optional, extracted from auth token if available
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Check-in successful! Enjoy your space.",
    "data": {
      "id": "bkg_7890",
      "checked_in": true,
      "checked_in_at": "2026-07-27T11:45:00.000Z",
      "status": "confirmed"
    }
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "message": "Too early to check in. Check-in opens 10 minutes before start time (10:50:00 AM)."
  }
  ```

---

### 1.2 Get Check-In Status & Countdown
* **Endpoint**: `GET /api/check-in/status/:bookingId`
* **Description**: Retrieves check-in status, grace period expiration, and eligibility for the frontend UI.
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "bookingId": "bkg_7890",
      "checkedIn": false,
      "status": "approved",
      "isEligibleForCheckIn": true,
      "gracePeriodExpiresAt": "2026-07-27T11:50:00.000Z",
      "reason": null
    }
  }
  ```

---

### 1.3 Trigger Auto-Release for No-Shows (Server/Admin Trigger)
* **Endpoint**: `POST /api/check-in/trigger/auto-release`
* **Description**: Manually triggers a scan for expired bookings without check-in. Releases slots and sends email alerts. (Note: Automated cron runs this every minute).
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "releasedCount": 2,
      "releasedIds": ["bkg_101", "bkg_102"]
    }
  }
  ```

---

## 2. ⚡ Realtime & Live Calendar Endpoints

### 2.1 Get Live Availability Snapshot
* **Endpoint**: `GET /api/realtime/live-availability`
* **Query Parameters**:
  - `resourceId` *(optional)*: e.g. `res_room_1`
  - `date` *(optional)*: YYYY-MM-DD (e.g. `2026-07-27`)
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "isRealtimeActive": true,
      "resourceId": "res_room_1",
      "date": "2026-07-27",
      "activeBookings": [
        {
          "id": "bkg_7890",
          "resourceId": "res_room_1",
          "title": "Strategy Workshop",
          "startTime": "2026-07-27T12:00:00.000Z",
          "endTime": "2026-07-27T13:00:00.000Z",
          "status": "confirmed",
          "checkedIn": true
        }
      ]
    }
  }
  ```

---

### 2.2 Supabase Realtime Subscription Setup (Frontend Guide)
To listen for instant calendar slot updates in React / Next.js without polling:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Subscribe to calendar changes
const channel = supabase
  .channel('calendar-updates')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'bookings' },
    (payload) => {
      console.log('Realtime Slot Event:', payload.eventType, payload.new || payload.old);
      // Re-fetch or update calendar grid state instantly!
    }
  )
  .subscribe();
```

---

## 3. ✉️ Email Notifications Endpoints (Resend Integration)

### 3.1 Send Booking Confirmation Email
* **Endpoint**: `POST /api/notifications/send-confirmation`
* **Request Body**:
  ```json
  {
    "bookingId": "bkg_7890",
    "title": "Design Review",
    "userName": "Alex Rivera",
    "userEmail": "alex@company.com",
    "resourceName": "Conference Room A",
    "location": "Building 2, Floor 3",
    "startTime": "2026-07-27T14:00:00.000Z",
    "endTime": "2026-07-27T15:00:00.000Z"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": { "success": true, "messageId": "msg_12345" }
  }
  ```

---

### 3.2 Send Booking Reminder Email (24h or 10m Check-In Nudge)
* **Endpoint**: `POST /api/notifications/send-reminder`
* **Request Body**:
  ```json
  {
    "type": "10m", // "24h" or "10m"
    "bookingId": "bkg_7890",
    "title": "Design Review",
    "userName": "Alex Rivera",
    "userEmail": "alex@company.com",
    "resourceName": "Conference Room A",
    "startTime": "2026-07-27T14:00:00.000Z",
    "endTime": "2026-07-27T15:00:00.000Z"
  }
  ```

---

### 3.3 Send Weekly No-Show Admin Digest
* **Endpoint**: `POST /api/notifications/send-weekly-digest`
* **Request Body**:
  ```json
  {
    "adminName": "Ops Manager",
    "adminEmail": "admin@company.com",
    "totalBookings": 142,
    "totalNoShows": 8,
    "noShowRate": "5.6%",
    "mostUnusedResource": "Studio B"
  }
  ```

---

## 4. 🏥 Health Check Endpoint
* **Endpoint**: `GET /health`
* **Success Response (200 OK)**:
  ```json
  {
    "status": "ok",
    "service": "SpaceSync Backend API",
    "version": "1.0.0",
    "integrations": {
      "supabase": "configured",
      "resend": "configured"
    },
    "timestamp": "2026-07-27T11:45:00.000Z"
  }
  ```
