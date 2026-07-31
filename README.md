# 🏢 SpaceSync — Campus/Office Resource Booking Platform

> **Zeppelin Web Development Fellowship 2026 — Group M2 — Project 2**

A full-stack resource booking platform that eliminates double-bookings, enforces role-based access, and reduces no-shows through automated reminders and check-in confirmation. Built for ops/admin managers at mid-sized organizations and university facilities offices.

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| 🌍 Frontend | *Vercel deployment URL* |
| 📁 GitHub Repo | [github.com/MinhasAbdullah/spacesync](https://github.com/MinhasAbdullah/spacesync) |

---

## 🚨 Problem Statement

Shared resources — meeting rooms, labs, courts, AV equipment, parking — are managed through fragmented tools: spreadsheets, WhatsApp groups, sticky notes on doors. This causes:

- **Double-bookings** — two teams show up for the same room
- **No accountability** — no record of who booked what
- **Poor utilization visibility** — admins have no data on over/under-used resources
- **Access chaos** — anyone can book restricted resources like executive boardrooms

SpaceSync replaces all of this with a single, self-serve booking platform.

---

## ✨ Features

### ✅ MVP Features Completed

| Feature | Status | Owner |
|---------|--------|-------|
| User Authentication (Magic link + SSO) | ✅ Complete | Hassan |
| Landing Page | ✅ Complete | Akash |
| Login Page | ✅ Complete | Akash |
| Resource Browsing + Search + Filters | ✅ Complete | Akash |
| My Bookings Page | ✅ Complete | Akash |
| Admin Dashboard | ✅ Complete | Sidra |
| Resource Management Page | ✅ Complete | Sidra |
| Analytics Page (utilization, heatmap) | ✅ Complete | Sidra |
| API Routes + Frontend Connection | ✅ Complete | Hassan |
| Supabase Schema + RLS Policies | ✅ Complete | Akash |
| Realtime Calendar Updates | ✅ Complete | Wajih |
| Check-in Feature + No-show Auto-release | ✅ Complete | Wajih |
| Email Reminders via Resend | ✅ Complete | Wajih |
| Vercel Deployment | ✅ Complete | Wajih |
| Booking Wizard (4-step guided flow) | 🔄 In Progress | Hassan |
| Conflict Detection (DB-level exclusion) | ✅ Complete | Hassan + Akash |

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js (App Router) + Tailwind CSS | Responsive PWA |
| **Backend** | Next.js API Routes | Server-side conflict detection |
| **Database** | Supabase (PostgreSQL) | RLS enforces access at DB layer |
| **Auth** | Supabase Auth | Magic link + Google/Microsoft SSO |
| **Realtime** | Supabase Realtime | Calendar updates in ~1 second |
| **Email** | Resend | Booking confirmations + reminders |
| **Hosting** | Vercel | Frontend + API deployment |

---

## 🏗️ Architecture

### Conflict Detection
Double-bookings are **impossible** — enforced at the database level using a Postgres exclusion constraint:

```sql
EXCLUDE USING gist (
  resource_id WITH =,
  tstzrange(start_time, end_time, '[)') WITH &&
) WHERE (status NOT IN ('cancelled', 'no_show', 'denied'))
```

This rejects overlapping bookings atomically — even under concurrent requests. No application-layer race conditions.

### Row-Level Security
Supabase RLS policies enforce access-group visibility directly at the database layer — not just in the UI. Users can only see and book resources they have permission for.

### Realtime Calendar
Supabase Realtime subscriptions push booking changes to all connected clients within ~1 second — a booked slot disappears for other viewers instantly.

---

## 📁 Project Structure

```
teerop-p2-spacesync/
├── app/
│   ├── (auth)/
│   │   └── login/page.jsx
│   ├── dashboard/page.jsx
│   ├── bookings/page.jsx
│   ├── resources/page.jsx
│   ├── admin/
│   │   ├── dashboard/page.jsx
│   │   ├── resources/page.jsx
│   │   └── analytics/page.jsx
│   └── api/
│       ├── bookings/route.js
│       ├── resources/route.js
│       ├── checkin/route.js
│       └── reminders/route.js
├── components/
│   ├── Calendar.jsx
│   ├── BookingWizard.jsx
│   ├── ResourceCard.jsx
│   └── ConflictAlert.jsx
├── lib/
│   ├── supabase.js
│   └── resend.js
└── middleware.js
```

---

## 🗄️ Database Schema

| Table | Description |
|-------|-------------|
| `organizations` | Org accounts — each org is isolated |
| `profiles` | Users linked to Supabase Auth with roles |
| `access_groups` | Maps users to resources they can access |
| `access_group_members` | User → group membership |
| `resources` | Rooms, desks, equipment, vehicles, courts |
| `bookings` | Reservations with exclusion constraint |
| `notifications` | Logged email reminders via Resend |

---

## 👥 User Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | Manage roles, resources, booking rules, view all analytics |
| **Space Admin** | Approve/deny bookings, override conflicts, set blackout dates |
| **Member** | Browse and book accessible resources, cancel own bookings |
| **Guest** | Book explicitly shared resources via magic link, no login required |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Resend account

### Setup

```bash
# Clone the repo
git clone https://github.com/MinhasAbdullah/spacesync.git
cd spacesync

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

RESEND_API_KEY=your-resend-api-key
```

### Run locally

```bash
npm run dev
```

Open `http://localhost:3000`

---

## 📊 Pages

| Page | Description |
|------|-------------|
| Landing | Public entry point |
| Login | Magic link + Google SSO |
| Resource Browsing | Search & filter by type, building, amenities |
| My Bookings | Upcoming/past bookings with cancellation |
| Admin Dashboard | Overview for admins |
| Resource Management | Create/edit resources and access groups |
| Analytics | Utilization %, peak-hour heatmap, no-show rate |

---

## 🌿 Git Workflow

```
main              ← production
  └── dev         ← integration
        ├── feature/hassan-adil
        ├── feature/sidra
        ├── feature/wajihulqammar
        └── akash
```

---

## ⚠️ Known v1 Limitations

- External calendar events (outside SpaceSync) are not pulled in for conflict checking — only one-way sync (SpaceSync → Google/Outlook) is supported in v1
- Native mobile app not included — ships as responsive PWA

---

## 👥 Team — Group M2

| # | Name | Role | Branch |
|---|------|------|--------|
| 1 | **Abdullah Minhas** | Team Lead + Project Coordination | — |
| 2 | **Hassan Adil** | API Routes + Frontend Connection + Booking Wizard | `feature/hassan-adil` |
| 3 | **Akash** | Login + Landing + Resource Browsing + My Bookings + DB Schema | `akash` |
| 4 | **Sidra-tul-Muntaha** | Admin Dashboard + Resource Management + Analytics | `feature/sidra` |
| 5 | **Wajih-ul-Qammar** | Realtime + Check-in + Email Reminders + Deployment | `feature/wajihulqammar` |

---

## 📜 License

Built as part of the **Zeppelin Web Development Fellowship 2026**.

---

<p align="center">
  Built with ❤️ by Group M2 — Teerop Web Development Fellowship 2026
</p>