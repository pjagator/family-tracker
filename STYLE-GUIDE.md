# App Style Guide

This is the design and engineering standard for all apps. Claude Code should follow these rules when building or modifying any feature. Apply these principles to every component, screen, and interaction.

---

## Typography

Use a mathematical type scale. Never use arbitrary font sizes.

```css
--text-xs: 0.75rem;    /* 12px - captions, timestamps */
--text-sm: 0.875rem;   /* 14px - secondary text, labels */
--text-base: 1rem;     /* 16px - body text, inputs */
--text-lg: 1.125rem;   /* 18px - card titles, section labels */
--text-xl: 1.25rem;    /* 20px - screen titles */
--text-2xl: 1.5rem;    /* 24px - primary headings */
--text-3xl: 1.875rem;  /* 30px - hero text, welcome screen */
```

Line height: 1.2 for headings, 1.5 for body text.

Font weights: 400 (regular body), 500 (medium for labels), 600 (semibold for card titles), 700 (bold for headings only).

Every text element must use a step from this scale. No exceptions.

---

## Spacing

All spacing uses a 4px base unit. Never use arbitrary margin or padding values.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
--space-12: 48px;
```

Padding inside cards: --space-3 or --space-4.
Gap between cards in a grid: --space-3.
Gap between sections: --space-6 or --space-8.
Margin around screen content: --space-4.

Spacing between elements within a card or section should always step up or down the scale, never skip inconsistently.

---

## Touch Targets

Minimum tappable area: 44x44px. This is non-negotiable.

If a visual element is smaller than 44px (like a tag chip or small icon), extend the tappable area with padding. The visual element can be small, the hit area cannot.

Buttons, cards, chips, tabs, links, toggles, and any other interactive element must meet this minimum.

---

## Press and Active States

Every interactive element must give immediate visual feedback on press.

- Buttons: darken background by 10% on :active
- Cards: transform: scale(0.98) on :active with 150ms ease transition
- Chips and tags: slight background color shift on :active
- Tab bar items: subtle press state
- Toggles: immediate visual change

Add to all interactive elements:
```css
transition: transform 150ms ease, background-color 150ms ease, box-shadow 150ms ease;
user-select: none;
-webkit-user-select: none;
```

Never leave an interactive element without a pressed state. Users must know their tap registered.

---

## Loading States

Never show a blank screen, a frozen UI, or a generic spinner. Use skeleton screens that match the shape of the content being loaded.

Skeleton animation: a pulsing gray rectangle with a shimmer gradient moving left to right. Rounded corners matching the content it represents.

Rules:
- Grid loading: show skeleton cards in the same layout (2-column, same card dimensions)
- Each skeleton card mirrors real content: gray rectangle for image, thin bars for text, small pills for tags
- Show enough skeletons to fill the viewport (typically 4-6 cards)
- Detail modal loading: skeleton blocks matching the detail layout
- Identification in progress: skeleton result cards (3), not a spinner
- Never use a spinning circle loader anywhere in the app

---

## Transitions and Animation

Every state change must animate. Nothing should pop in or out instantly.

Timing:
- Opening/appearing: 300ms ease-out
- Closing/disappearing: 250ms ease-in (closing feels slightly faster)
- Hover/active states: 150ms ease
- Card stagger: 30ms delay between each card in a list

Modal transitions:
- Bottom sheets slide up from translateY(100%) to translateY(0)
- Background overlay fades from opacity 0 to 0.5
- On close: reverse

Tab switching:
- Cross-fade content (opacity, 200ms). Do not slide. Tabs are peers, not a sequence.

Card appearance:
- Fade in with slight upward movement: opacity 0 + translateY(8px) to opacity 1 + translateY(0)
- Stagger each card 30ms after the previous

Filter changes:
- Removed cards fade out (150ms), remaining cards reflow, new cards fade in (150ms)

Collapsible sections:
- Smooth height animation
- Chevron rotates 180 degrees

Always include reduced motion support:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Empty States

Every screen must have a designed empty state. Empty states are not errors. They are invitations.

Structure:
- Large illustration or emoji (centered)
- Headline in --text-xl, semibold
- Subtext in --text-sm, muted color
- Primary action button when applicable (e.g., "Take a photo" to navigate to capture)

Generous vertical padding. Vertically centered in the available space.

Examples of tone:
- Empty garden: "Your garden is waiting" / "Capture your first plant to start building your collection."
- No search results: "No matches for '[term]'" / "Try a shorter search or check the spelling."
- No filter results: "No [filter] plants found" / "Try a different filter or add more plants."
- Failed identification: "Couldn't identify this one" / "Try a clearer photo with good lighting, focused on leaves or flowers." + "Or add it manually" button

Never show a bare "No data" or "Nothing here" without context and a next step.

---

## Images

Images must be optimized for performance and load progressively.

Two versions of every uploaded image:
- Thumbnail: 300px wide, 60% JPEG quality (for grid cards)
- Full resolution: 900px wide, 82% JPEG quality (for detail view)

Grid cards always use thumbnails. Detail view loads full resolution.

Loading behavior:
- Image starts invisible (opacity: 0) on a solid background color
- When loaded, fades in over 300ms
- CSS: `img { opacity: 0; transition: opacity 300ms; } img.loaded { opacity: 1; }`
- JS: `img.onload = () => img.classList.add('loaded')`

All img tags must have:
- loading="lazy" (except above-the-fold images)
- width and height attributes (prevents layout shift)
- An error fallback: if the image fails, show a styled placeholder (emoji on colored background), never a broken image icon

---

## Error Handling

Users must never see raw error messages, frozen screens, or lose their work.

Toast notification system:
- Small bar, slides in from bottom, auto-dismisses after 4 seconds
- Three types: success (green), error (red/terracotta), info (neutral)
- Tap to dismiss early
- Show meaningful messages: "Plant saved to your garden" not "INSERT successful"

Rules:
- No alert() calls anywhere in the codebase. Use toasts.
- Every Supabase/API call wrapped in try/catch with user-friendly error messages
- Never expose database error text to the user
- Double-tap guard on all save/submit buttons: disable immediately on tap, re-enable after completion
- Retry logic on identification: "Identification failed. Try again?" with a retry button
- Network errors: "No connection. Your photo is saved. You can identify it when you're back online."

Offline detection:
- Listen for online/offline events
- Show a subtle persistent banner when offline: "You're offline. Changes will sync when you reconnect."

---

## Gestures

Web apps should feel native. Support these gestures:

Swipe to delete (garden cards):
- Swipe left reveals a red "Delete" button behind the card
- Card slides back if released without completing the swipe
- Tap delete to confirm and remove with animation

Pull to refresh (list screens):
- Pull down beyond threshold shows a refresh indicator
- Release triggers data reload
- Smooth rubber-band animation

Swipe to dismiss (modals and bottom sheets):
- Track finger position, modal follows
- Past 30% of height: close. Under 30%: snap back.

Pinch to zoom (photos in detail view):
- Two-finger pinch zooms into image
- Pan while zoomed
- Double-tap toggles between fit and zoomed

Implementation: touch event listeners (touchstart, touchmove, touchend) with requestAnimationFrame for 60fps smoothness.

---

## Accessibility

These are requirements, not nice-to-haves.

Color contrast:
- All text/background combinations must meet WCAG AA: 4.5:1 for normal text, 3:1 for large text
- Test every combination. Light text on light backgrounds (like cream) will likely fail.

Semantic HTML:
- Buttons are `<button>`, not `<div onclick>`
- Headings use h1-h6 in document order
- Lists use `<ul>` / `<li>`
- Navigation uses `<nav>` with appropriate roles
- Tab bars use role="tablist" / role="tab"

ARIA:
- aria-label on every icon-only button (camera, gallery, remove, filter icons)
- aria-expanded on collapsible sections
- role="dialog" and aria-modal="true" on modals
- aria-live regions for dynamic announcements ("3 species identified", "Plant saved to garden")

Focus management:
- Modal opens: focus moves to first interactive element inside
- Modal closes: focus returns to the element that triggered it
- Focus trap inside modals: Tab cycles through modal content only, not the page behind

Reduced motion: all animations respect prefers-reduced-motion (see Transitions section).

---

## Performance

Targets: first paint under 1 second, interactive under 2 seconds, smooth 60fps scrolling.

CSS:
- Critical CSS (above-the-fold styles) inlined in `<style>` tag in HTML
- Full stylesheet loaded asynchronously
- Remove unused CSS rules

JavaScript:
- Debounce search input: 300ms delay before filtering
- Defer non-critical code (export functions, reference databases)
- Use requestIdleCallback for non-urgent work

Images:
- Use srcset for responsive sizing
- Width and height attributes on all img tags (prevents CLS)
- Consider WebP format for smaller files
- Thumbnails for grids, full-res on demand (see Images section)

Virtual scrolling:
- If a list exceeds 50 items, only render items visible in the viewport
- Use IntersectionObserver to load/unload items on scroll
- Keeps the DOM small and scrolling smooth

Measure with Lighthouse (Chrome DevTools > Lighthouse > mobile audit). Track: Performance score, FCP, LCP, CLS, TBT. Measure before and after changes.

---

## Color Usage

Colors should be purposeful, not decorative.

- Use the app's primary palette consistently (defined in CSS custom properties)
- Tests/quizzes/important items: terracotta/red accent color. These must visually pop.
- Completed items: muted green + strikethrough
- Today/current: subtle blue highlight background
- Weekend/inactive: light gray background
- Error states: red/terracotta
- Success states: green
- Disabled elements: 50% opacity

Never introduce a new color without a semantic purpose.

---

## Component Consistency

Every instance of a component type must look and behave identically.

- All cards in a grid: same border radius, same shadow (or no shadow), same padding, same border style
- All modals: same animation, same overlay, same close behavior
- All chips/tags: same height, same padding, same font size, same border radius
- All buttons of the same type: same height, same padding, same font weight

If two cards look slightly different (one has a border, one doesn't), that's a bug, not a design choice. Audit for consistency after building any new component.

---

## Summary Checklist

Before shipping any feature, verify:

- [ ] All text uses the type scale (no arbitrary font sizes)
- [ ] All spacing uses the spacing scale (no arbitrary margins/padding)
- [ ] All touch targets are at least 44x44px
- [ ] All interactive elements have press/active states
- [ ] Loading states use skeletons, not spinners
- [ ] All state changes animate smoothly
- [ ] Empty states are designed with headline, subtext, and action
- [ ] Images are optimized with thumbnails and progressive loading
- [ ] All errors show user-friendly toasts, no alert() or raw messages
- [ ] Gestures work where expected (swipe, pull, pinch)
- [ ] Color contrast passes WCAG AA
- [ ] Semantic HTML and ARIA labels are in place
- [ ] Focus management works for modals
- [ ] Reduced motion is respected
- [ ] Performance is measured and acceptable
