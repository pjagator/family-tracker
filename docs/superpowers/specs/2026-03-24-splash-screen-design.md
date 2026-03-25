# Splash Screen Design Spec

**Date:** 2026-03-24
**Status:** Approved

## Overview

Add a branded splash screen featuring the Alberts family poodles (Brownie and Ursa Minor) that covers all loading states and transitions smoothly into the calendar. The goal is to eliminate the jarring sequence of blank screen → "Loading..." → login flash → "Loading week..." and replace it with a single, joyful branded experience.

## Requirements

- Branded splash with illustrated SVG poodles (Brownie: chocolate, larger; Ursa Minor: black, smaller)
- Title text: "Alberts Family Tracker" (single line)
- Minimum 2-second display even if data loads faster
- Poodles bounce while loading, then run off-screen when ready
- Login form overlays the splash background when not authenticated
- Static version in index.html eliminates blank white screen on first paint
- Respects prefers-reduced-motion

## Components

### 1. SplashScreen.jsx (New)

A full-viewport component rendering:

- Navy background (#1a2744) filling the screen
- Two SVG poodles centered on screen:
  - Brownie (chocolate, larger) on the left
  - Ursa Minor (black, slightly smaller) on the right
  - Both bounce on loop (poodleBounce animation) while loading
- "Alberts Family Tracker" text below in white, bold

**Animation sequence when data is ready:**
1. Poodles stop bouncing
2. Brownie runs off to the left (poodleRunLeft, ~0.4s)
3. Ursa Minor runs off to the right (poodleRunRight, ~0.4s, simultaneous)
4. Background fades out (splashFadeOut, ~0.3s, 0.4s delay)
5. Component unmounts after animation completes

**Props:**
- `isReady: boolean` — all data loaded and min time elapsed
- `onComplete: () => void` — called after exit animation finishes

**Exit mechanism:** Uses `useRef` for both the exiting guard and the `onComplete` callback to prevent React re-renders from clearing the exit timer via useEffect cleanup. The `exiting` ref is checked (not state) to avoid re-triggering the effect; state is still set for CSS animation conditional rendering. Only `isReady` is a useEffect dependency.

### 2. App.jsx Changes

**New state:**
- `showSplash` (boolean, starts true)
- `minTimeElapsed` (boolean, starts false, set true after 2s timer)

**Loading logic:**
- All screens (Auth, FamilySetup, main app) render inside the main return block, behind the splash overlay (z-50)
- No early returns — this prevents auth race conditions where `getSession()` resolves before `onAuthStateChange` during token refresh, which could briefly flash the login screen to signed-in users
- `allDataReady` resolves to true once auth loading completes, regardless of auth state: no user (show login), user but no family (show setup), or full app ready (user + family + week loaded)
- `splashReady = allDataReady && minTimeElapsed` — once true, triggers the exit animation
- After SplashScreen calls `onComplete`, set `showSplash=false` to unmount it
- Main app content (tabs, entry sheet, nav) guarded by `user && family` to prevent crashes during loading

**Auth integration:**
- Auth renders conditionally inside the main return (`showAuth` flag) — behind the splash overlay
- Poodles visible behind the form at reduced opacity (~0.3), static (no bounce)
- "Alberts Family Tracker" text visible above the form
- On login success: splash continues its loading animation while family/week data fetches, then runs off when ready

**Removed:**
- The "Loading..." navy screen (old early return)
- All early returns from App.jsx — everything renders in the main return block behind the splash

### 3. index.html Static Splash

Add a static version of the splash inside `<div id="root">`:
- Navy background, "Alberts Family Tracker" text, simplified poodle SVGs (no animation)
- Shows immediately while JS bundle loads (~50-100ms)
- React replaces on mount — seamless because layout/colors are identical
- User never sees blank white screen

### 4. CSS Animations (index.css)

Four new keyframe animations:

1. **poodleBounce** — translateY(0) → translateY(-12px), 0.6s ease-in-out infinite alternate. Ursa Minor has 0.15s delay.
2. **poodleRunLeft** — translateX(0) → translateX(-120vw), 0.4s ease-in. Brownie exits left.
3. **poodleRunRight** — translateX(0) → translateX(120vw), 0.4s ease-in. Ursa Minor exits right.
4. **splashFadeOut** — opacity 1 → 0, 0.3s ease-out, 0.4s delay after run-off starts.

**Reduced motion:** All animations collapse to immediate fade-out, matching existing prefers-reduced-motion pattern in the codebase.

## Visual Style

- Poodle illustration style: cute SVG characters with fluffy puffs (ear puffs, top puff, leg puffs, tail puff)
- Brownie: fills using #8B5E3C (body) and #6D4C2A (puffs), dark eyes
- Ursa Minor: fills using #2a2a2a (body) and #1a1a1a (puffs), light eyes (#ddd)
- Brownie is larger, Ursa Minor is slightly smaller
- Both have visible nose, eyes with shine dots, and curled poodle tail with puff

## Approach

Pure CSS/SVG React component. No external dependencies. Matches existing codebase patterns (Tailwind + inline styles, SVG, CSS keyframes in index.css).

## Out of Scope

- Custom animation tooling (Lottie, Canvas)
- Per-user or per-family customization of the splash
- Sound effects
- Configurable splash duration
