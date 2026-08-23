# Alberts Family Weekly Tracker

Mobile-first PWA replacing the family homework/activity spreadsheet. Tampa, FL family:
three kids (Beau, Lucia, Niva) at Academy of the Holy Names + parents (Allie, Patrick).
Primary device: iPhone Safari (390px), installed as PWA. Used one-thumbed while reading
Canvas — speed of entry beats everything else.

## Stack

React 19 + Vite, Tailwind v4 (via @tailwindcss/vite, no config file), Supabase
(auth + Postgres + realtime), Vercel (auto-deploy on push), Open-Meteo weather (no key).

Commands: `npm run dev` | `npm run build` | `npm run lint`
Env: `.env.local` needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (also set in Vercel).

## Architecture (current, do not trust old specs)

- `src/App.jsx` — auth gate, tab state, splash, EntrySheet host
- `src/components/WeekGrid.jsx` — THE main screen. Renders all five people from its
  `PEOPLE` array (rows/colors/emoji per person), day-number picker, no-school toggles,
  Lucia's specials rotation, Beau's odd/even dimming. There are no per-person grid
  components; everything lives here.
- `src/components/EntrySheet.jsx` — bottom-sheet editor (auto-focus, auto-save on dismiss)
- `src/hooks/useWeek.js` — week load/create, day numbers (rotating 1–8), no-school,
  recurring auto-population, week navigation
- `src/hooks/useEntries.js` — entries CRUD + realtime subscription (reload on change)
- `public/sw.js` — hand-rolled service worker. Bump CACHE_VERSION on any SW change.

## Database schema (actual — family-scoped, NOT user-scoped)

- `families` (id, name, invite_code, created_by)
- `family_members` (family_id, user_id, role 'owner'|'member') — one family per user
- `weeks` (id, family_id, start_date, end_date, day_numbers jsonb {date: 1-8},
  global_no_school text[], person_no_school jsonb {person: [dates]})
- `entries` (id, family_id, week_id, date, person, category, content,
  is_complete, is_test, day_number, sort_order)
- `weekly_words` (family_id, week_id, person, word_type 'vocab'|'spelling', words text[])
- `summer_camps` (family_id, week_name, dates, person, camp_name, is_registered, notes)
- `recurring` (family_id, person, category, day_of_week 0-6, content, is_active,
  start_date, end_date)

RLS on every table scopes rows to the user's family via family_members. Use the anon
key client-side, never service role.

## Domain rules

- People/categories: beau (math, science, ela, ss, spanish, religion, activities),
  lucia (homework, specials, activities), niva (activities, notes),
  allie (work, events), patrick (schedule, notes)
- School runs a rotating Day 1–8 schedule (weekdays only). Beau: odd days = math,
  religion; even days = science, ss, spanish; ela/activities always. Lucia's specials
  auto-fill from day number (SPECIALS_ROTATION in WeekGrid).
- Day numbers carry over from the previous week and skip global no-school days.
- New/current/future weeks auto-populate from `recurring`; past weeks are skipped.

## Conventions and gotchas

- Dates are LOCAL YYYY-MM-DD strings everywhere. Never use toISOString() for dates —
  it is UTC and flips to tomorrow after 8pm Eastern. Use the formatDate helper pattern.
- Weather: localStorage cache (1hr expiry, forever for past weeks); SW is network-first
  for open-meteo — keep it that way or the forecast goes stale.
- Splash: 2s on cold start only, 400ms after (sessionStorage `ft_splash_seen`).
- Tests/quizzes must visually pop (terracotta); today's column always highlighted.
- Mobile rules: 44px touch targets, 16px font minimum on inputs (iOS zoom), no
  horizontal page scroll (grid scrolls in its own container), safe-area-inset-bottom
  on bottom nav. Walk any new UI at 390px before presenting.
- Full design rules live in STYLE-GUIDE.md — read it before UI work.
- Supabase email redirects default to localhost — configured under Auth > URL Configuration.
