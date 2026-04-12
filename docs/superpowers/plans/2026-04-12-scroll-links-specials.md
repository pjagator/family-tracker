# Smooth Scroll, Clickable Links, Lucia Specials Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3-day sliding window with smooth CSS scroll-snap, add clickable URL rendering in EntrySheet, and update Lucia's specials rotation to include days 7-8.

**Architecture:** The scroll change replaces React-managed mobile view state with native CSS scrolling and scroll-snap, keeping the swipe hook only for week-to-week navigation at scroll boundaries. The link feature adds a URL-detecting rendered preview below the textarea in EntrySheet. The specials update is a two-line constant change in two files.

**Tech Stack:** React 18, Tailwind CSS, CSS scroll-snap, vanilla JS URL regex

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/hooks/useMobileView.js` | Modify | Remove sliding window state, keep only `isMobile` detection |
| `src/components/WeekView.jsx` | Modify | Simplify swipe handling (week nav only), remove mobile sliding props |
| `src/components/WeekGrid.jsx` | Modify | Always render all 7 days, add scroll-snap CSS, auto-scroll to today, update SPECIALS_ROTATION |
| `src/components/EntrySheet.jsx` | Modify | Add URL detection and clickable link preview below textarea |
| `src/components/LuciaGrid.jsx` | Modify | Update SPECIALS_ROTATION days 7-8 |

---

### Task 1: Update Lucia's Specials Rotation (Days 7-8)

**Files:**
- Modify: `src/components/WeekGrid.jsx:8-15`
- Modify: `src/components/LuciaGrid.jsx:9-18`

- [ ] **Step 1: Update SPECIALS_ROTATION in WeekGrid.jsx**

In `src/components/WeekGrid.jsx`, replace lines 8-15:

```javascript
const SPECIALS_ROTATION = {
  1: 'Music/PE',
  2: 'Spanish, Science',
  3: 'Music/PE',
  4: 'Spanish',
  5: 'Library Research',
  6: 'Art & PE',
  7: 'Science',
  8: 'Spanish, Science',
}
```

- [ ] **Step 2: Update SPECIALS_ROTATION in LuciaGrid.jsx**

In `src/components/LuciaGrid.jsx`, replace lines 9-18:

```javascript
const SPECIALS_ROTATION = {
  1: 'Music/PE',
  2: 'Spanish, Science',
  3: 'Music/PE',
  4: 'Spanish',
  5: 'Library Research',
  6: 'Art & PE',
  7: 'Science',
  8: 'Spanish, Science',
}
```

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

Open the app on mobile or devtools mobile view. Set a day number to 7 or 8 on a weekday. Lucia's Specials row should show "Science" for day 7 and "Spanish, Science" for day 8.

- [ ] **Step 4: Commit**

```bash
git add src/components/WeekGrid.jsx src/components/LuciaGrid.jsx
git commit -m "feat: add Lucia specials for days 7-8 (Science, Spanish/Science)"
```

---

### Task 2: Simplify useMobileView Hook

**Files:**
- Modify: `src/hooks/useMobileView.js`

The sliding window (`startIdx`, `slideLeft`, `slideRight`, `canSlideLeft`, `canSlideRight`, `visibleDates`) is being replaced by native CSS scroll. This hook just needs to report whether we're on mobile.

- [ ] **Step 1: Rewrite useMobileView.js**

Replace the entire contents of `src/hooks/useMobileView.js` with:

```javascript
import { useState, useEffect } from 'react'

export function useMobileView() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return { isMobile }
}
```

Note: the `weekDates` parameter is removed — no longer needed.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMobileView.js
git commit -m "refactor: simplify useMobileView to only track mobile breakpoint"
```

---

### Task 3: Update WeekView to Remove Sliding Window Logic

**Files:**
- Modify: `src/components/WeekView.jsx`

WeekView currently uses `useMobileView` to get sliding window state and passes it to WeekGrid. Now it only needs `isMobile`, and swipes always mean week navigation.

- [ ] **Step 1: Rewrite WeekView.jsx**

Replace the entire contents of `src/components/WeekView.jsx` with:

```jsx
import WeekGrid from './WeekGrid'
import WordList from './WordList'
import { useSwipe } from '../hooks/useSwipe'
import { useMobileView } from '../hooks/useMobileView'

export default function WeekView({
  week, weekDates, dayNumbers, globalNoSchool, personNoSchool,
  onDayNumberChange, onToggleGlobalNoSchool, onTogglePersonNoSchool,
  entries, onPrev, onNext, onToday, onCellTap, onAllieToggle, getEntry,
  words, onSaveWords,
}) {
  const { isMobile } = useMobileView()

  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: onNext,
    onSwipeRight: onPrev,
  })

  return (
    <div className="pb-20" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {weekDates.length > 0 && (
        <>
          <WeekGrid
            weekDates={weekDates}
            dayNumbers={dayNumbers}
            globalNoSchool={globalNoSchool}
            personNoSchool={personNoSchool}
            onDayNumberChange={onDayNumberChange}
            onToggleGlobalNoSchool={onToggleGlobalNoSchool}
            onTogglePersonNoSchool={onTogglePersonNoSchool}
            onCellTap={onCellTap}
            onAllieToggle={onAllieToggle}
            getEntry={getEntry}
            onPrev={onPrev}
            onNext={onNext}
            onToday={onToday}
            isMobile={isMobile}
          />

          {/* Lucia's weekly words */}
          <div className="mt-3 mx-0">
            <div className="px-3 py-2" style={{ backgroundColor: '#5b3a6b' }}>
              <span className="text-[12px] font-bold text-white">🎨 Lucia's Words</span>
            </div>
            <div className="bg-white border border-slate-300 border-t-0">
              <WordList type="vocab" words={words?.vocab || []} onSave={onSaveWords} />
              <WordList type="spelling" words={words?.spelling || []} onSave={onSaveWords} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

Key changes:
- `useMobileView()` no longer receives `weekDates`
- Swipe always fires `onNext` / `onPrev` (week navigation only)
- Removed `visibleDates` and `startIdx` props from WeekGrid

- [ ] **Step 2: Commit**

```bash
git add src/components/WeekView.jsx
git commit -m "refactor: remove sliding window from WeekView, swipe = week nav only"
```

---

### Task 4: Add Scroll-Snap to WeekGrid

**Files:**
- Modify: `src/components/WeekGrid.jsx`

This is the core scrolling change. WeekGrid must:
1. Always render all 7 days (no more `visibleDates` filtering)
2. Wrap each person section's day columns in a horizontally scrollable container with scroll-snap
3. Auto-scroll to today on mount
4. Keep the sticky header scrollable too, synced with the body

The approach: wrap the grid content (excluding the sticky category label column) in a scroll container with `scroll-snap-type: x mandatory`. Each day column snaps at its start edge. On mobile, day columns get a minimum width so ~3 days are visible at a time, and the user can smoothly drag to see the rest.

- [ ] **Step 1: Update WeekGrid props and remove mobile filtering**

In `src/components/WeekGrid.jsx`, update the component signature and remove mobile-specific `visibleDates`/`startIdx` props. Replace the function signature (line 104-111):

```jsx
export default function WeekGrid({
  weekDates, dayNumbers, globalNoSchool, personNoSchool,
  onDayNumberChange, onToggleGlobalNoSchool, onTogglePersonNoSchool,
  onCellTap, onAllieToggle, getEntry,
  onPrev, onNext, onToday,
  isMobile,
}) {
```

And replace lines 112-119 (the `today`, `globalSet`, `visibleDates`, `gridCols` block):

```jsx
  const today = new Date().toISOString().split('T')[0]
  const globalSet = new Set(globalNoSchool || [])
  const scrollRef = useRef(null)

  // Always show all 7 days — CSS scroll handles mobile panning
  const gridCols = isMobile
    ? '72px repeat(7, minmax(100px, 1fr))'
    : '90px repeat(7, 1fr)'
```

Add `useRef` to the import at line 1:

```jsx
import { useState, useRef, useEffect } from 'react'
```

- [ ] **Step 2: Add auto-scroll-to-today effect**

Add this effect after the `gridCols` definition (after the line from Step 1):

```jsx
  // Auto-scroll to today's column on mount and week change
  useEffect(() => {
    if (!isMobile || !scrollRef.current) return
    const todayIdx = weekDates.indexOf(today)
    if (todayIdx < 0) return
    const container = scrollRef.current
    const columnWidth = container.scrollWidth / 8 // 1 label col + 7 day cols
    // Scroll so today is roughly centered (show one day before today)
    const scrollTo = columnWidth * Math.max(0, todayIdx)
    container.scrollTo({ left: scrollTo, behavior: 'smooth' })
  }, [weekDates[0], isMobile])
```

- [ ] **Step 3: Replace all `visibleDates` references with `weekDates`**

Throughout WeekGrid.jsx, every reference to `visibleDates` must become `weekDates`. This includes:
- The date header map (around line 221): `visibleDates.map(` → `weekDates.map(`
- The WeatherRow props (around line 299): `visibleDates={visibleDates}` → `visibleDates={weekDates}`
- Person header "Out" toggle map (around line 335): `visibleDates.map(` → `weekDates.map(`
- Allie work row dates (around line 396): `visibleDates.map(` → `weekDates.map(`
- Entry cell dates (around line 440): `visibleDates.map(` → `weekDates.map(`

- [ ] **Step 4: Remove the mobile day indicator dots**

Delete the mobile dot indicator block (lines 207-215 in the original):

```jsx
        {/* Mobile day indicator dots */}
        {isMobile && (
          <div className="flex justify-center gap-1.5 py-1.5 bg-navy">
            {weekDates.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i >= startIdx && i < startIdx + visibleDates.length ? 'bg-white' : 'bg-white/30'
              }`} />
            ))}
          </div>
        )}
```

- [ ] **Step 5: Add scroll-snap container**

Wrap the outer `<div>` (line 200) in a scrollable container. Replace:

```jsx
      <div className={isMobile ? '' : 'min-w-[600px]'}>
```

With:

```jsx
      <div
        ref={scrollRef}
        className={isMobile
          ? 'overflow-x-auto scroll-smooth snap-x snap-mandatory'
          : 'min-w-[600px]'
        }
        style={isMobile ? { WebkitOverflowScrolling: 'touch' } : undefined}
      >
        <div className={isMobile ? 'min-w-[800px]' : ''}>
```

And add a closing `</div>` before the existing closing `</div>` at the end of the component (before the final `</div>` on line 496).

The `min-w-[800px]` inner div forces the content wider than the viewport so it becomes scrollable. With `snap-x snap-mandatory`, each day column snaps into place. The `100px` minimum column width (from the `gridCols` change in Step 1) means ~3 days show at a time on a 390px screen.

- [ ] **Step 6: Add snap alignment to day columns**

Each day column cell needs `scroll-snap-align: start`. The simplest way is to add it to the first grid row's day cells (the date headers). In the date header map callback, add `snap-start` to the className. Find the header cell div (around line 230):

```jsx
                className={`border border-slate-300 p-1 text-center text-[11px] font-semibold relative snap-start ${
```

This CSS Tailwind class `snap-start` tells the scroll container to snap to the start of each day column.

- [ ] **Step 7: Verify in browser**

Run: `npm run dev`

Open on mobile (or devtools, 390px width):
- The grid should show ~3 days at a time
- Dragging left/right should smoothly scroll through all 7 days
- Releasing should snap to a clean day boundary
- Today's column should be visible on initial load
- A full left-to-right swipe (60px+ horizontal) should navigate to next/previous week
- On desktop, all 7 days should still display without horizontal scroll

- [ ] **Step 8: Commit**

```bash
git add src/components/WeekGrid.jsx
git commit -m "feat: replace 3-day sliding window with smooth CSS scroll-snap on mobile"
```

---

### Task 5: Add Clickable Links in EntrySheet

**Files:**
- Modify: `src/components/EntrySheet.jsx`

Add a rendered preview below the textarea that detects URLs and renders them as tappable `<a>` links. The textarea stays plain text for editing.

- [ ] **Step 1: Add the linkify helper function**

At the top of `src/components/EntrySheet.jsx`, after the existing imports (line 3), add:

```jsx
// Detect URLs in text and return an array of { type: 'text'|'link', value: string } segments
function linkifyContent(text) {
  if (!text) return []
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const segments = []
  let lastIndex = 0
  let match

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) })
    }
    segments.push({ type: 'link', value: match[0] })
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) })
  }

  return segments
}
```

- [ ] **Step 2: Add the link preview below the textarea**

In `src/components/EntrySheet.jsx`, find the closing `/>` of the textarea (line 107). After it, add the link preview:

```jsx

          {/* Clickable link preview */}
          {content && linkifyContent(content).some(s => s.type === 'link') && (
            <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-sm leading-relaxed break-words">
              {linkifyContent(content).map((segment, i) =>
                segment.type === 'link' ? (
                  <a
                    key={i}
                    href={segment.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline break-all inline-block min-h-[44px] leading-[44px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {segment.value}
                  </a>
                ) : (
                  <span key={i}>{segment.value}</span>
                )
              )}
            </div>
          )}
```

Key details:
- Only shows when content contains at least one URL
- `min-h-[44px]` and `leading-[44px]` ensure link tap targets meet the 44px mobile UX requirement from CLAUDE.md
- `break-all` prevents long URLs from causing horizontal overflow
- `e.stopPropagation()` prevents the link tap from bubbling up to the backdrop's save-and-close handler
- `target="_blank"` opens links in a new tab/window

- [ ] **Step 3: Verify in browser**

Run: `npm run dev`

1. Tap a cell to open EntrySheet
2. Type or paste a URL like `https://canvas.instructure.com/courses/12345`
3. A blue underlined link should appear in a preview box below the textarea
4. Tapping the link should open it in a new tab
5. Tapping the textarea should still let you edit normally
6. Content without URLs should NOT show the preview box
7. Test on mobile devtools (390px) — the link should be tappable with a finger

- [ ] **Step 4: Commit**

```bash
git add src/components/EntrySheet.jsx
git commit -m "feat: add clickable URL preview in EntrySheet"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Full mobile walkthrough**

Open the app in Chrome devtools at 390px width (iPhone simulation):
1. Scroll the week grid — smooth horizontal drag, snaps to day boundaries
2. Navigate weeks — hard left/right swipe changes week
3. Set day number 7 on a weekday — Lucia shows "Science"
4. Set day number 8 on a weekday — Lucia shows "Spanish, Science"
5. Tap a cell, type a URL — link preview appears and is clickable
6. Tap a cell without URL — no preview box

- [ ] **Step 2: Desktop verification**

Open the app in a full browser window:
1. All 7 days visible, no horizontal scroll needed
2. Week navigation via arrow buttons works
3. Entry links work same as mobile
4. Lucia specials 7-8 work

- [ ] **Step 3: Commit any fixes if needed**

If any issues were found and fixed:
```bash
git add -A
git commit -m "fix: address issues found in final verification"
```
