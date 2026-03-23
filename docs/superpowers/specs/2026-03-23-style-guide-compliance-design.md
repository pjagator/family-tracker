# Style Guide Compliance — Design Spec

**Date:** 2026-03-23
**Scope:** Full audit and remediation of Family Tracker app against STYLE-GUIDE.md

---

## Decisions

- **Grid exception:** WeekGrid, EntryCell, WeatherRow, WeekNav keep arbitrary font sizes for density
- **confirm() stays:** Browser confirm dialogs kept for delete actions
- **Accessibility:** Contrast fixes only; skip ARIA/focus-trap for this family mobile app
- **Loading states:** Polish existing text, no skeleton screens
- **Offline detection:** Skip — not worth it for home Wi-Fi usage
- **Swipe-to-dismiss:** Yes, on EntrySheet bottom sheet

---

## Task 1: Toast System

New `Toast.jsx` component + `useToast` hook via React context.

**Toast component:**
- Fixed position at bottom, above BottomNav (z-35)
- Slides up on show, auto-dismisses after 4 seconds, tap to dismiss
- Three types: success (complete color), error (test color), info (gray)
- Smooth slide-up/slide-down animation

**useToast hook:**
- Returns `showToast({ message, type })`
- Context provider wraps App

**Integration:**
- Auth.jsx: replace raw `error.message` with friendly messages ("Invalid email or password", "Account created!", etc.)
- FamilySetup.jsx: replace raw `error.message` with friendly messages
- EntrySheet.jsx: success toast on save
- CampView.jsx: success toast on add/delete
- WordList.jsx: success toast on save
- RecurringManager.jsx: success toast on add/remove

**Double-tap guard:** Add `disabled={saving}` (or equivalent loading state) to all save/submit buttons that don't already have it. Check: `CampView.jsx` (camp name save on blur, delete button), `Auth.jsx` (already has `disabled={loading}` — OK).

**Files:** new `Toast.jsx`, new `ToastContext.jsx`, modified `App.jsx`, `Auth.jsx`, `FamilySetup.jsx`, `EntrySheet.jsx`, `CampView.jsx`, `WordList.jsx`, `RecurringManager.jsx`

---

## Task 2: Swipe-to-Dismiss on EntrySheet

New `useSwipeDismiss.js` hook integrated into EntrySheet.

**Hook behavior:**
- Attaches touchstart/touchmove/touchend to sheet element
- Tracks vertical drag via translateY, 60fps with requestAnimationFrame
- Past 30% of sheet height: animate closed, fire onClose callback
- Under 30%: snap back with spring animation

**Visual:**
- Small gray pill drag handle (w-10 h-1 rounded-full bg-gray-300) centered at top of sheet
- Sheet follows finger during drag

**Files:** new `useSwipeDismiss.js`, modified `EntrySheet.jsx`

---

## Task 3: Transitions, User-Select, Contrast

**Transitions:** Add `transition` class to every interactive element that has an `active:` state but currently lacks a transition. ~50 elements across all component files.

**User-select:** Add global base style in `index.css`:
```css
button { user-select: none; -webkit-user-select: none; }
```

**Contrast:** Replace `text-gray-300` with `text-gray-400` on white/light backgrounds:
- EntryCell.jsx: "+" placeholder
- WeatherRow.jsx: loading "..." and empty "--"
- WordList.jsx: "No words this week"
- WeekGrid.jsx: collapsed summary, various labels

**Reduced motion:** Verify the existing `prefers-reduced-motion` rule in `index.css` covers all new animations added in Tasks 1, 2, and 5. The current blanket rule (`animation-duration: 0.01ms !important; transition-duration: 0.01ms !important`) should cover everything, but confirm after implementation.

**Files:** `index.css`, all component files with active: states, specific files listed above for contrast

---

## Task 4: Typography and Spacing (Non-Grid)

**Grid exception (no changes):** WeekGrid.jsx, EntryCell.jsx, WeatherRow.jsx, WeekNav.jsx

**Typography fixes:**
| Pattern | Replacement | Files |
|---------|-------------|-------|
| text-[15px] | text-base | Auth.jsx, EntrySheet.jsx, PersonSection.jsx, FamilySetup.jsx |
| text-[13px] | text-sm | WordList.jsx, CampView.jsx, RecurringManager.jsx |
| text-[12px] | text-xs | WordList.jsx, CampView.jsx, RecurringManager.jsx |
| text-[11px] | text-xs | BottomNav.jsx, CampView.jsx, RecurringManager.jsx, WordList.jsx, EntrySheet.jsx |
| text-[10px] | text-xs | WordList.jsx |

**Spacing fixes:**
| Pattern | Replacement | Files |
|---------|-------------|-------|
| py-2.5 | py-2 or py-3 | EntrySheet.jsx, PersonSection.jsx |
| space-y-1.5 | space-y-2 | WordList.jsx |
| gap-1.5 | gap-2 | WordList.jsx, CampView.jsx |
| gap-0.5 | gap-1 | BottomNav.jsx |
| py-1.5 | py-2 | BottomNav.jsx, RecurringManager.jsx |

---

## Task 5: Empty States, Loading Polish, Animations

**Empty states (structure: emoji + headline text-xl font-semibold + subtext text-sm text-gray-500 + py-12):**
- CampView: "No camps planned yet" / "Add a summer camp week to get started" / + Add week button
- RecurringManager: "No recurring items" / "Add items that repeat every week"
- WordList: "No words this week" / "Tap Edit to add words"

**Loading polish:** Keep "Loading..." text, add pulse animation, better centering.

**Animation timing:** slideUp 250ms → 300ms for opening.

**Tab cross-fade:** Add opacity transition on content switch in App.jsx (Week/Camps/Settings).

**Files:** `CampView.jsx`, `RecurringManager.jsx`, `WordList.jsx`, `index.css`, `App.jsx`

---

## Task 6: Touch Targets and Style Guide Update

**Touch target fixes:**
- WeekGrid.jsx Allie Teach/Off buttons: min-h-[28px] → min-h-[44px]
- WeatherRow.jsx cells: min-h-[32px] → min-h-[44px]
- WordList.jsx word chips: add padding for 44px hit area

**Style guide update:** Add to STYLE-GUIDE.md:
> **Grid Exception:** WeekGrid, EntryCell, WeatherRow, and WeekNav may use arbitrary font sizes below text-xs (12px) for information density. These components are exempt from the typography scale but must still follow all other rules.

---

## Out of Scope

- **BeauGrid.jsx, LuciaGrid.jsx** — dead code from an earlier version, not rendered anywhere. Should be deleted during cleanup but not part of this spec.
- **WeekView.jsx** — thin wrapper that delegates to WeekGrid. Only contains one `text-[12px]` (Lucia's Words header) which falls under the grid exception. No other violations.
- **Images section** — app has no user-uploaded images; not applicable.
- **Performance section** — app is small enough that Lighthouse optimization is not needed now.
- **Card stagger animation** — no card lists in the app; grid cells render as a grid, not staggered cards.
- **Semantic HTML beyond contrast** — per user decision, deferred to future work.

---

## Implementation Order

```
Task 1: Toast system (infrastructure, unblocks error handling fixes)
Task 2: Swipe-to-dismiss (independent, can run in parallel with Task 1)
  └── Task 3: Transitions, user-select, contrast (systematic sweep, after Task 1)
        └── Task 4: Typography and spacing (builds on sweep)
              └── Task 5: Empty states, loading, animations (polish pass)
                    └── Task 6: Touch targets and style guide update (final)
```

## Task IDs

- Task #4: Toast system
- Task #5: Swipe-to-dismiss
- Task #6: Transitions, user-select, contrast
- Task #7: Typography and spacing
- Task #8: Empty states, loading, animations
- Task #9: Touch targets and style guide update
