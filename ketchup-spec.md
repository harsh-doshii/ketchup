# Ketchup — Technical Specification
> A personal scheduling tool for staying connected across IST and ET timezones.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Scope](#2-scope)
3. [User Roles & Journeys](#3-user-roles--journeys)
4. [Feature Specifications](#4-feature-specifications)
5. [Data Models](#5-data-models)
6. [Tech Stack](#6-tech-stack)
7. [Architecture](#7-architecture)
8. [Page & Component Breakdown](#8-page--component-breakdown)
9. [API Design](#9-api-design)
10. [Timezone Logic](#10-timezone-logic)
11. [Routing & URL Structure](#11-routing--url-structure)
12. [Environment & Config](#12-environment--config)
13. [Development Phases](#13-development-phases)
14. [Future Enhancements](#14-future-enhancements)

---

## 1. Project Overview

**Ketchup** is a personal web app built for one owner (you) to coordinate calls with friends and family in India. It solves the specific pain point of finding overlapping free time between ET (your timezone) and IST (your contacts' timezone), which are ~9.5–10.5 hours apart (EDT/EST).

Unlike generic scheduling tools (Calendly, Doodle), Ketchup is:
- **Relationship-first**: Built around named, persistent contacts and groups, not anonymous meeting slots.
- **Dual-timezone native**: Every UI element shows both IST and ET simultaneously.
- **Zero friction for guests**: Contacts open a link, tap their availability, and done — no account, no install.
- **Personal dashboard**: You see all your contacts' availability and overlap windows in one place.

---

## 2. Scope

### In Scope (MVP)
- Owner authentication (single user — you)
- Contact management (add, name, group)
- Owner sets their own weekly recurring availability in ET
- Shareable per-contact availability submission link (no login for guest)
- Guest availability submission UI in IST
- Overlap calculation engine
- Dashboard showing upcoming overlap windows per contact and per group
- "Last called" tracking per contact
- WhatsApp-ready message copy for confirming a slot

### Out of Scope (MVP)
- Calendar integrations (Google Calendar, Outlook)
- Email/SMS notifications
- Video call integration
- Mobile app
- Multiple owners / multi-user accounts
- Payment or subscription logic

---

## 3. User Roles & Journeys

### Role 1: Owner (You)

1. Log in to your dashboard.
2. Set your weekly recurring availability (e.g., "Mon–Fri after 6pm ET, Sat–Sun 9am–12pm ET").
3. Add a contact: enter their name, optional phone, assign to a group.
4. Copy their unique availability link and send it over WhatsApp.
5. View dashboard: see which contacts have submitted availability, see overlap windows.
6. Click a window to generate a WhatsApp message confirming the time.
7. Mark a call as completed to update the "last called" tracker.

### Role 2: Contact (Guest — Family/Friend in India)

1. Receive a WhatsApp link from you.
2. Open the link in their browser — no login required.
3. See a simple weekly grid **in IST**.
4. Tap to mark slots as free or busy.
5. Submit. Done. Can return to the link later to update.

---

## 4. Feature Specifications

### F1 — Owner Authentication
- Single-user app. Use a simple email + password login via Supabase Auth.
- No public sign-up page. Owner account is seeded manually or via a setup script.
- Session persisted via JWT stored in `httpOnly` cookie or Supabase session.

### F2 — Owner Availability Setup
- Owner sets a **weekly recurring availability template** in ET.
- UI: a 7-day × 24-hour grid (shown as 6am–midnight for usability).
- Slots are 30-minute blocks. Owner clicks to toggle free/busy.
- Availability is stored as a list of `{ dayOfWeek, startTime, endTime }` records in ET.
- Owner can update availability at any time; changes immediately affect overlap calculations.

### F3 — Contact Management
- **Add Contact**: Name (required), nickname, phone number (optional), group assignment (optional).
- **Edit / Delete Contact**: Soft delete — preserves historical "last called" data.
- **Groups**: Create named groups (e.g., "Family", "BITS Friends"). A contact can belong to multiple groups.
- Each contact has a unique `slug` (UUID) used in their shareable link.

### F4 — Guest Availability Submission
- URL format: `/availability/{contact-slug}`
- Page loads with the contact's name displayed (e.g., "Hi! Harsh wants to know when you're free to catch up.")
- Weekly grid shown in IST. 30-minute slots, 6am–midnight IST range.
- Guest taps slots to toggle free/unavailable.
- "Submit" saves to DB. A success message is shown.
- Guest can return to the same link and edit their availability. Previously submitted slots are pre-filled.
- No authentication required — the UUID slug is the access token.
- Submission records a `lastUpdated` timestamp.

### F5 — Overlap Engine
- Runs server-side (or in an edge function) when the dashboard loads or on-demand.
- Logic:
  1. Fetch owner's ET availability template. Convert all slots to UTC.
  2. Fetch contact's IST availability. Convert all slots to UTC.
  3. Find intersecting UTC windows.
  4. Re-display results in both ET (for owner) and IST (for contact).
- Results are sorted by soonest upcoming occurrence.
- For groups: find windows where the owner + **all** (or configurable: **≥ N**) group members overlap.

### F6 — Dashboard
- **My Week: Shows the current week's ET availability for the owner.
- **Contacts Panel**: List of all contacts with:
  - Online status indicator (has submitted availability: green; not yet: grey).
  - Last called date + "X days ago" relative label.
  - Quick link to copy their availability submission URL.
  - Overlap window count badge (e.g., "4 windows this week").
- **Overlap Feed**: A chronological list of all upcoming overlap windows across all contacts, showing both ET and IST times.
- **Groups Tab**: Same overlap view but filtered per group.
- **Nudge Banner**: Contacts you haven't called in > 14 days are surfaced at the top.

### F7 — Slot Confirmation & WhatsApp Copy
- Owner clicks any overlap window.
- A modal appears showing:
  - The slot in ET (your time).
  - The slot in IST (their time).
  - Contact name.
  - A pre-written WhatsApp message: *"Hey [Name]! Are you free [Day] at [IST time]? That's [ET time] for me 😊"*
- One-click copy to clipboard.
- Button to "Mark call as done" — updates `lastCalledAt` on the contact.

### F8 — Last Called Tracker
- Each contact has a `lastCalledAt` timestamp.
- Shown on the contact card as "Last called: 5 days ago".
- On the dashboard, contacts are sortable by "most overdue" (longest since last call).
- Contacts not called in > 14 days get a soft highlight/nudge.

---

## 5. Data Models

All models are stored in a **Supabase (PostgreSQL)** database.

### `contacts`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | Display name |
| `nickname` | `text` | Optional |
| `phone` | `text` | Optional, for WhatsApp pre-fill |
| `slug` | `uuid` | Used in shareable URL, unique |
| `last_called_at` | `timestamptz` | Nullable |
| `is_deleted` | `boolean` | Soft delete |
| `created_at` | `timestamptz` | |

### `groups`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `name` | `text` | e.g., "Family" |
| `created_at` | `timestamptz` | |

### `contact_groups`
| Column | Type | Notes |
|---|---|---|
| `contact_id` | `uuid` | FK → contacts |
| `group_id` | `uuid` | FK → groups |

### `owner_availability`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `day_of_week` | `integer` | 0=Sunday … 6=Saturday |
| `start_time` | `time` | ET, e.g., `18:00` |
| `end_time` | `time` | ET, e.g., `22:00` |
| `updated_at` | `timestamptz` | |

### `contact_availability`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `contact_id` | `uuid` | FK → contacts |
| `day_of_week` | `integer` | 0=Sunday … 6=Saturday |
| `start_time` | `time` | IST, stored as UTC |
| `end_time` | `time` | IST, stored as UTC |
| `updated_at` | `timestamptz` | |

> **Storage convention**: All times are stored in UTC internally. Conversion to ET/IST happens at the application layer using `Luxon`.

### `call_log`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `contact_id` | `uuid` | FK → contacts |
| `called_at` | `timestamptz` | |
| `notes` | `text` | Optional |

---

## 6. Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite** | Build tool / dev server |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **shadcn/ui** | Component library (built on Radix UI) |
| **Luxon** | Timezone-aware date/time manipulation |
| **Zustand** | Lightweight client state management |
| **React Query (TanStack Query)** | Server state, caching, refetching |

### Backend / Infrastructure
| Tool | Purpose |
|---|---|
| **Supabase** | PostgreSQL DB + Auth + Row Level Security + Realtime |
| **Supabase Edge Functions** | Serverless functions for overlap computation |
| **Supabase Storage** | (Optional) future use for profile pictures |

### Deployment
| Tool | Purpose |
|---|---|
| **Vercel** | Frontend hosting + CI/CD from GitHub |
| **Supabase Cloud** | Managed Postgres + Auth (free tier sufficient for personal use) |

### Development Tools
| Tool | Purpose |
|---|---|
| **TypeScript** | Type safety throughout |
| **ESLint + Prettier** | Linting and formatting |
| **Vitest** | Unit testing (overlap engine logic) |
| **Supabase CLI** | Local dev, migrations, type generation |

---

## 7. Architecture

```
┌─────────────────────────────────────────────────┐
│                  Vercel (Frontend)               │
│                                                  │
│   React App (Vite + TypeScript)                  │
│   ├── Owner Dashboard   (/dashboard)             │
│   ├── Contact Manager   (/contacts)              │
│   └── Guest Page        (/availability/:slug)    │
│                                                  │
│   State: Zustand (local) + React Query (server)  │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS (Supabase JS Client)
┌──────────────────▼──────────────────────────────┐
│               Supabase Cloud                     │
│                                                  │
│   ┌─────────────────┐   ┌─────────────────────┐ │
│   │  PostgreSQL DB   │   │   Supabase Auth     │ │
│   │  (all tables)    │   │   (owner login)     │ │
│   └─────────────────┘   └─────────────────────┘ │
│                                                  │
│   ┌──────────────────────────────────────────┐  │
│   │         Edge Function: /overlap          │  │
│   │  Input: contact_id (or group_id)         │  │
│   │  Logic: fetch both availabilities →      │  │
│   │         convert to UTC → intersect →     │  │
│   │         return sorted windows in ET/IST │  │
│   └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Row Level Security (RLS) Policy Summary
- `contacts`, `groups`, `owner_availability`, `call_log`: Only accessible by authenticated owner.
- `contact_availability`: **Read and write allowed without auth**, scoped by `contact_id` which is looked up via the `slug` URL parameter. The `slug` acts as a bearer token for guest writes.

---

## 8. Page & Component Breakdown

### Pages

#### `/login`
- Simple email/password form.
- Redirects to `/dashboard` on success.
- No sign-up link (owner-only).

#### `/dashboard`
- **Components**:
  - `<WeekStrip />` — Shows current week, highlights today.
  - `<OwnerAvailabilityMiniView />` — Compressed view of your set availability.
  - `<OverlapFeed />` — Chronological list of all upcoming overlap windows.
  - `<ContactList />` — All contacts with status badges and last-called info.
  - `<NudgeBanner />` — Contacts overdue for a call.
  - `<GroupTabs />` — Filter overlap feed by group.

#### `/availability/setup`
- Owner's availability editor.
- **Components**:
  - `<WeeklyAvailabilityGrid />` — 7-day × 48-slot (30min) grid in ET.
  - Toggle slots by clicking or dragging.
  - Save button writes to `owner_availability` table.

#### `/contacts`
- List + management page.
- **Components**:
  - `<ContactCard />` — Name, group tags, last called, copy link button.
  - `<AddContactModal />` — Form to add a new contact.
  - `<GroupManager />` — Create/rename/delete groups.

#### `/contacts/:id`
- Individual contact detail page.
- **Components**:
  - `<ContactAvailabilityView />` — Their submitted slots (in IST) overlaid on a grid.
  - `<OverlapWindowList />` — Computed windows for this contact specifically.
  - `<CallLogTimeline />` — History of past calls.
  - `<SlotConfirmModal />` — Triggered on clicking a window.

#### `/availability/:slug` *(Public — no auth)*
- Guest availability submission page.
- **Components**:
  - `<GuestHeader />` — "Hi! Harsh wants to catch up 👋" with contact name.
  - `<ISTWeeklyGrid />` — 7-day × 48-slot grid in IST. Pre-fills existing submission.
  - `<SubmitButton />` — Posts to `contact_availability`. Shows success state.
  - `<TimezoneNote />` — Small note: "All times shown in IST (India Standard Time)".

### Shared Components
- `<DualTimeLabel time={utcTime} />` — Always renders as "7:30am IST / 6:00pm ET (prev day)"
- `<TimezoneClock />` — Live clock showing both IST and ET in the nav bar
- `<CopyButton text={...} />` — Clipboard copy with toast feedback
- `<RelativeDate date={...} />` — "3 days ago", "2 weeks ago"

---

## 9. API Design

All data access goes through the **Supabase JS client** directly from the frontend (using RLS for security), except for the overlap computation which is a Supabase Edge Function.

### Supabase Edge Function: `POST /functions/v1/overlap`

**Request Body**:
```json
{
  "type": "contact",       // "contact" | "group"
  "id": "<uuid>",
  "weeksAhead": 2          // how many weeks to compute overlap for
}
```

**Response**:
```json
{
  "windows": [
    {
      "startUtc": "2025-03-10T01:30:00Z",
      "endUtc": "2025-03-10T03:00:00Z",
      "startET": "Mon Mar 10, 9:30am ET",
      "endET": "Mon Mar 10, 11:00am ET",
      "startIST": "Tue Mar 11, 7:00am IST",
      "endIST": "Tue Mar 11, 8:30am IST",
      "durationMinutes": 90,
      "contacts": ["<uuid>"]
    }
  ]
}
```

### Direct Supabase Queries (via client)

| Operation | Table | Auth |
|---|---|---|
| Get all contacts | `contacts` | Owner only |
| Get contact by slug | `contacts` | Public (by slug column) |
| Get owner availability | `owner_availability` | Owner only |
| Upsert owner availability | `owner_availability` | Owner only |
| Get contact availability | `contact_availability` | Owner only |
| Upsert contact availability | `contact_availability` | Public (slug-scoped) |
| Log a call | `call_log` | Owner only |
| Update `last_called_at` | `contacts` | Owner only |

---

## 10. Timezone Logic

This is the most critical part of the app. All timezone math uses **Luxon**.

### Key Constants
```typescript
const ET_ZONE = "America/New_York"; // handles EDT/EST automatically
const IST_ZONE = "Asia/Kolkata";        // UTC+5:30, no DST
```

### Storage Convention
All times stored in the database are in **UTC**. The `day_of_week` + `start_time` / `end_time` columns represent a *weekly recurring pattern*, not a specific date.

### Conversion Flow

**Owner availability → UTC:**
```
ET day + time → find next occurrence of that weekday → convert to UTC
```

**Guest availability → UTC:**
```
IST day + time → find next occurrence of that weekday → convert to UTC
```

**Overlap → Display:**
```
UTC window → DateTime.setZone(ET_ZONE) → format for owner
UTC window → DateTime.setZone(IST_ZONE) → format for guest/contact
```

### Edge Cases to Handle
- **Day boundary crossings**: 6pm ET Saturday = 4:30am IST Sunday. The UI must clearly label the day in both zones.
- **EDT/EST transitions: Luxon handles this automatically when using `America/New_York``.
- **The 30-minute offset**: IST is UTC+5:30, not a whole-hour offset. Ensure all slot grids use 30-minute increments.
- **"Previous day" label**: When an IST morning slot corresponds to ET previous evening, display "(prev day)" clearly.

---

## 11. Routing & URL Structure

```
/                          → Redirect to /dashboard (if logged in) or /login
/login                     → Owner login page
/dashboard                 → Main dashboard
/availability/setup        → Owner sets their weekly availability
/contacts                  → Contact list + group management
/contacts/:id              → Individual contact detail + overlap view
/availability/:slug        → Public guest availability submission (no auth)
```

---

## 12. Environment & Config

### `.env` (Vite frontend)
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_BASE_URL=https://ketchup.vercel.app
```

### Supabase Edge Function env (set via Supabase dashboard)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # needed for edge function to bypass RLS
```

---

## 13. Development Phases

### Phase 1 — Foundation (Week 1)
- [ ] Initialize Vite + React + TypeScript project
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Initialize Supabase project, create all tables with correct schema
- [ ] Configure RLS policies
- [ ] Implement owner login page and auth flow
- [ ] Supabase client setup with type generation (`supabase gen types`)

### Phase 2 — Owner Availability (Week 1–2)
- [ ] Build `WeeklyAvailabilityGrid` component (ET, 30-min slots)
- [ ] Wire to `owner_availability` table (read + upsert)
- [ ] Display live clock for ET and IST in nav

### Phase 3 — Contacts (Week 2)
- [ ] Build contact list page + `AddContactModal`
- [ ] Contact CRUD (add, edit, soft delete)
- [ ] Group creation and assignment
- [ ] Generate and display shareable slug links

### Phase 4 — Guest Page (Week 2–3)
- [ ] Build `/availability/:slug` page (no auth)
- [ ] IST weekly grid component (mirrors owner grid but in IST)
- [ ] Slug-based contact lookup
- [ ] Submit + update availability to `contact_availability`
- [ ] Pre-fill on return visit

### Phase 5 — Overlap Engine (Week 3)
- [ ] Write Supabase Edge Function for overlap computation
- [ ] Unit test timezone conversion logic with Vitest
- [ ] Handle day-boundary edge cases
- [ ] Return sorted, labeled windows in both timezones

### Phase 6 — Dashboard (Week 3–4)
- [ ] Wire `OverlapFeed` to edge function
- [ ] `ContactList` with status badges and last-called info
- [ ] `NudgeBanner` for overdue contacts
- [ ] Group tabs filter
- [ ] `SlotConfirmModal` with WhatsApp message copy

### Phase 7 — Polish & Deploy (Week 4)
- [ ] `DualTimeLabel` and `RelativeDate` shared components
- [ ] Responsive design (mobile-friendly for viewing on phone)
- [ ] Deploy frontend to Vercel
- [ ] Configure Supabase Edge Function deployment
- [ ] End-to-end test the full guest → overlap → confirm flow

---

## 14. Future Enhancements

These are explicitly out of scope for the MVP but worth noting for later:

- **Google Calendar sync**: Pull your real free/busy from GCal instead of the manual grid.
- **WhatsApp deep link**: Instead of copy-paste, generate a `wa.me` URL with the message pre-filled.
- **Push reminders**: Browser notifications or email nudges when a contact updates their availability.
- **Recurring call scheduling**: "Every other Sunday at 9am IST" — set it and forget it.
- **Multi-language support**: Hindi UI option for less tech-savvy family members on the guest page.
- **Mobile PWA**: Installable on home screen for quick dashboard access.
- **Availability expiry**: Guest availability auto-expires after 4 weeks, prompting a refresh link.
- **Group video call links**: Auto-generate a Zoom/Meet link alongside the WhatsApp message.

---

*Document version: 1.0 — Built for personal use by Harsh Doshi*
