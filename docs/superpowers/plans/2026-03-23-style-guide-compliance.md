# Style Guide Compliance + Recurring Items Fix — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers-extended-cc:subagent-driven-development (if subagents available) or superpowers-extended-cc:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the Family Tracker app into compliance with STYLE-GUIDE.md and fix recurring items not populating the calendar.

**Architecture:** Seven independent-ish tasks: toast infrastructure first (unblocks error handling), then swipe-to-dismiss and recurring fix in parallel, then a systematic sweep of transitions/typography/empty-states/touch-targets.

**Tech Stack:** React 18, Tailwind CSS v4, Supabase (auth + Postgres), Vite

**Spec:** `docs/superpowers/specs/2026-03-23-style-guide-compliance-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/components/ToastContext.jsx` | Create | Toast component, React context + useToast hook |
| `src/hooks/useSwipeDismiss.js` | Create | Touch gesture hook for bottom sheets |
| `src/components/EntrySheet.jsx` | Modify | Swipe-to-dismiss, typography, spacing |
| `src/components/Auth.jsx` | Modify | Friendly error messages via toast |
| `src/components/FamilySetup.jsx` | Modify | Friendly error messages via toast |
| `src/components/CampView.jsx` | Modify | Toast, transitions, typography, empty state |
| `src/components/WordList.jsx` | Modify | Toast, transitions, typography, empty state |
| `src/components/RecurringManager.jsx` | Modify | Toast, transitions, typography, empty state, date range |
| `src/components/BottomNav.jsx` | Modify | Typography, spacing |
| `src/components/PersonSection.jsx` | Modify | Typography, spacing |
| `src/components/WeekGrid.jsx` | Modify | Transitions, contrast, touch targets |
| `src/components/EntryCell.jsx` | Modify | Contrast |
| `src/components/WeatherRow.jsx` | Modify | Contrast, touch targets |
| `src/App.jsx` | Modify | Toast provider, tab cross-fade, loading polish |
| `src/index.css` | Modify | User-select base, animation timing, pulse animation |
| `src/hooks/useWeek.js` | Modify | Recurring populate on every week load |
| `src/hooks/useRecurring.js` | Modify | start_date/end_date support |
| `STYLE-GUIDE.md` | Modify | Add grid exception |

---

### Task 1: Toast System (Task #4)

**Files:**
- Create: `src/components/ToastContext.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/Auth.jsx`
- Modify: `src/components/FamilySetup.jsx`
- Modify: `src/components/EntrySheet.jsx`
- Modify: `src/components/CampView.jsx`
- Modify: `src/components/WordList.jsx`
- Modify: `src/components/RecurringManager.jsx`

- [ ] **Step 1: Create ToastContext.jsx**

```jsx
// src/components/ToastContext.jsx
import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timeoutRef = useRef(null)

  const showToast = useCallback(({ message, type = 'info' }) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToast({ message, type })
    timeoutRef.current = setTimeout(() => setToast(null), 4000)
  }, [])

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToast(null)
  }, [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {toast && (
        <div
          onClick={dismiss}
          className={`fixed left-4 right-4 bottom-20 z-[35] px-4 py-3 rounded-lg text-sm font-medium text-white text-center shadow-lg animate-slideUp transition cursor-pointer ${
            toast.type === 'success' ? 'bg-complete'
            : toast.type === 'error' ? 'bg-test'
            : 'bg-gray-700'
          }`}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
```

- [ ] **Step 2: Wrap App in ToastProvider**

In `src/App.jsx`, add import and wrap the return:

```jsx
// Add import at top
import { ToastProvider } from './components/ToastContext'

// Wrap the outermost return in App():
// Before: return (<div className="min-h-screen bg-white">...)
// After:
return (
  <ToastProvider>
    <div className="min-h-screen bg-white">
      {/* ...existing content... */}
    </div>
  </ToastProvider>
)
```

Also wrap every early return in `<ToastProvider>`:

```jsx
if (authLoading || (user && familyLoading)) {
  return (
    <ToastProvider>
      <div className="min-h-screen flex items-center justify-center bg-navy">
        <div className="text-white text-sm animate-pulse">Loading...</div>
      </div>
    </ToastProvider>
  )
}

if (!user) {
  return <ToastProvider><Auth onSignIn={signIn} onSignUp={signUp} onSendOtp={sendOtp} onVerifyOtp={verifyOtp} onResetPassword={resetPassword} /></ToastProvider>
}

if (!family) {
  return <ToastProvider><FamilySetup onCreateFamily={createFamily} onJoinFamily={joinFamily} /></ToastProvider>
}
```

- [ ] **Step 3: Replace raw error.message in Auth.jsx**

Replace all `setError(error.message)` with friendly messages. Remove the `error` state and `{error && ...}` display — use toasts instead:

```jsx
import { useToast } from './ToastContext'

// Inside component:
const showToast = useToast()

// handleSignIn:
if (error) showToast({ message: 'Invalid email or password.', type: 'error' })

// handleSignUp:
if (error) showToast({ message: 'Could not create account. Try a different email.', type: 'error' })
else showToast({ message: 'Account created! You can now sign in.', type: 'success' })

// handleSendCode:
if (error) showToast({ message: 'Could not send code. Check your email address.', type: 'error' })
// success message stays inline (setMessage) since user needs to see it while entering code

// handleVerifyCode:
if (error) showToast({ message: 'Invalid code. Please try again.', type: 'error' })

// handleReset:
if (error) showToast({ message: 'Could not send reset link. Check your email.', type: 'error' })
else showToast({ message: 'Reset link sent! Check your email.', type: 'success' })
```

Remove the `{error && <p>...}` at the bottom. Keep `{message && ...}` for the inline OTP/reset messages.

- [ ] **Step 4: Replace raw error.message in FamilySetup.jsx**

```jsx
import { useToast } from './ToastContext'

const showToast = useToast()

// handleCreate:
if (error) showToast({ message: 'Could not create family. Please try again.', type: 'error' })

// handleJoin:
if (error) showToast({ message: 'Invalid invite code. Check and try again.', type: 'error' })
```

Remove `{error && ...}` display.

- [ ] **Step 5: Add success toasts to EntrySheet, CampView, WordList, RecurringManager**

Each file: `import { useToast } from './ToastContext'`, call `const showToast = useToast()`, add toast after successful operations:

- **EntrySheet.jsx** `handleSave`: add `showToast({ message: 'Entry saved', type: 'success' })` before `onClose()`
- **CampView.jsx** `handleAddWeek`: add `showToast({ message: 'Camp week added', type: 'success' })`
- **WordList.jsx** `handleSave`: add `showToast({ message: 'Words saved', type: 'success' })`
- **RecurringManager.jsx** `handleSubmit`: add `showToast({ message: 'Recurring item added', type: 'success' })`

- [ ] **Step 6: Add double-tap guard to CampView delete**

In `CampView.jsx`, add a `deleting` state and disable the delete button while deleting:

```jsx
const [deleting, setDeleting] = useState(false)

const handleDeleteWeek = async (weekData) => {
  if (!confirm(`Delete "${weekData.week_name}" and all camp entries?`)) return
  setDeleting(true)
  for (const person of CHILDREN) {
    if (weekData.camps[person]) await onRemove(weekData.camps[person].id)
  }
  setDeleting(false)
}

// On the delete button: add disabled={deleting}
```

- [ ] **Step 7: Build and verify**

Run: `npx vite build`
Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/ToastContext.jsx src/App.jsx src/components/Auth.jsx src/components/FamilySetup.jsx src/components/EntrySheet.jsx src/components/CampView.jsx src/components/WordList.jsx src/components/RecurringManager.jsx
git commit -m "feat: add toast notification system and friendly error messages"
```

---

### Task 2: Swipe-to-Dismiss on EntrySheet (Task #5)

**Files:**
- Create: `src/hooks/useSwipeDismiss.js`
- Modify: `src/components/EntrySheet.jsx`

- [ ] **Step 1: Create useSwipeDismiss.js**

```jsx
// src/hooks/useSwipeDismiss.js
import { useRef, useCallback } from 'react'

export function useSwipeDismiss({ onDismiss, threshold = 0.3 }) {
  const sheetRef = useRef(null)
  const startY = useRef(null)
  const currentY = useRef(0)
  const isDragging = useRef(false)

  const onTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY
    isDragging.current = false
  }, [])

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return
    const dy = e.touches[0].clientY - startY.current
    if (dy < 0) return // only allow downward drag
    // Only activate swipe when sheet is scrolled to top (avoid conflict with scroll)
    if (sheetRef.current && sheetRef.current.scrollTop > 0 && !isDragging.current) return

    isDragging.current = true
    currentY.current = dy
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${dy}px)`
      sheetRef.current.style.transition = 'none'
    }
  }, [])

  const onTouchEnd = useCallback(() => {
    if (startY.current === null) return
    startY.current = null

    if (!isDragging.current) return

    const el = sheetRef.current
    if (!el) return
    const sheetHeight = el.offsetHeight
    const pct = currentY.current / sheetHeight

    if (pct > threshold) {
      // Dismiss: animate off screen
      el.style.transition = 'transform 250ms ease-in'
      el.style.transform = `translateY(100%)`
      setTimeout(() => {
        el.style.transform = ''
        el.style.transition = ''
        onDismiss()
      }, 250)
    } else {
      // Snap back
      el.style.transition = 'transform 200ms ease-out'
      el.style.transform = 'translateY(0)'
      setTimeout(() => {
        el.style.transition = ''
      }, 200)
    }
    currentY.current = 0
    isDragging.current = false
  }, [onDismiss, threshold])

  return { sheetRef, onTouchStart, onTouchMove, onTouchEnd }
}
```

- [ ] **Step 2: Integrate into EntrySheet.jsx**

```jsx
import { useSwipeDismiss } from '../hooks/useSwipeDismiss'

// Inside component, before the return:
const { sheetRef, onTouchStart, onTouchMove, onTouchEnd } = useSwipeDismiss({
  onDismiss: handleSave,
})

// On the sheet div (the one with className="fixed bottom-0..."):
<div
  ref={sheetRef}
  onTouchStart={onTouchStart}
  onTouchMove={onTouchMove}
  onTouchEnd={onTouchEnd}
  className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl animate-slideUp max-h-[80vh] overflow-y-auto"
>
  {/* Drag handle */}
  <div className="flex justify-center pt-3 pb-1">
    <div className="w-10 h-1 rounded-full bg-gray-300" />
  </div>
  <div className="p-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
    {/* ...existing content... */}
  </div>
</div>
```

- [ ] **Step 3: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useSwipeDismiss.js src/components/EntrySheet.jsx
git commit -m "feat: add swipe-to-dismiss gesture on EntrySheet"
```

---

### Task 3: Transitions, User-Select, Contrast (Task #6)

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/EntryCell.jsx`
- Modify: `src/components/WeatherRow.jsx`
- Modify: `src/components/WordList.jsx`
- Modify: `src/components/WeekGrid.jsx`
- Modify: All component files with `active:` states missing `transition`

- [ ] **Step 1: Add user-select base style to index.css**

After the `@media (prefers-reduced-motion)` block in `src/index.css`, add:

```css
button, [role="button"] {
  user-select: none;
  -webkit-user-select: none;
}
```

- [ ] **Step 2: Add `transition` to all interactive elements missing it**

Search every `.jsx` file for `active:` classes without a `transition` class on the same element. Add `transition` to each. Key files:

- **CampView.jsx**: "+ Add week" button (line 58), "Add week" button (line 83), Delete button (line 107), camp name button (line 136), checkbox label (line 142)
- **RecurringManager.jsx**: "+ Add" button (line 54), delete button (line 130), submit button (line 104)
- **WordList.jsx**: Edit/Add button (line 36), word chip buttons (line 74)
- **WeekGrid.jsx**: day number picker button (line 242), picker number buttons (line 263), No School button (line 275), Clear button (line 286), person Out toggle (line 353), Teach/Off buttons (lines 411, 419)
- **WeekNav.jsx**: left arrow (line 12), Today button (line 15), right arrow (line 19)
- **BottomNav.jsx**: already has `transition-colors`, OK
- **FamilySetup.jsx**: Back buttons (lines 76, 104) — add `active:text-navy transition`
- **PersonSection.jsx**: already has `transition`, OK

- [ ] **Step 3: Fix contrast violations**

Replace `text-gray-300` with `text-gray-400` on white/light backgrounds:

- **EntryCell.jsx:46**: `text-gray-300` → `text-gray-400` (the "+" placeholder)
- **WeatherRow.jsx:33**: `text-gray-300` → `text-gray-400` (loading "...")
- **WeatherRow.jsx:41**: `text-gray-300` → `text-gray-400` (empty "--")
- **WordList.jsx:91**: `text-gray-300` → `text-gray-400` ("No words this week")
- **CampView.jsx:138**: `text-gray-300` → `text-gray-400` ("Tap to add camp")

- [ ] **Step 4: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/index.css src/components/EntryCell.jsx src/components/WeatherRow.jsx src/components/WordList.jsx src/components/CampView.jsx src/components/WeekGrid.jsx src/components/WeekNav.jsx src/components/FamilySetup.jsx src/components/RecurringManager.jsx
git commit -m "fix: add transitions to all interactive elements, user-select, contrast fixes"
```

---

### Task 4: Typography and Spacing (Task #7)

**Files:**
- Modify: `src/components/EntrySheet.jsx`
- Modify: `src/components/PersonSection.jsx`
- Modify: `src/components/BottomNav.jsx`
- Modify: `src/components/CampView.jsx`
- Modify: `src/components/RecurringManager.jsx`
- Modify: `src/components/WordList.jsx`
- Modify: `src/App.jsx` (settings section)

**Grid exception — DO NOT touch:** WeekGrid.jsx, EntryCell.jsx, WeatherRow.jsx, WeekNav.jsx

- [ ] **Step 1: Fix typography**

Apply these replacements in each file (use find/replace):

- **EntrySheet.jsx**: `text-[15px]` → `text-base` (line 72), `text-[11px]` → `text-xs` (line 80)
- **PersonSection.jsx**: `text-[15px]` → `text-base`
- **BottomNav.jsx**: `text-[11px]` → `text-xs`
- **CampView.jsx**: `text-[11px]` → `text-xs`, `text-[12px]` → `text-xs`
- **RecurringManager.jsx**: `text-[11px]` → `text-xs`
- **WordList.jsx**: `text-[11px]` → `text-xs`, `text-[12px]` → `text-xs`, `text-[13px]` → `text-sm`, `text-[10px]` → `text-xs`
- **App.jsx** line 140: `text-[11px]` → `text-xs`

- [ ] **Step 2: Fix spacing**

- **EntrySheet.jsx**: `py-2.5` → `py-2` (textarea)
- **PersonSection.jsx**: `py-2.5` → `py-3`
- **BottomNav.jsx**: `gap-0.5` → `gap-1`, `py-1.5` → `py-2`
- **CampView.jsx**: `gap-1.5` → `gap-2` (checkbox label), `py-2.5` → `py-3` (child rows)
- **RecurringManager.jsx**: `py-1.5` → `py-2` (item rows)
- **WordList.jsx**: `space-y-1.5` → `space-y-2`, `gap-1.5` → `gap-2`, `py-1.5` → `py-2` (buttons)

- [ ] **Step 3: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/EntrySheet.jsx src/components/PersonSection.jsx src/components/BottomNav.jsx src/components/CampView.jsx src/components/RecurringManager.jsx src/components/WordList.jsx src/App.jsx
git commit -m "fix: normalize typography to type scale and spacing to 4px grid"
```

---

### Task 5: Empty States, Loading Polish, Animations (Task #8)

**Files:**
- Modify: `src/components/CampView.jsx`
- Modify: `src/components/RecurringManager.jsx`
- Modify: `src/components/WordList.jsx`
- Modify: `src/index.css`
- Modify: `src/App.jsx`

- [ ] **Step 1: Add empty states**

**CampView.jsx** — replace the current empty state (lines 90-94):

```jsx
{weeks.length === 0 && !showAdd && (
  <div className="py-12 text-center">
    <div className="text-3xl mb-3">🏕️</div>
    <div className="text-xl font-semibold text-navy mb-1">No camps planned yet</div>
    <div className="text-sm text-gray-500 mb-4">Add a summer camp week to get started</div>
    <button
      onClick={() => setShowAdd(true)}
      className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium active:scale-[0.98] transition"
    >
      + Add week
    </button>
  </div>
)}
```

**RecurringManager.jsx** — replace empty state (lines 111-113):

```jsx
{items.length === 0 && !showForm && (
  <div className="py-8 text-center">
    <div className="text-2xl mb-2">🔄</div>
    <div className="text-xl font-semibold text-navy mb-1">No recurring items</div>
    <div className="text-sm text-gray-500">Add items that repeat every week</div>
  </div>
)}
```

**WordList.jsx** — replace empty state (line 91):

```jsx
<p className="text-xs text-gray-400 py-2">No words this week — tap Edit to add</p>
```

- [ ] **Step 2: Polish loading states in App.jsx**

Note: Tailwind v4 already provides `animate-pulse` as a built-in utility — no custom keyframe needed.

Replace the auth loading state (lines 82-86):

```jsx
<div className="min-h-screen flex items-center justify-center bg-navy">
  <div className="text-white text-sm animate-pulse">Loading...</div>
</div>
```

Replace the week loading state (line 102):

```jsx
<div className="bg-navy text-white px-4 py-8 text-center text-sm animate-pulse">Loading week...</div>
```

- [ ] **Step 3: Fix slideUp animation timing**

In `src/index.css`, change:
```css
--animate-slideUp: slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1);
```
to:
```css
--animate-slideUp: slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1);
```

- [ ] **Step 4: Add tab cross-fade in App.jsx**

`fadeIn` keyframe and `--animate-fadeIn` theme variable already exist in `index.css`. Wrap each tab section:

```jsx
{activeTab === 'week' && (
  <div className="animate-fadeIn">
    {/* ...existing week content... */}
  </div>
)}

{activeTab === 'camps' && (
  <div className="animate-fadeIn">
    <CampView ... />
  </div>
)}

{activeTab === 'settings' && (
  <div className="animate-fadeIn">
    {/* ...existing settings content... */}
  </div>
)}
```

- [ ] **Step 5: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/CampView.jsx src/components/RecurringManager.jsx src/components/WordList.jsx src/index.css src/App.jsx
git commit -m "feat: add designed empty states, loading polish, tab cross-fade"
```

---

### Task 6: Touch Targets and Style Guide Update (Task #9)

**Files:**
- Modify: `src/components/WeekGrid.jsx`
- Modify: `src/components/WeatherRow.jsx`
- Modify: `src/components/WordList.jsx`
- Modify: `STYLE-GUIDE.md`

- [ ] **Step 1: Fix Allie Teach/Off button touch targets**

In `src/components/WeekGrid.jsx`, find the Teach and Off buttons (they have `min-h-[28px]`). Change to `min-h-[44px]`:

```jsx
// Teach button: change min-h-[28px] to min-h-[44px]
className={`text-[10px] font-medium px-2 py-1 rounded-full transition min-h-[44px] ${...}`}

// Off button: same change
className={`text-[10px] font-medium px-2 py-1 rounded-full transition min-h-[44px] ${...}`}
```

- [ ] **Step 2: Fix WeatherRow touch targets**

In `src/components/WeatherRow.jsx`, change `min-h-[32px]` to `min-h-[44px]`:

```jsx
className="bg-gray-50/50 border border-slate-300 p-1 text-center text-[11px] text-slate flex items-center justify-center min-h-[44px]"
```

- [ ] **Step 3: Fix WordList chip touch targets**

In `src/components/WordList.jsx`, add more vertical padding to word chips. Change `py-1` to `py-2`:

```jsx
className={`text-xs px-3 py-2 rounded-full transition-colors ${...}`}
```

- [ ] **Step 4: Update STYLE-GUIDE.md**

Add after the Typography section (after the closing `---` of that section):

```markdown
### Grid Exception

WeekGrid, EntryCell, WeatherRow, and WeekNav may use arbitrary font sizes below text-xs (12px) for information density. These components are exempt from the typography scale but must still follow all other style guide rules (touch targets, transitions, contrast, etc.).
```

- [ ] **Step 5: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/WeekGrid.jsx src/components/WeatherRow.jsx src/components/WordList.jsx STYLE-GUIDE.md
git commit -m "fix: touch targets to 44px minimum, add grid exception to style guide"
```

---

### Task 7: Fix Recurring Items (Task #11)

**Files:**
- Modify: `src/hooks/useRecurring.js`
- Modify: `src/hooks/useWeek.js`
- Modify: `src/components/RecurringManager.jsx`

**Prerequisite:** Add `start_date` (date, nullable) and `end_date` (date, nullable) columns to the `recurring` table in Supabase dashboard. Run this SQL in the SQL editor:

```sql
ALTER TABLE recurring ADD COLUMN start_date date;
ALTER TABLE recurring ADD COLUMN end_date date;
```

- [ ] **Step 1: Update useRecurring.js to support date fields**

Modify the `add` function to include start_date and end_date:

```jsx
const add = async (item) => {
  const { error } = await supabase.from('recurring').insert({
    family_id: familyId,
    person: item.person,
    category: item.category,
    day_of_week: item.day_of_week,
    content: item.content,
    start_date: item.start_date || null,
    end_date: item.end_date || null,
  })
  if (error) return { error }
  await load()
  return { error: null }
}
```

- [ ] **Step 2: Add date fields to RecurringManager.jsx form**

Add state for dates:

```jsx
const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0])
const [endDate, setEndDate] = useState('')
```

Add date inputs after the existing day/content row:

```jsx
<div className="flex gap-2">
  <div className="flex-1">
    <label className="text-xs text-gray-500 mb-0.5 block">Start date</label>
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="w-full px-2 py-2 border border-gray-200 rounded text-sm"
    />
  </div>
  <div className="flex-1">
    <label className="text-xs text-gray-500 mb-0.5 block">End date (optional)</label>
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="w-full px-2 py-2 border border-gray-200 rounded text-sm"
    />
  </div>
</div>
```

Update handleSubmit to pass dates:

```jsx
await onAdd({
  person, category, day_of_week: dayOfWeek, content: content.trim(),
  start_date: startDate || null,
  end_date: endDate || null,
})
```

Reset dates on submit:

```jsx
setStartDate(new Date().toISOString().split('T')[0])
setEndDate('')
```

- [ ] **Step 3: Display date range on recurring item rows**

In the item display section, add date range after the category label:

```jsx
<span className="text-gray-400 text-xs ml-1">
  ({item.category})
  {' · '}
  {item.start_date
    ? new Date(item.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  {item.end_date
    ? ` – ${new Date(item.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : ' onwards'
  }
</span>
```

- [ ] **Step 4: Fix recurring populate in useWeek.js — move to run on every week load**

After the existing week is loaded (after line 181 `} else if (error) {...}` block, before `setWeek(data)`), add recurring populate logic for existing weeks:

```jsx
// After line 181, before setWeek(data):
// Auto-populate recurring for existing weeks (today + future dates only)
const today = formatDate(new Date())
const { data: recurring } = await supabase
  .from('recurring')
  .select('*')
  .eq('family_id', familyId)
  .eq('is_active', true)

if (recurring?.length) {
  // Get existing entries for this week to avoid duplicates
  const { data: existingEntries } = await supabase
    .from('entries')
    .select('person, category, date')
    .eq('week_id', data.id)

  const existingSet = new Set(
    (existingEntries || []).map(e => `${e.person}|${e.category}|${e.date}`)
  )

  const autoEntries = []
  for (const item of recurring) {
    const effectiveStart = item.start_date || (item.created_at ? item.created_at.split('T')[0] : '2000-01-01')
    const effectiveEnd = item.end_date || '9999-12-31'

    const matchDate = dates.find(d =>
      new Date(d + 'T00:00:00').getDay() === item.day_of_week
      && d >= today
      && d >= effectiveStart
      && d <= effectiveEnd
    )
    if (matchDate && !existingSet.has(`${item.person}|${item.category}|${matchDate}`)) {
      autoEntries.push({
        family_id: familyId,
        week_id: data.id,
        date: matchDate,
        person: item.person,
        category: item.category,
        content: item.content,
      })
    }
  }
  if (autoEntries.length) {
    await supabase.from('entries').insert(autoEntries)
  }
}
```

Also update the existing new-week populate block (lines 149-176) to add date range filtering. In that block, inside the `for (const item of recurring)` loop, add before `const matchDate`:

```jsx
const effectiveStart = item.start_date || (item.created_at ? item.created_at.split('T')[0] : '2000-01-01')
const effectiveEnd = item.end_date || '9999-12-31'
```

And change the `matchDate` line to also filter by range:

```jsx
const matchDate = dates.find(d =>
  new Date(d + 'T00:00:00').getDay() === item.day_of_week
  && d >= effectiveStart
  && d <= effectiveEnd
)
```

**Important: Triggering entries reload.** After auto-populating recurring entries on an existing week, the `useEntries` hook won't automatically see the new rows. To fix this, have `loadOrCreateWeek` return a signal that entries were inserted. In `App.jsx`, the `useEntries` hook already watches `week?.id` — so the simplest fix is to call the entries reload. Add a `reloadEntries` function to `useEntries` that re-fetches, and call it from `useWeek` via a callback prop, OR have `useWeek` return a `recurringPopulated` counter that increments when new entries are inserted, and add it as a dependency to `useEntries`'s load effect.

- [ ] **Step 5: Build and verify**

Run: `npx vite build`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useRecurring.js src/hooks/useWeek.js src/components/RecurringManager.jsx
git commit -m "feat: fix recurring items populate on every week load, add date range support"
```

---

## Final Step: Bump Service Worker Cache

- [ ] **After all tasks: update sw.js cache version**

In `public/sw.js`, change `CACHE_VERSION` to a new value:

```javascript
const CACHE_VERSION = '20260323b'
```

```bash
git add public/sw.js
git commit -m "chore: bump service worker cache version"
```
