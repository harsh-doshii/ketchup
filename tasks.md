# Ketchup — Task Breakdown (Scratch to Deployment)

> Full end-to-end task list for building and shipping Ketchup.
> Stack: React 18 + Vite + TypeScript, Tailwind + shadcn/ui, Supabase, Vercel.

---

## Phase 0 — Project Setup

- [ ] **0.1** Create GitHub repo (`ketchup`) ← **YOU**
- [x] **0.2** Scaffold Vite + React + TypeScript project: `npm create vite@latest ketchup -- --template react-ts`
- [x] **0.3** Install and configure Tailwind CSS v3
- [x] **0.4** Install and initialize shadcn/ui (manually configured `components.json` + CSS vars)
- [x] **0.5** Install core dependencies:
  - `react-router-dom` v6
  - `@tanstack/react-query`
  - `zustand`
  - `luxon` + `@types/luxon`
  - `@supabase/supabase-js`
- [x] **0.6** Set up ESLint + Prettier with recommended config
- [x] **0.7** Set up Vitest for unit testing
- [x] **0.8** Create `.env.local` with placeholder Supabase keys
- [x] **0.9** Create base folder structure (`components`, `pages`, `lib`, `hooks`, `store`, `types`, `test`)
- [x] **0.10** Configure path aliases (`@/` → `src/`) in `vite.config.ts` and `tsconfig.app.json`
- [ ] **0.11** Push initial scaffold to GitHub ← **YOU** (after completing 0.1)

---

## Phase 1 — Supabase Backend Setup

- [ ] **1.1** Create Supabase project on supabase.com
- [ ] **1.2** Install Supabase CLI locally and link to project
- [ ] **1.3** Write migration: create `contacts` table
  ```sql
  id uuid PK, name text, nickname text, phone text,
  slug uuid UNIQUE DEFAULT gen_random_uuid(),
  last_called_at timestamptz, is_deleted boolean DEFAULT false, created_at timestamptz DEFAULT now()
  ```
- [ ] **1.4** Write migration: create `groups` table
  ```sql
  id uuid PK, name text, created_at timestamptz DEFAULT now()
  ```
- [ ] **1.5** Write migration: create `contact_groups` join table
  ```sql
  contact_id uuid FK→contacts, group_id uuid FK→groups, PRIMARY KEY (contact_id, group_id)
  ```
- [ ] **1.6** Write migration: create `owner_availability` table
  ```sql
  id uuid PK, day_of_week integer (0–6), start_time time, end_time time, updated_at timestamptz
  ```
- [ ] **1.7** Write migration: create `contact_availability` table
  ```sql
  id uuid PK, contact_id uuid FK→contacts,
  day_of_week integer, start_time time, end_time time, updated_at timestamptz
  ```
- [ ] **1.8** Write migration: create `call_log` table
  ```sql
  id uuid PK, contact_id uuid FK→contacts, called_at timestamptz, notes text
  ```
- [ ] **1.9** Apply all migrations: `supabase db push`
- [ ] **1.10** Configure Row Level Security (RLS):
  - `contacts`: SELECT/INSERT/UPDATE/DELETE for authenticated owner only
  - `groups`: SELECT/INSERT/UPDATE/DELETE for authenticated owner only
  - `contact_groups`: SELECT/INSERT/DELETE for authenticated owner only
  - `owner_availability`: SELECT/INSERT/UPDATE/DELETE for authenticated owner only
  - `call_log`: SELECT/INSERT for authenticated owner only
  - `contact_availability`: SELECT/INSERT/UPDATE for **anon** (public), scoped so contact can only write rows matching their contact_id (looked up via slug)
- [ ] **1.11** Generate TypeScript types: `supabase gen types typescript --local > src/types/supabase.ts`
- [ ] **1.12** Create Supabase client singleton at `src/lib/supabase.ts`
- [ ] **1.13** Manually seed the owner account via Supabase Auth dashboard (email + password)

---

## Phase 2 — Auth & Routing Shell

- [ ] **2.1** Set up React Router v6 in `main.tsx` with routes:
  - `/` → redirect logic
  - `/login`
  - `/dashboard`
  - `/availability/setup`
  - `/contacts`
  - `/contacts/:id`
  - `/availability/:slug` (public)
- [ ] **2.2** Create `AuthProvider` context using `supabase.auth.getSession()` + `onAuthStateChange`
- [ ] **2.3** Create `ProtectedRoute` wrapper — redirects to `/login` if no session
- [ ] **2.4** Build `/login` page:
  - Email + password form (shadcn `Input`, `Button`)
  - Calls `supabase.auth.signInWithPassword()`
  - Shows error toast on failure
  - Redirects to `/dashboard` on success
- [ ] **2.5** Add sign-out button in nav (calls `supabase.auth.signOut()`)
- [ ] **2.6** Build app shell layout: `<Navbar />` + `<Outlet />` for protected pages
- [ ] **2.7** Add `<TimezoneClock />` to navbar — live clock showing current IST and PST, updates every minute

---

## Phase 3 — Timezone Utilities

- [ ] **3.1** Create `src/lib/timezone.ts` with constants:
  ```typescript
  PST_ZONE = "America/Los_Angeles"
  IST_ZONE = "Asia/Kolkata"
  ```
- [ ] **3.2** Write utility: `toPST(utcDate)` → Luxon DateTime in PST
- [ ] **3.3** Write utility: `toIST(utcDate)` → Luxon DateTime in IST
- [ ] **3.4** Write utility: `slotToUTC(dayOfWeek, time, zone)` → converts recurring weekly slot to UTC
- [ ] **3.5** Write utility: `formatDualTime(utcDate)` → returns `{ pst: string, ist: string }` formatted strings
- [ ] **3.6** Write utility: `getDayLabel(pstDay, istDay)` → handles "(prev day)" / "(next day)" annotations
- [ ] **3.7** Write Vitest unit tests for all timezone utilities:
  - Test 30-min IST offset (UTC+5:30)
  - Test PDT vs PST transitions
  - Test day-boundary crossings (6pm PST Sat = 7:30am IST Sun)
  - Test `(prev day)` label logic

---

## Phase 4 — Owner Availability Setup

- [ ] **4.1** Build `<WeeklyAvailabilityGrid />` component:
  - 7 columns (Sun–Sat), rows for 30-min slots from 6:00am–midnight PST (36 slots × 7 = 252 cells)
  - Click to toggle slot free/busy (highlighted vs grey)
  - Support click-drag to select multiple slots
  - Displays PST time labels on the left axis
- [ ] **4.2** Build `/availability/setup` page:
  - Loads existing `owner_availability` rows and pre-fills grid
  - "Save" button upserts all toggled slots to `owner_availability` table
  - Shows success toast on save
- [ ] **4.3** Create React Query hook `useOwnerAvailability()` — fetch + upsert `owner_availability`
- [ ] **4.4** Create Zustand store slice for local grid state (pending unsaved changes)

---

## Phase 5 — Contact Management

- [ ] **5.1** Build `/contacts` page layout with contact list and sidebar
- [ ] **5.2** Create React Query hook `useContacts()` — fetches all non-deleted contacts with group info
- [ ] **5.3** Build `<ContactCard />` component:
  - Displays name, nickname, group tags
  - "Last called" relative date (or "Never")
  - Availability status badge (green = submitted, grey = pending)
  - Copy availability link button (copies `/availability/{slug}` URL)
  - Edit + delete actions
- [ ] **5.4** Build `<AddContactModal />` (shadcn `Dialog`):
  - Fields: Name (required), Nickname, Phone, Group (multi-select)
  - On submit: INSERT to `contacts`, then INSERT to `contact_groups`
  - Auto-generates slug (DB default)
- [ ] **5.5** Build `<EditContactModal />` — pre-fills form, UPDATE on submit
- [ ] **5.6** Implement soft delete — sets `is_deleted = true`, contact disappears from list
- [ ] **5.7** Build `<GroupManager />` panel:
  - List all groups
  - Create new group (INSERT to `groups`)
  - Rename group
  - Delete group (removes from `contact_groups` too)
- [ ] **5.8** Build `<CopyButton />` shared component — copies text to clipboard, shows checkmark toast
- [ ] **5.9** Create React Query hook `useGroups()` — fetch + create + delete groups

---

## Phase 6 — Guest Availability Page

- [ ] **6.1** Build `/availability/:slug` page (no auth required):
  - On mount: look up contact by slug via `supabase.from('contacts').select().eq('slug', slug).single()`
  - If slug invalid: show "Link not found" error state
- [ ] **6.2** Build `<GuestHeader />` — "Hi! Harsh wants to know when you're free to catch up 👋" with contact's name
- [ ] **6.3** Build `<ISTWeeklyGrid />` component:
  - Identical grid structure to `WeeklyAvailabilityGrid` but labeled in IST
  - Time axis: 6:00am–midnight IST (30-min slots)
  - Pre-fills existing `contact_availability` rows on return visit
  - Click/drag to toggle slots
- [ ] **6.4** Build `<TimezoneNote />` — small footer note: "All times shown in IST (India Standard Time)"
- [ ] **6.5** Build submit logic:
  - On "Submit": upsert all selected slots to `contact_availability` for this `contact_id`
  - Show success state ("Thanks! We'll find a good time 🎉")
  - `updated_at` timestamp recorded automatically
- [ ] **6.6** Create React Query hook `useContactAvailability(contactId)` — public fetch + upsert
- [ ] **6.7** Test full guest flow: open link in incognito → select slots → submit → re-open → slots pre-filled

---

## Phase 7 — Overlap Engine (Edge Function)

- [ ] **7.1** Scaffold Supabase Edge Function: `supabase functions new overlap`
- [ ] **7.2** Implement overlap algorithm in `supabase/functions/overlap/index.ts`:
  1. Parse request body: `{ type: "contact" | "group", id: uuid, weeksAhead: number }`
  2. Fetch owner's `owner_availability` slots (all rows)
  3. If `type === "contact"`: fetch that contact's `contact_availability`
  4. If `type === "group"`: fetch all contacts in group + their availability
  5. Expand recurring weekly patterns into concrete UTC datetime ranges for `weeksAhead` weeks
  6. Find intersecting UTC windows (owner ∩ contact, or owner ∩ all-group-members)
  7. For group: support "all members must overlap" logic
  8. Sort windows by `startUtc` ascending
  9. Format each window with `startPST`, `endPST`, `startIST`, `endIST` strings
  10. Return JSON response
- [ ] **7.3** Handle edge cases in overlap logic:
  - Day boundary crossings (IST day ≠ PST day)
  - PDT/PST transitions (Luxon handles automatically)
  - IST 30-min offset
  - Empty availability (return empty windows array)
- [ ] **7.4** Write Vitest unit tests for the overlap algorithm (import logic separately from Deno handler)
- [ ] **7.5** Deploy edge function: `supabase functions deploy overlap`
- [ ] **7.6** Create `src/lib/overlapApi.ts` — typed wrapper to call the edge function from React

---

## Phase 8 — Dashboard

- [ ] **8.1** Build `/dashboard` page layout (sidebar + main content area)
- [ ] **8.2** Build `<OverlapFeed />` component:
  - Calls overlap edge function for all contacts
  - Chronological list of upcoming windows
  - Each row: dual time label (PST + IST), contact name, duration badge
  - Clicking a row opens `<SlotConfirmModal />`
- [ ] **8.3** Build `<DualTimeLabel />` shared component:
  - Renders `"Mon 7:30am IST / Sun 6:00pm PST (prev day)"` format
  - Accepts UTC datetime prop
- [ ] **8.4** Build `<NudgeBanner />`:
  - Fetches contacts where `last_called_at < now() - 14 days` (or null)
  - Shows strip at top: "You haven't called [Name] in 18 days"
  - Sorted by most overdue first
- [ ] **8.5** Build `<ContactList />` dashboard widget:
  - Compact version of contact cards
  - Status badge, last-called label, overlap count badge
  - Sort by "most overdue" toggle
- [ ] **8.6** Build `<GroupTabs />` — tab bar to filter `<OverlapFeed />` by group (or "All")
- [ ] **8.7** Build `<OwnerAvailabilityMiniView />` — compressed read-only view of owner's set availability
- [ ] **8.8** Build `<WeekStrip />` — horizontal strip showing current week dates, today highlighted

---

## Phase 9 — Slot Confirmation & Call Logging

- [ ] **9.1** Build `<SlotConfirmModal />` (shadcn `Dialog`):
  - Shows selected window: PST time, IST time, contact name
  - Pre-written WhatsApp message: *"Hey [Name]! Are you free [Day] at [IST time]? That's [PST time] for me 😊"*
  - `<CopyButton />` for one-click clipboard copy
  - "Mark call as done" button
- [ ] **9.2** Implement "Mark call as done":
  - INSERT row to `call_log` with `called_at = now()`
  - UPDATE `contacts.last_called_at = now()` for that contact
  - Close modal + show success toast + refetch contacts
- [ ] **9.3** Build `/contacts/:id` detail page:
  - `<ContactAvailabilityView />` — their submitted IST grid (read-only overlay)
  - `<OverlapWindowList />` — overlap windows specific to this contact (calls edge function)
  - `<CallLogTimeline />` — list of past `call_log` entries with dates and notes
- [ ] **9.4** Build `<RelativeDate />` shared component — "3 days ago", "2 weeks ago", "Never"
- [ ] **9.5** Create React Query hook `useCallLog(contactId)` — fetch call history

---

## Phase 10 — Polish & UX

- [ ] **10.1** Add loading skeletons (shadcn `Skeleton`) to all data-fetching components
- [ ] **10.2** Add empty states (no contacts, no availability set, no overlap windows)
- [ ] **10.3** Add error states with retry buttons for failed queries
- [ ] **10.4** Implement toast notifications (shadcn `Sonner` or `Toast`) for all actions
- [ ] **10.5** Make guest page (`/availability/:slug`) fully mobile-responsive (touch-friendly grid)
- [ ] **10.6** Make dashboard responsive for tablet/desktop (no mobile dashboard requirement)
- [ ] **10.7** Add `<head>` meta tags: title, description, og:image for sharing
- [ ] **10.8** Audit and finalize all "prev day" / "next day" labels in dual time displays
- [ ] **10.9** Add keyboard shortcuts: `Escape` closes modals, etc.
- [ ] **10.10** Accessibility pass: ARIA labels, focus management in modals, color contrast check

---

## Phase 11 — Testing

- [ ] **11.1** Unit tests — timezone utilities (`src/lib/timezone.test.ts`):
  - All conversion functions
  - Day-boundary edge cases
  - PDT transition cases
- [ ] **11.2** Unit tests — overlap algorithm (`supabase/functions/overlap/overlap.test.ts`):
  - Basic overlap
  - No overlap
  - Group overlap (all members required)
  - Multi-week expansion
  - Day-boundary overlap
- [ ] **11.3** Component smoke tests (Vitest + React Testing Library):
  - `<WeeklyAvailabilityGrid />` renders correct slot count
  - `<ISTWeeklyGrid />` pre-fills correctly
  - `<DualTimeLabel />` renders correct strings
- [ ] **11.4** Manual end-to-end test checklist:
  - [ ] Owner login → dashboard loads
  - [ ] Set availability → saves → reloads correctly
  - [ ] Add contact → shareable link generated
  - [ ] Open link in incognito → submit availability → success
  - [ ] Return to link → slots pre-filled
  - [ ] Dashboard shows overlap windows
  - [ ] Click window → WhatsApp message generated → copy works
  - [ ] Mark call done → last-called updates
  - [ ] Overdue contact appears in NudgeBanner

---

## Phase 12 — Deployment

- [ ] **12.1** Create production Supabase project (if using separate project for prod)
- [ ] **12.2** Run all migrations on production Supabase: `supabase db push --linked`
- [ ] **12.3** Apply RLS policies on production DB
- [ ] **12.4** Seed owner account on production via Supabase Auth dashboard
- [ ] **12.5** Deploy edge function to production: `supabase functions deploy overlap --project-ref <ref>`
- [ ] **12.6** Set edge function env vars in Supabase dashboard:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] **12.7** Connect GitHub repo to Vercel project
- [ ] **12.8** Set Vercel environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_BASE_URL`
- [ ] **12.9** Trigger first Vercel deployment, verify build passes
- [ ] **12.10** Set up custom domain on Vercel (optional)
- [ ] **12.11** Configure Vercel to deploy `main` branch automatically on push
- [ ] **12.12** Full production smoke test:
  - Login on production URL
  - Create a contact, copy link
  - Submit availability as guest
  - Verify overlap appears on dashboard

---

## Backlog / Future (Post-MVP)

- [ ] WhatsApp deep link (`wa.me` URL with pre-filled message)
- [ ] Google Calendar sync for owner availability
- [ ] Push/email nudge notifications
- [ ] Availability expiry (auto-expire guest slots after 4 weeks)
- [ ] Recurring call scheduling ("every other Sunday")
- [ ] Hindi UI option for guest page
- [ ] Mobile PWA (installable on home screen)
- [ ] Group video call link generation

---

## Task Summary

| Phase | Area | Tasks |
|---|---|---|
| 0 | Project Setup | 11 tasks |
| 1 | Supabase Backend | 13 tasks |
| 2 | Auth & Routing | 7 tasks |
| 3 | Timezone Utilities | 7 tasks |
| 4 | Owner Availability | 4 tasks |
| 5 | Contact Management | 9 tasks |
| 6 | Guest Page | 7 tasks |
| 7 | Overlap Engine | 6 tasks |
| 8 | Dashboard | 8 tasks |
| 9 | Slot Confirmation | 5 tasks |
| 10 | Polish & UX | 10 tasks |
| 11 | Testing | 4 tasks |
| 12 | Deployment | 12 tasks |
| **Total** | | **~103 tasks** |
