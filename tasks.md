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

- [ ] **1.1** Create Supabase project on supabase.com ← **YOU**
- [ ] **1.2** Install Supabase CLI locally and link to project ← **YOU**
- [x] **1.3** Write migration: create `contacts` table
- [x] **1.4** Write migration: create `groups` table
- [x] **1.5** Write migration: create `contact_groups` join table
- [x] **1.6** Write migration: create `owner_availability` table
- [x] **1.7** Write migration: create `contact_availability` table
- [x] **1.8** Write migration: create `call_log` table
- [ ] **1.9** Apply all migrations: `supabase db push` ← **YOU**
- [x] **1.10** Configure Row Level Security (RLS) — written in migration `20260101000007_rls_policies.sql`
- [ ] **1.11** Generate TypeScript types: `supabase gen types typescript --linked > src/types/supabase.ts` ← **YOU** (after 1.9)
- [x] **1.12** Create Supabase client singleton at `src/lib/supabase.ts`
- [ ] **1.13** Seed owner account via Supabase Auth dashboard (Authentication → Add user) ← **YOU**

---

## Phase 2 — Auth & Routing Shell

- [x] **2.1** Set up React Router v6 in `App.tsx` with all routes
- [x] **2.2** Create `AuthProvider` context (`src/lib/auth.tsx`) using `supabase.auth.getSession()` + `onAuthStateChange`
- [x] **2.3** Create `ProtectedRoute` wrapper — redirects to `/login` if no session
- [x] **2.4** Build `/login` page — email + password form, error display, redirects on success
- [x] **2.5** Add sign-out button in `<Navbar />`
- [x] **2.6** Build app shell layout: `<AppLayout />` with `<Navbar />` + `<Outlet />`
- [x] **2.7** Add `<TimezoneClock />` to navbar — live ET + IST clock, updates every minute

---

## Phase 3 — Timezone Utilities

- [x] **3.1** Create `src/lib/timezone.ts` with `ET_ZONE` + `IST_ZONE` constants
- [x] **3.2** Write utility: `toET(dt)` → Luxon DateTime in ET
- [x] **3.3** Write utility: `toIST(dt)` → Luxon DateTime in IST
- [x] **3.4** Write utility: `slotToUTC(dayOfWeek, timeStr, zone)` → next UTC occurrence of a recurring slot
- [x] **3.5** Write utility: `formatDualTime(utcDt)` → `{ et, ist, etDay, istDay, dayDiff }`
- [x] **3.6** Write utility: `getDayDiffLabel(etDt, istDt)` → "(next day)" / "(prev day)" / ""
- [x] **3.7** Write Vitest unit tests — 19/19 passing:
  - 30-min IST offset (UTC+5:30)
  - EDT vs EST transitions
  - Day-boundary crossings (6pm ET Sat = 4:30am IST Sun)
  - `(prev day)` / `(next day)` label logic
  - `relativeDate` formatting

---

## Phase 4 — Owner Availability Setup

- [x] **4.1** Build `<WeeklyAvailabilityGrid />` — 7×36 grid (Sun–Sat, 6am–midnight ET, 30-min slots), click + drag to toggle
- [x] **4.2** Build `/availability/setup` page — loads from DB, pre-fills grid, save button with unsaved-changes indicator
- [x] **4.3** Create `useOwnerAvailability()` + `useSaveOwnerAvailability()` React Query hooks
- [x] **4.4** Create `useAvailabilityStore` Zustand store — slots state + unsaved changes detection

---

## Phase 5 — Contact Management

- [x] **5.1** Build `/contacts` page — contact list + sidebar layout, loading skeletons, empty state
- [x] **5.2** Create `useContacts()` hook — fetches non-deleted contacts with nested groups + availability status
- [x] **5.3** Build `<ContactCard />` — name, nickname, group tags, availability dot, last-called, copy link, edit/delete
- [x] **5.4** Build `<AddContactModal />` — name/nickname/phone/group form, inserts contact + group assignments
- [x] **5.5** Build `<EditContactModal />` — pre-fills form, replaces group assignments on save
- [x] **5.6** Soft delete — `useDeleteContact()` sets `is_deleted = true` with confirmation prompt
- [x] **5.7** Build `<GroupManager />` sidebar — create, rename (inline), delete groups
- [x] **5.8** Build `<CopyButton />` — clipboard copy with animated checkmark
- [x] **5.9** Create `useGroups()` + `useCreateGroup()` + `useDeleteGroup()` + `useRenameGroup()` hooks

---

## Phase 6 — Guest Availability Page

- [x] **6.1** Build `/availability/:slug` page — slug lookup, loading state, "Link not found" error state
- [x] **6.2** Build guest header — "Hey [name]! Harsh wants to catch up 👋"
- [x] **6.3** Reused `<WeeklyAvailabilityGrid />` with `timezoneLabel="IST"` prop, pre-fills on return visit
- [x] **6.4** IST timezone banner — "All times are in IST (India Standard Time)"
- [x] **6.5** Submit logic — delete-all + insert, success state with update link
- [x] **6.6** `useContactBySlug`, `useContactAvailability`, `useSaveContactAvailability` hooks (all public/anon)
- [ ] **6.7** Test full guest flow: open link in incognito → select slots → submit → re-open → slots pre-filled ← **YOU**

---

## Phase 7 — Overlap Engine (Edge Function)

- [x] **7.1** Edge function scaffolded at `supabase/functions/overlap/index.ts`
- [x] **7.2** Overlap algorithm implemented — contact + group modes, expand slots → UTC → intersect → format
- [x] **7.3** Edge cases handled: day boundaries, EDT/EST via Luxon, IST 30-min offset, empty arrays
- [x] **7.4** Vitest unit tests in `src/lib/overlapAlgorithm.ts` — **22 tests, all passing** (41 total)
- [x] **7.5** Deploy edge function: `supabase functions deploy overlap --no-verify-jwt` ← **YOU** ✓
- [x] **7.6** `src/lib/overlapApi.ts` — typed `fetchOverlapWindows()` wrapper using `supabase.functions.invoke()`

---

## Phase 8 — Dashboard

- [x] **8.1** Build `/dashboard` page layout (sidebar + main content area)
- [x] **8.2** Build `<OverlapFeed />` component:
  - Calls overlap edge function for all contacts
  - Chronological list of upcoming windows
  - Each row: dual time label (ET + IST), contact name, duration badge
  - Clicking a row opens `<SlotConfirmModal />`
- [x] **8.3** Build `<DualTimeLabel />` shared component:
  - Renders `"Mon 7:30am IST / Sun 6:00pm ET (prev day)"` format
  - Accepts UTC datetime prop
- [x] **8.4** Build `<NudgeBanner />`:
  - Fetches contacts where `last_called_at < now() - 14 days` (or null)
  - Shows strip at top: "You haven't called [Name] in 18 days"
  - Sorted by most overdue first
- [x] **8.5** Build `<ContactList />` dashboard widget:
  - Compact version of contact cards
  - Status badge, last-called label, overlap count badge
  - Sort by "most overdue" toggle
- [x] **8.6** Build `<GroupTabs />` — tab bar to filter `<OverlapFeed />` by group (or "All")
- [x] **8.7** Build `<OwnerAvailabilityMiniView />` — compressed read-only view of owner's set availability
- [x] **8.8** Build `<WeekStrip />` — horizontal strip showing current week dates, today highlighted

---

## Phase 9 — Slot Confirmation & Call Logging

- [x] **9.1** Build `<SlotConfirmModal />` (shadcn `Dialog`):
  - Shows selected window: ET time, IST time, contact name
  - Pre-written WhatsApp message: *"Hey [Name]! Are you free [Day] at [IST time]? That's [ET time] for me 😊"*
  - `<CopyButton />` for one-click clipboard copy
  - "Mark call as done" button
- [x] **9.2** Implement "Mark call as done":
  - INSERT row to `call_log` with `called_at = now()`
  - UPDATE `contacts.last_called_at = now()` for that contact
  - Close modal + show success toast + refetch contacts
- [x] **9.3** Build `/contacts/:id` detail page:
  - Contact availability grid (IST, read-only)
  - Overlap windows for this contact (clicks open SlotConfirmModal)
  - Call log timeline with dates and relative labels
- [x] **9.4** Build `<RelativeDate />` shared component — "3 days ago", "2 weeks ago", "Never"
- [x] **9.5** Create React Query hook `useCallLog(contactId)` — fetch call history

---

## Phase 10 — Polish & UX

- [x] **10.1** Add loading skeletons to all data-fetching components
- [x] **10.2** Add empty states (no contacts, no availability set, no overlap windows)
- [x] **10.3** Add error states with retry buttons for failed queries
- [x] **10.4** Toast notifications via sonner for all mutations (add/edit/delete contact, save availability, mark call done, guest submit)
- [x] **10.5** Guest page fully mobile-responsive: touch drag-to-select on availability grid (touchstart/touchmove via elementFromPoint), Toaster added to guest page
- [x] **10.6** Contacts page sidebar goes full-width on mobile; dashboard uses lg:grid-cols-3; AppLayout has px-4
- [x] **10.7** index.html: title, description, og:title, og:description, og:type, theme-color
- [x] **10.8** "prev day"/"next day" labels correct in timezone.ts and DualTimeLabel
- [x] **10.9** Escape closes modals (Radix Dialog handles natively)
- [x] **10.10** ARIA labels on icon buttons; Radix Dialog handles focus trapping; active nav link highlighted

---

## Phase 11 — Testing

- [x] **11.1** Unit tests — timezone utilities (`src/lib/timezone.test.ts`) — **19 tests passing**
- [x] **11.2** Unit tests — overlap algorithm (`src/lib/overlapAlgorithm.test.ts`) — **22 tests passing**
- [x] **11.3** Component smoke tests (Vitest + React Testing Library) — **15 tests passing**:
  - `<WeeklyAvailabilityGrid />`: 7 headers, 252 cells, pre-fill, click, deselect, readonly, touch hint
  - `<DualTimeLabel />`: IST/ET times, "(next day)", same-day no-label, day names
- [x] **11.4** Manual end-to-end test checklist ← **YOU** ✓:
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
