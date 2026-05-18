# Ad placement analysis — react-rendering-lab

> Asked: "analyse a placement for ads in the navbar." Short answer: **don't put it in the navbar.** Long answer below, with three placements that will actually work — and pass AdSense review.

## Why the navbar is the wrong place

### 1. AdSense policy makes it a non-starter
Google AdSense's Better Ads Standards and program policies prohibit:

- **Sticky / pinned ads at the top of a page** that obscure content as the user scrolls. The lab's navbar is `sticky top-0 z-40` — exactly the surface AdSense names in its "sticky ads that don't allow content to be seen" prohibition.
- **Ads that look like UI / navigation**. A leaderboard wedged into a row of nav links risks being flagged as a "deceptive site behavior" violation — users mistake the ad for site nav, AdSense disapproves the account.
- **Ads above the fold so dense they bury content**. The lab's hero CTA is the conversion event (clicking "Begin Module 1"). A navbar ad above the hero competes directly with it.

### 2. The lab's navbar isn't shaped like an ad unit
Standard AdSense leaderboard is **728 × 90**. The lab's navbar is roughly **1200 × 56** at desktop and ~64 on mobile. The only fits are:

- A 728×90 wedged left of the right-aligned CTA → uses ~80% of the navbar width on a 1280px viewport, breaks at 1024px.
- A small responsive `display="auto"` unit → at 56px height, AdSense will only fill it with 50×50 square units (rare, low fill rate, low CPM).

Either way you sell visual weight in the most valuable real estate for a feature that earns ~$0.30/CPM at best.

### 3. UX cost is high, revenue is low
The navbar is where users orient: brand, current module pill, "Start the lab" CTA, GitHub link. Replacing or crowding it with an ad:

- Pushes the brand off-screen on phones.
- Drops the "Start the lab" click-through (the only conversion that matters for a lab).
- Trains users to ignore the top strip — and they'll start missing the module-current pill too.

## Where ads actually make sense

Here are three placements, ranked by **expected revenue × policy safety × UX preservation**:

### A. **Landing in-feed** (RECOMMENDED — highest revenue, lowest risk)

**Where:** Between the module grid (`<ModuleList>`) and the FAQ section on the landing page.
**Format:** Fluid / native (`data-ad-format="fluid"` + `data-ad-layout-key`).
**Why it works:**
- Sits in genuine content flow, surrounded by clearly distinct content.
- Renders only on the landing page → low total impression count → AdSense values it more per impression.
- The landing page is the highest-traffic page (per page-view, since every visitor lands there).
- Fluid format adapts; no broken layouts at any breakpoint.

**Expected impact:** ~70% of total ad revenue.

### B. **Lab sidebar — sticky vertical** (medium revenue, medium risk)

**Where:** Inside `app/lab/layout.tsx` desktop sidebar, below the module list, above the "Profiler" footer. `lg+` only.
**Format:** Vertical responsive (`data-ad-format="vertical"`).
**Why it works:**
- Mobile (where sidebar is hidden) sees no ad → no mobile policy risk.
- Doesn't push content; lives in the empty space below 25 module entries.
- Vertical units (e.g., 160×600 skyscraper, 300×600 half-page) get the highest CPMs of any display format.
- The user is engaged with content → time-on-page is high → ad has time to refresh.

**Expected impact:** ~25% of total ad revenue.

### C. **In-article between Step 4 and Step 5** (low revenue, lowest risk)

**Where:** Inside `<Lesson>`, after the third step in every module page.
**Format:** In-article (`data-ad-format="in-article"`).
**Why it works:**
- Native rendering — Google styles it to match the page.
- Only fires after the user has scrolled past 3 steps → engagement signal → highest-quality impression.
- Lives in the middle of the content, where AdSense scoring is most favorable.

**Expected impact:** ~5% of total ad revenue, but biggest dwell-time score, helps the account's overall ranking.

## What we are NOT doing

- **Auto Ads.** Auto Ads picks placements automatically and frequently puts banners on top of fixed-position UI like the lab's profiler dock. Manual placement keeps the UX you've already polished.
- **Interstitials.** They show on navigation. The lab's whole structure is navigation between modules. Interstitial = abandonment.
- **Anchor ads (the sticky bottom bar AdSense offers).** The lab's profiler dock owns the bottom strip. Conflict.

## Implementation notes

- All ad slots route through one `<AdSlot/>` component that renders the standard `<ins class="adsbygoogle">` element with the right attributes per format.
- The AdSense script loads once from `app/layout.tsx`, only when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set. Without it, the slots no-op — zero impact on dev / preview deploys.
- An ads.txt file in `public/` is required for AdSense to crowd-verify our publisher ID — the format is documented below in the README's AdSense Setup section.
- The `<AdSlot/>` renders nothing for users who block ads (`window.adsbygoogle` is undefined) — no jank from empty placeholders.

## When to revisit

If revenue is materially behind the targets above, the issue is almost never placement — it's content fit. AdSense scores the page-keyword match. The lab's keywords (React, performance, Fiber, hydration, SSR, observability) are high-value developer-tooling terms — CPMs should be healthy. If they aren't, audit:

1. Page metadata (`<title>`, `<meta name="description">`) — are they keyword-rich for each module?
2. Page-load speed (the irony being this is a perf lab). Slow pages get ad bidder discounts.
3. Bounce rate. If users land on a deep module page and bounce, ad scoring suffers.
