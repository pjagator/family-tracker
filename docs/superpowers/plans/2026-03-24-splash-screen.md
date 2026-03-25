# Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers-extended-cc:subagent-driven-development (if subagents available) or superpowers-extended-cc:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a branded splash screen with animated poodle SVGs that covers all loading states and transitions smoothly into the calendar.

**Architecture:** New `SplashScreen.jsx` component renders full-viewport navy background with two SVG poodles (Brownie and Ursa Minor) that bounce while loading, then run off-screen when ready. `App.jsx` orchestrates splash visibility with a 2-second minimum timer. A static version in `index.html` eliminates blank white screen before React hydrates. Auth screen renders on top of the splash background.

**Tech Stack:** React, CSS keyframe animations, inline SVG, Tailwind CSS v4

**Spec:** `docs/superpowers/specs/2026-03-24-splash-screen-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/SplashScreen.jsx` | Create | SVG poodles, bounce animation, run-off exit sequence |
| `src/App.jsx` | Modify | Splash state management, loading flow integration, auth overlay |
| `src/components/Auth.jsx` | Modify | Remove own background, become transparent overlay |
| `src/index.css` | Modify | Add 4 new keyframe animations |
| `index.html` | Modify | Add static splash inside `#root` |

---

### Task 1: Add CSS Animations

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add the four splash keyframe animations to index.css**

Add these after the existing `slideRight` keyframes block (after line 44) and before the `@media (prefers-reduced-motion)` block:

```css
@keyframes poodleBounce {
  from { transform: translateY(0); }
  to { transform: translateY(-12px); }
}

@keyframes poodleRunLeft {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(-120vw); opacity: 1; }
}

@keyframes poodleRunRight {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(120vw); opacity: 1; }
}

@keyframes splashFadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
```

No new `--animate-*` theme tokens needed — these are applied via inline styles in the component since they're triggered conditionally.

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add splash screen CSS keyframe animations"
```

---

### Task 2: Create SplashScreen Component

**Files:**
- Create: `src/components/SplashScreen.jsx`

- [ ] **Step 1: Create SplashScreen.jsx**

```jsx
import { useState, useEffect } from 'react'

// Brownie SVG (chocolate poodle, larger)
function BrownieSvg() {
  return (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <ellipse cx="40" cy="60" rx="22" ry="18" fill="#8B5E3C"/>
      <circle cx="40" cy="32" r="16" fill="#8B5E3C"/>
      <circle cx="24" cy="28" r="10" fill="#6D4C2A"/>
      <circle cx="56" cy="28" r="10" fill="#6D4C2A"/>
      <circle cx="40" cy="18" r="10" fill="#6D4C2A"/>
      <ellipse cx="40" cy="38" rx="6" ry="4" fill="#7A5232"/>
      <circle cx="40" cy="36" r="2.5" fill="#2a1a0a"/>
      <circle cx="34" cy="30" r="2" fill="#2a1a0a"/>
      <circle cx="46" cy="30" r="2" fill="#2a1a0a"/>
      <circle cx="35" cy="29" r="0.8" fill="white"/>
      <circle cx="47" cy="29" r="0.8" fill="white"/>
      <rect x="26" y="72" width="7" height="14" rx="3" fill="#8B5E3C"/>
      <rect x="47" y="72" width="7" height="14" rx="3" fill="#8B5E3C"/>
      <circle cx="29" cy="82" r="5" fill="#6D4C2A"/>
      <circle cx="51" cy="82" r="5" fill="#6D4C2A"/>
      <path d="M62,55 Q75,40 68,28" stroke="#8B5E3C" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="68" cy="28" r="6" fill="#6D4C2A"/>
    </svg>
  )
}

// Ursa Minor SVG (black poodle, smaller)
function UrsaMinorSvg() {
  return (
    <svg width="65" height="75" viewBox="0 0 80 90">
      <ellipse cx="40" cy="60" rx="22" ry="18" fill="#2a2a2a"/>
      <circle cx="40" cy="32" r="16" fill="#2a2a2a"/>
      <circle cx="24" cy="28" r="10" fill="#1a1a1a"/>
      <circle cx="56" cy="28" r="10" fill="#1a1a1a"/>
      <circle cx="40" cy="18" r="10" fill="#1a1a1a"/>
      <ellipse cx="40" cy="38" rx="6" ry="4" fill="#222"/>
      <circle cx="40" cy="36" r="2.5" fill="#111"/>
      <circle cx="34" cy="30" r="2" fill="#ddd"/>
      <circle cx="46" cy="30" r="2" fill="#ddd"/>
      <circle cx="35" cy="29" r="0.8" fill="white"/>
      <circle cx="47" cy="29" r="0.8" fill="white"/>
      <rect x="26" y="72" width="7" height="14" rx="3" fill="#2a2a2a"/>
      <rect x="47" y="72" width="7" height="14" rx="3" fill="#2a2a2a"/>
      <circle cx="29" cy="82" r="5" fill="#1a1a1a"/>
      <circle cx="51" cy="82" r="5" fill="#1a1a1a"/>
      <path d="M62,55 Q75,40 68,28" stroke="#2a2a2a" strokeWidth="5" fill="none" strokeLinecap="round"/>
      <circle cx="68" cy="28" r="6" fill="#1a1a1a"/>
    </svg>
  )
}

export default function SplashScreen({ isReady, onComplete }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (isReady && !exiting) {
      setExiting(true)
      // Wait for run-off (0.4s) + fade (0.3s) to complete
      const timer = setTimeout(() => {
        onComplete()
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isReady, exiting, onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-navy"
      style={exiting ? {
        animation: 'splashFadeOut 0.3s ease-out 0.4s forwards',
      } : undefined}
    >
      {/* Poodles */}
      <div className="flex items-end gap-6">
        {/* Brownie - runs left on exit */}
        <div
          style={exiting
            ? { animation: 'poodleRunLeft 0.4s ease-in forwards' }
            : { animation: 'poodleBounce 0.6s ease-in-out infinite alternate' }
          }
        >
          <BrownieSvg />
          <div className="text-center text-[10px] font-semibold mt-0.5" style={{ color: '#c4956a' }}>
            Brownie
          </div>
        </div>

        {/* Ursa Minor - runs right on exit */}
        <div
          style={exiting
            ? { animation: 'poodleRunRight 0.4s ease-in forwards' }
            : { animation: 'poodleBounce 0.6s 0.15s ease-in-out infinite alternate' }
          }
        >
          <UrsaMinorSvg />
          <div className="text-center text-[10px] font-semibold mt-0.5 text-gray-500">
            Ursa Minor
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mt-6 text-center">
        <div className="text-white text-xl font-bold tracking-wide">
          Alberts Family Tracker
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds (component not yet rendered, just compiled).

- [ ] **Step 3: Commit**

```bash
git add src/components/SplashScreen.jsx
git commit -m "feat: create SplashScreen component with poodle SVGs and animations"
```

---

### Task 3: Integrate Splash into App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Add SplashScreen import and state management**

Update the React import to include `useEffect` (line 1):

```jsx
import { useState, useEffect } from 'react'
```

Add the SplashScreen import alongside the other component imports:

```jsx
import SplashScreen from './components/SplashScreen'
```

Inside the `App` function, after the existing `useState` calls (after line 32), add:

```jsx
const [showSplash, setShowSplash] = useState(true)
const [minTimeElapsed, setMinTimeElapsed] = useState(false)

useEffect(() => {
  const timer = setTimeout(() => setMinTimeElapsed(true), 2000)
  return () => clearTimeout(timer)
}, [])
```

- [ ] **Step 2: Replace loading gates and compute splash readiness**

Delete the old loading early return (current lines 82-90):

```jsx
// DELETE THIS BLOCK:
if (authLoading || (user && familyLoading)) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-white text-sm animate-pulse">Loading...</div>
      </div>
    </ToastProvider>
  )
}
```

Replace the `!user` and `!family` early returns (current lines 92-98) with:

```jsx
// Not logged in - show auth with splash background (no splash animation)
if (!authLoading && !user) {
  return (
    <ToastProvider>
      <Auth
        onSignIn={signIn}
        onSignUp={signUp}
        onSendOtp={sendOtp}
        onVerifyOtp={verifyOtp}
        onResetPassword={resetPassword}
      />
    </ToastProvider>
  )
}

// Family setup (after login, before splash ends)
if (!authLoading && user && !familyLoading && !family) {
  return <ToastProvider><FamilySetup onCreateFamily={createFamily} onJoinFamily={joinFamily} /></ToastProvider>
}
```

Then before the main `return`, compute readiness:

```jsx
const allDataReady = !authLoading && user && !familyLoading && family && !weekLoading
const splashReady = allDataReady && minTimeElapsed
```

**Key:** During `authLoading` or `familyLoading`, none of the early returns fire, so execution falls through to the main `return`. The splash overlay (z-50) covers the content beneath. The existing `weekLoading` ternary inside the main return handles displaying `"Loading week..."` underneath the splash — this is fine because the splash is opaque on top.

- [ ] **Step 3: Add SplashScreen overlay to the main render**

Add the SplashScreen component inside the main `return`, just inside the `<div className="min-h-screen bg-white">`:

```jsx
return (
  <ToastProvider>
  <div className="min-h-screen bg-white">
    {/* Splash screen overlay — covers everything with z-50 */}
    {showSplash && (
      <SplashScreen
        isReady={splashReady}
        onComplete={() => setShowSplash(false)}
      />
    )}

    {/* Everything below is UNCHANGED from the original */}
    {activeTab === 'week' && (
      <div className="animate-fadeIn">
        {weekLoading ? (
          <div className="bg-navy text-white px-4 py-8 text-center text-sm animate-pulse">Loading week...</div>
        ) : (
          <WeekView /* ... all existing props unchanged ... */ />
        )}
      </div>
    )}
    {/* ... rest of tabs, EntrySheet, BottomNav all unchanged ... */}
  </div>
  </ToastProvider>
)
```

Do NOT modify the existing `weekLoading` ternary — the splash's `fixed inset-0 z-50` overlay covers it during initial load, and it's still needed for subsequent week navigation after the splash is gone.

- [ ] **Step 4: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 5: Test manually in dev**

Run: `npm run dev`

Verify:
1. On fresh load (logged in): see navy screen with bouncing poodles for ~2 seconds, then poodles run off-screen and calendar appears
2. On subsequent week navigation: no splash, normal "Loading week..." shows if needed
3. On logout + re-login: auth screen shows, after login splash plays again

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: integrate splash screen into app loading flow"
```

---

### Task 4: Restyle Auth Screen with Splash Background

**Files:**
- Modify: `src/components/Auth.jsx`

- [ ] **Step 1: Update Auth.jsx to use splash-themed background with poodles**

Replace the outer wrapping `div` (line 77) and the title block (lines 79-80). The Auth component currently has its own `min-h-screen bg-navy` wrapper. Change it to include the poodle SVGs at reduced opacity behind the form.

Import the poodle SVGs from SplashScreen (they need to be exported). First, in `SplashScreen.jsx`, export the SVG components:

```jsx
export function BrownieSvg() { ... }
export function UrsaMinorSvg() { ... }
```

Then in `Auth.jsx`, import them:

```jsx
import { BrownieSvg, UrsaMinorSvg } from './SplashScreen'
```

Replace the outer wrapper (line 77 through line 80):

```jsx
<div className="min-h-screen bg-navy flex flex-col items-center justify-center p-6 relative overflow-hidden">
  {/* Background poodles at reduced opacity */}
  <div className="flex items-end gap-6 mb-6 opacity-30">
    <BrownieSvg />
    <UrsaMinorSvg />
  </div>

  {/* Title above the form card */}
  <div className="text-white text-xl font-bold tracking-wide mb-4">
    Alberts Family Tracker
  </div>

  <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-xl">
    {/* Remove old h1 and p title lines — they're now above the card */}
```

Remove these two lines that are now replaced:
```jsx
<h1 className="text-2xl font-bold text-navy text-center mb-1">Family Tracker</h1>
<p className="text-sm text-slate text-center mb-6">Alberts weekly planner</p>
```

Replace with just a small margin spacer or nothing (the tabs can start immediately):
```jsx
{/* Tabs */}
<div className="flex bg-gray-100 rounded-lg p-1 mb-5 gap-1">
```

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Test manually**

Run: `npm run dev`

Verify:
1. When not logged in: navy background, poodle silhouettes faintly visible behind/above the login card, "Alberts Family Tracker" text above
2. Login form is fully functional and readable
3. After login: splash animation plays normally

- [ ] **Step 4: Commit**

```bash
git add src/components/SplashScreen.jsx src/components/Auth.jsx
git commit -m "feat: restyle auth screen with poodle splash background"
```

---

### Task 5: Add Static Splash to index.html

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add static splash content inside the root div**

Replace the empty `<div id="root"></div>` (line 17) with a static splash that matches the SplashScreen layout. This shows immediately before JS loads:

```html
<div id="root">
  <!-- Static splash — replaced by React on hydration -->
  <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#1a2744">
    <div style="display:flex;align-items:flex-end;gap:24px">
      <svg width="80" height="90" viewBox="0 0 80 90">
        <ellipse cx="40" cy="60" rx="22" ry="18" fill="#8B5E3C"/>
        <circle cx="40" cy="32" r="16" fill="#8B5E3C"/>
        <circle cx="24" cy="28" r="10" fill="#6D4C2A"/>
        <circle cx="56" cy="28" r="10" fill="#6D4C2A"/>
        <circle cx="40" cy="18" r="10" fill="#6D4C2A"/>
        <ellipse cx="40" cy="38" rx="6" ry="4" fill="#7A5232"/>
        <circle cx="40" cy="36" r="2.5" fill="#2a1a0a"/>
        <circle cx="34" cy="30" r="2" fill="#2a1a0a"/>
        <circle cx="46" cy="30" r="2" fill="#2a1a0a"/>
        <rect x="26" y="72" width="7" height="14" rx="3" fill="#8B5E3C"/>
        <rect x="47" y="72" width="7" height="14" rx="3" fill="#8B5E3C"/>
        <circle cx="29" cy="82" r="5" fill="#6D4C2A"/>
        <circle cx="51" cy="82" r="5" fill="#6D4C2A"/>
        <path d="M62,55 Q75,40 68,28" stroke="#8B5E3C" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="68" cy="28" r="6" fill="#6D4C2A"/>
      </svg>
      <svg width="65" height="75" viewBox="0 0 80 90">
        <ellipse cx="40" cy="60" rx="22" ry="18" fill="#2a2a2a"/>
        <circle cx="40" cy="32" r="16" fill="#2a2a2a"/>
        <circle cx="24" cy="28" r="10" fill="#1a1a1a"/>
        <circle cx="56" cy="28" r="10" fill="#1a1a1a"/>
        <circle cx="40" cy="18" r="10" fill="#1a1a1a"/>
        <ellipse cx="40" cy="38" rx="6" ry="4" fill="#222"/>
        <circle cx="40" cy="36" r="2.5" fill="#111"/>
        <circle cx="34" cy="30" r="2" fill="#ddd"/>
        <circle cx="46" cy="30" r="2" fill="#ddd"/>
        <rect x="26" y="72" width="7" height="14" rx="3" fill="#2a2a2a"/>
        <rect x="47" y="72" width="7" height="14" rx="3" fill="#2a2a2a"/>
        <circle cx="29" cy="82" r="5" fill="#1a1a1a"/>
        <circle cx="51" cy="82" r="5" fill="#1a1a1a"/>
        <path d="M62,55 Q75,40 68,28" stroke="#2a2a2a" stroke-width="5" fill="none" stroke-linecap="round"/>
        <circle cx="68" cy="28" r="6" fill="#1a1a1a"/>
      </svg>
    </div>
    <div style="margin-top:24px;color:white;font-size:20px;font-weight:700;letter-spacing:0.5px;font-family:Inter,sans-serif">
      Alberts Family Tracker
    </div>
  </div>
</div>
```

React's `createRoot` will replace this content on mount, so there's no conflict.

- [ ] **Step 2: Verify build succeeds**

Run: `npm run build`
Expected: Build succeeds. Opening `dist/index.html` directly in a browser should show the static splash.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add static splash to index.html for instant first paint"
```

---

### Task 6: Bump Service Worker Cache

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Bump the cache version**

The service worker caches the app shell. After changing `index.html` and adding new components, the cache version must be bumped so returning users get the new splash screen. Find the `CACHE_VERSION` or cache name string in `public/sw.js` and increment it.

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "chore: bump service worker cache version for splash screen"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Full build check**

Run: `npm run build`
Expected: Clean build, no warnings.

- [ ] **Step 2: Dev server end-to-end test**

Run: `npm run dev`

Test these scenarios:
1. **Fresh load (logged in):** Static splash → animated splash (bouncing poodles) → poodles run off → calendar
2. **Fresh load (logged out):** Static splash → auth screen with faded poodles background → login → splash animation → calendar
3. **Week navigation:** No splash, normal loading behavior
4. **Reduced motion:** Enable `prefers-reduced-motion` in dev tools → splash should fade without bouncing/running
5. **Mobile viewport:** Splash and auth screen look correct at 375px width

- [ ] **Step 3: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix: splash screen polish from manual testing"
```
