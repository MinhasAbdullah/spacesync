# SpaceSync Backend API Service

This is the backend service for **SpaceSync - Campus/Office Resource Booking Platform**. It handles real-time calendar availability updates, check-in validation with auto-release, and transactional reminder emails via Resend.

---

## 🛠️ Tech Stack & Features
- **Framework**: Node.js, Express, TypeScript
- **Database / Realtime**: Supabase (PostgreSQL + Exclusion Constraints + Realtime Subscriptions)
- **Email Service**: Resend API
- **Scheduler**: Node-Cron background worker
- **Validation & Safe Fallbacks**: Built-in mock mode when live keys are pending.

---

## 🚀 Quick Start Guide

### 1. Installation
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your keys:
```env
PORT=5000
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_key
SENDER_EMAIL=onboarding@resend.dev
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 📄 Database Migration Setup
To apply the required database constraints, check-in columns, and Supabase Realtime publication:
Execute `src/db/schema.sql` inside your **Supabase SQL Editor**.

---

## 📚 API Endpoint Reference
See [ENDPOINTS.md](./ENDPOINTS.md) for full request/response examples and frontend integration code.
