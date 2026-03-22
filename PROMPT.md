# Alberts Family Weekly Tracker -- Claude Code Project Prompt

## Overview

Build a mobile-first web app that replaces a family weekly homework/activity tracking spreadsheet. The family is in Tampa, FL (Zone 9b). The app tracks three school-age children (Beau, Lucia, Niva) plus parent schedules (Allie, Patrick). It must work great on iPhone (installable as a PWA) and on a laptop browser.

---

## Tech Stack

- React 18 + Vite (fast dev, fast builds)
- Tailwind CSS (utility-first, mobile-first by default)
- Supabase (auth, Postgres database, realtime subscriptions)
- Vercel (deploy from GitHub, automatic on push)
- PWA (service worker + manifest for home screen install and offline support)
- Open-Meteo API for Tampa weather (free, no key)

### Why this stack
- React components keep the code organized (WeekGrid, PersonSection, EntryCell, etc.) instead of one giant app.js
- Vite gives instant dev server and fast builds
- Tailwind avoids writing/maintaining a CSS file -- just use classes
- Vercel deploys automatically on every git push, zero config
- PWA makes it feel like a native app on iPhone -- home screen icon, no Safari chrome, works offline

### Project structure
```
family-tracker/
  public/
    manifest.json          -- PWA manifest
    icon-192.png           -- PWA icon
    icon-512.png           -- PWA icon
  src/
    main.jsx               -- entry point, renders App
    App.jsx                -- auth gate + router
    lib/
      supabase.js          -- Supabase client init
      weather.js           -- Open-Meteo fetch + cache
    hooks/
      useWeek.js           -- fetch/create/navigate weeks
      useEntries.js        -- CRUD for daily entries
      useAuth.js           -- auth state
    components/
      Auth.jsx             -- sign in / sign up
      WeekView.jsx         -- main screen: header + weather + person sections
      WeekNav.jsx          -- week navigation arrows, date display, jump to today
      PersonSection.jsx    -- collapsible section for one family member
      BeauGrid.jsx         -- Beau's subject-by-day grid
      LuciaGrid.jsx        -- Lucia's homework/specials/activities grid
      SimpleGrid.jsx       -- Niva/Allie/Patrick simpler rows
      EntryCell.jsx        -- single tappable cell in the grid
      EntrySheet.jsx       -- bottom sheet modal for add/edit entry
      CampView.jsx         -- summer camp planning table
      Settings.jsx         -- sign out, export, data management
      BottomNav.jsx        -- tab navigation
    sw.js                  -- service worker for offline/PWA
  index.html
  vite.config.js
  tailwind.config.js
  package.json
```

---

## Supabase Setup

Create a new Supabase project for this app (do NOT reuse the garden tracker project).

### Database Schema

```sql
-- Weeks
create table weeks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  notes text,
  created_at timestamptz default now(),
  unique(user_id, start_date)
);

-- Daily entries for each family member
create table entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  week_id uuid references weeks(id) on delete cascade not null,
  date date not null,
  person text not null,
  category text not null,
  content text,
  is_complete boolean default false,
  is_test boolean default false,
  day_number integer,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Indexes for fast queries
create index idx_entries_week on entries(week_id);
create index idx_entries_person_date on entries(person, date);

-- Vocab and spelling words (Lucia)
create table weekly_words (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  week_id uuid references weeks(id) on delete cascade not null,
  person text not null,
  word_type text not null,
  words text[],
  created_at timestamptz default now()
);

-- Summer camps
create table summer_camps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  week_name text,
  dates text,
  person text not null,
  camp_name text,
  is_registered boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- Recurring activities (for auto-populating new weeks)
create table recurring (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  person text not null,
  category text not null,
  day_of_week integer not null,  -- 0=Sunday, 1=Monday, ..., 6=Saturday
  content text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);
```

Enable RLS on all tables. Policy: users can only read/write/delete rows where user_id matches auth.uid().

### Supabase Client

```javascript
// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Store credentials in `.env.local` (not committed to git):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

And in Vercel environment variables for production.

---

## Family Members and Data Structure

### Beau (6th grade, Academy of the Holy Names)

Subjects tracked as separate rows, each with odd/even day indicators:
- Math (odd days: 1, 3, 5, 7)
- Science (even days: 2, 4, 6, 8)
- ELA (all days)
- Social Studies (even days)
- Spanish (even days)
- Religion (odd days)
- Activities/appointments (general row)

The school uses a rotating Day 1-8 schedule. Each school day has a day number that determines which classes meet. This day number should be visible in the column header and editable (sometimes the school skips or changes).

`person: "beau"`, `category`: one of `"math"`, `"science"`, `"ela"`, `"ss"`, `"spanish"`, `"religion"`, `"activities"`

### Lucia (elementary, Academy of the Holy Names)

Tracked in broader categories:
- Homework (general)
- Specials (auto-populated from rotating schedule based on day number)
- Activities/appointments
- Vocab words (weekly list)
- Spelling words (weekly list)

Specials rotation by day number:
- Day 1: Music/PE
- Day 2: Spanish, Science
- Day 3: Music/PE
- Day 4: Spanish
- Day 5: Library Research
- Day 6: Art & PE
- Day 7: (varies)
- Day 8: (varies)

`person: "lucia"`, `category`: one of `"homework"`, `"specials"`, `"activities"`

### Niva (younger child)

Simple tracking:
- Activities/appointments
- Notes

`person: "niva"`, `category`: one of `"activities"`, `"notes"`

### Allie (mom, teacher at AHN)

- Work schedule: "work", "off", "teach", "school"
- Events/notes

`person: "allie"`, `category`: one of `"work"`, `"events"`

### Patrick (dad)

- Schedule/appointments

`person: "patrick"`, `category`: one of `"schedule"`, `"notes"`

---

## Screens and Components

### 1. Week View (main screen, most important)

This is where 90% of the time is spent. It must be fast and scannable.

**WeekNav** (sticky top):
- Date range: "Mar 2 - 8, 2026"
- Left/right arrows to navigate weeks
- "Today" button to jump to current week
- "+" to create a new week (auto-creates from next Monday)

**Weather row**:
- One cell per day showing "82° / 62°" (high/low)
- Fetched from Open-Meteo, cached in localStorage by date range

**Person sections** (collapsible, tap header to expand/collapse):

Each person section has:
- Header bar with name and expand/collapse chevron
- Grid of rows (categories) x columns (days of the week)
- Column headers: abbreviated day name + date + day number (e.g., "Mon 3/2 D8")

**BeauGrid**: 7 rows (one per subject + activities) x 7 columns (Mon-Sun). Each cell shows truncated text of the entry. Tap to edit. Tests/quizzes have a colored dot indicator. Completed items are struck through and muted.

**LuciaGrid**: 3 rows (homework, specials, activities) + expandable vocab/spelling sections. Specials auto-fill based on day number.

**SimpleGrid** (for Niva, Allie, Patrick): 1-2 rows x 7 columns. Minimal.

**EntryCell** (the individual cell):
- Shows first ~30 chars of content, truncated
- Colored left border if it's a test/quiz
- Strikethrough + muted if complete
- Tap to open EntrySheet
- Empty cells show a subtle "+" on tap/hover

**EntrySheet** (bottom sheet / slide-up modal):
- Opens when you tap a cell
- Shows: person name, category, date at the top (read-only context)
- Text input for content (auto-focus, keyboard opens immediately)
- Toggle: "Test / Quiz" (highlights the cell)
- Toggle: "Complete" (strikes it through)
- Delete button (with confirm)
- Save button
- Tap outside or swipe down to dismiss (auto-saves)

### 2. Summer Camp View

Table layout:
- Rows: week name + date range
- Columns: Beau (camp + registered?), Lucia (camp + registered?), Niva (camp + registered?)
- Registered is a checkbox
- Tap camp name cell to edit
- Notes row per week

### 3. Settings

- Account email display
- Sign out
- Export current week (copy to clipboard as formatted text, or share)
- Manage recurring activities (add/edit/remove recurring items like "piano on Wednesday")
- Clear data

### Bottom Navigation

Three tabs: **Week** | **Camps** | **Settings**

---

## Design System

Mobile-first. Thumb-friendly tap targets (minimum 44px). Tested at 390px width (iPhone).

### Colors (Tailwind custom config)
```javascript
// tailwind.config.js
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1a2744',
        'navy-light': '#2a3a5c',
        slate: '#64748b',
        test: '#c4622d',        // terracotta for tests/quizzes
        complete: '#4a7c59',    // green for completed items
        today: '#eef2ff',       // subtle highlight for today's column
        weekend: '#f8f9fa',     // gray for weekend columns
      }
    }
  }
}
```

### Typography
- Font: Inter (from Google Fonts, excellent readability at small sizes)
- Grid cell text: 13px
- Section headers: 15px semibold
- Week title: 18px bold

### Grid Layout
- Use CSS Grid for the week table
- Sticky first column (category names) so they stay visible when scrolling horizontally on mobile
- Today's column highlighted with `today` background color
- Weekend columns with `weekend` background color
- Thin borders between cells (1px #e2e8f0)
- Category column width: ~90px (enough for "Science" etc.)
- Day columns: equal width, fill remaining space

### Interactions
- Tap cell -> EntrySheet slides up from bottom (like iOS action sheet)
- Swipe left/right on week view -> navigate weeks (use touch events, debounced)
- Tap section header -> collapse/expand with smooth animation
- Long press cell -> toggle complete (haptic feedback if available)
- Pull down on week view -> refresh weather

---

## Weather Integration

```javascript
// src/lib/weather.js
const TAMPA_LAT = 27.9506
const TAMPA_LNG = -82.4572

export async function fetchWeather(startDate, endDate) {
  const cached = localStorage.getItem(`weather_${startDate}`)
  if (cached) return JSON.parse(cached)

  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${TAMPA_LAT}&longitude=${TAMPA_LNG}&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=America/New_York&start_date=${startDate}&end_date=${endDate}`
  )
  const data = await res.json()

  const weather = data.daily.time.map((date, i) => ({
    date,
    high: Math.round(data.daily.temperature_2m_max[i]),
    low: Math.round(data.daily.temperature_2m_min[i]),
  }))

  localStorage.setItem(`weather_${startDate}`, JSON.stringify(weather))
  return weather
}
```

Display: "82° / 62°" per day in a row above the person sections.

---

## PWA Setup

### manifest.json
```json
{
  "name": "Albert's Family Tracker",
  "short_name": "Family Tracker",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a2744",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker
- Cache the app shell (HTML, JS, CSS) for offline access
- Cache weather responses with a 1-hour expiry
- Network-first strategy for Supabase data, fallback to cached
- Register in main.jsx

### iPhone install
- Add `<meta name="apple-mobile-web-app-capable" content="yes">` to index.html
- Add `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`
- Add apple-touch-icon link

---

## Vercel Deployment

### Setup (one-time)
1. Push repo to GitHub
2. Go to vercel.com, sign in with GitHub
3. Import the repo
4. Vercel auto-detects Vite, no config needed
5. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy

After setup, every `git push` auto-deploys.

### Custom domain (optional)
Add a custom domain in Vercel settings if desired.

---

## Key UX Principles

1. **Speed of entry is everything.** This app is used while looking at Canvas/school portals and typing homework with one thumb. Minimize taps. Auto-focus text input. Auto-save on dismiss.

2. **Scannability over beauty.** The spreadsheet works because you can glance at it and see the whole week. Preserve that. Don't hide info behind tabs or accordions unnecessarily.

3. **Today is special.** Always highlight today's column. When opening the app, auto-scroll to today if the week is wide.

4. **Tests are special.** Tests and quizzes need to visually pop (terracotta color, maybe a small icon). Missing a test is the worst failure mode.

5. **Recurring items save time.** Piano every Wednesday, dance every Thursday, etc. These should auto-populate when a new week is created, not re-entered every time.

6. **Offline works.** The app should load and show cached data even without internet. Sync when back online.

---

## Build Order

Build incrementally. Don't try to do everything at once.

### Phase 1: Foundation
- Vite + React + Tailwind setup
- Supabase auth (sign in/sign up)
- Basic WeekView with WeekNav
- Beau's grid only (subjects x days)
- EntrySheet for add/edit
- Push to GitHub, deploy to Vercel

### Phase 2: Full Family
- Add Lucia grid with specials auto-population
- Add Niva, Allie, Patrick simple grids
- Collapsible sections
- Weather row
- Mark complete functionality

### Phase 3: Polish
- PWA manifest + service worker
- Swipe navigation between weeks
- Today column highlight
- Test/quiz visual indicators
- Recurring activities management
- New week auto-population from recurring items

### Phase 4: Extras
- Summer camp view
- Export week as text
- Vocab/spelling word tracking for Lucia
- Offline support with sync

---

## Supabase Gotchas (learned from garden tracker)

- Use the anon key in the client, never the service role key
- If edge functions are needed later, use direct fetch (not sb.functions.invoke) due to JWT issues
- Email confirmation redirects to localhost by default -- fix in Auth > URL Configuration
- RLS policies must be set on every table or data is exposed
- Test that RLS works: one user should never see another user's data
