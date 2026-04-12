# Smooth Scroll, Clickable Links, Lucia Specials Update

**Date:** 2026-04-12
**Status:** Approved

---

## 1. Smooth Horizontal Scroll with Snap Points

### Problem
On mobile, the week grid shows 3 days at a time via a sliding window (`useMobileView`). Navigating through all 7 days requires up to 5 hard swipes (60px threshold + 1.5x dominance ratio). This feels sluggish and unnatural.

### Solution
Replace the 3-day sliding window with native CSS horizontal scrolling and CSS scroll-snap.

### Implementation Details

**Grid container changes:**
- Apply `overflow-x: auto` and `-webkit-overflow-scrolling: touch` on the grid wrapper for smooth momentum scrolling
- Apply `scroll-snap-type: x mandatory` so the grid snaps to clean day boundaries on release
- Each day column gets `scroll-snap-align: start`

**Remove the mobile sliding window:**
- The `useMobileView` hook's `startIdx` / `slideLeft` / `slideRight` logic is no longer needed for within-week navigation
- The swipe hook (`useSwipe`) still handles week-to-week navigation (left swipe at end of week goes to next week, right swipe at start goes to previous week)
- The grid itself handles within-week scrolling natively

**Auto-scroll to today:**
- On load and week change, programmatically scroll the grid container so today's column is visible (use `scrollIntoView({ behavior: 'smooth', inline: 'center' })` or set `scrollLeft` directly)

**Desktop behavior unchanged:**
- Desktop already shows all 7 days. `overflow-x: auto` is already present. No snap needed at desktop widths since all columns fit.

### Files Affected
- `src/components/WeekGrid.jsx` — grid container CSS classes, scroll-snap on columns
- `src/hooks/useMobileView.js` — simplify or remove sliding window logic
- `src/components/WeekView.jsx` — adjust swipe handler to only trigger week navigation when scrolled to edge
- `src/hooks/useSwipe.js` — may need adjustment so swipe only fires at scroll boundaries

---

## 2. Clickable Links in EntrySheet

### Problem
Users paste URLs (Canvas links, Google Docs, etc.) into entry content, but they render as plain text. Users must manually copy and open in a browser.

### Solution
Detect URLs in entry content and render them as tappable links inside the EntrySheet. Links are only clickable in the sheet, not in the grid cells (cells remain simple tap-to-edit targets).

### Implementation Details

**URL detection:**
- Use a regex to detect URLs in content text: `https?://[^\s]+`
- Match common URL patterns including query strings and fragments

**Rendering in EntrySheet:**
- Below or instead of the plain textarea, render a "view" of the content where detected URLs are wrapped in `<a href="..." target="_blank" rel="noopener noreferrer">` tags
- Approach: show a rendered preview of the content below the textarea. When the textarea is focused for editing, the user sees plain text. The preview below always shows links as clickable.
- Links styled: blue, underlined, with sufficient tap target (minimum 44px height per CLAUDE.md mobile UX rules)
- Tapping a link opens it in a new tab/window; tapping non-link text in the preview focuses the textarea

**Grid cells unchanged:**
- `EntryCell` continues to show truncated plain text
- No link detection or rendering in cells
- Tap cell -> open EntrySheet as before

### Files Affected
- `src/components/EntrySheet.jsx` — add link detection and rendered preview

---

## 3. Lucia Specials Schedule: Add Days 7-8

### Problem
The `SPECIALS_ROTATION` map in `WeekGrid.jsx` only includes days 1-6. The CLAUDE.md spec now includes days 7 and 8.

### Solution
Add the missing entries to match CLAUDE.md exactly.

### Updated Map
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

### Files Affected
- `src/components/WeekGrid.jsx` — update `SPECIALS_ROTATION` constant
- `src/components/LuciaGrid.jsx` — update if it has its own specials map

---

## Out of Scope
- Offline sync changes
- Entry content markdown rendering beyond links
- Changes to grid cell tap behavior
- Desktop-specific scrolling changes
