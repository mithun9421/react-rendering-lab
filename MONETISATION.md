# Monetisation + Gamification Strategy

> Drafted **2026-05-19** with research from three parallel agents (payment platforms, gamification patterns, premium-tier architecture). The recommendations below are evidence-based — sources at the bottom.

## The thesis

The lab has 36 published lessons + an interview bank + journey + incident simulator. **All free today.** The goal: build a small revenue stream without compromising the free experience, while making the lab stickier through gamification that actually works for senior devs (not cosmetic-badge soup).

Two principles drive the plan:

1. **Free tier must stay genuinely good.** Google indexes free content. Word-of-mouth comes from free content. A locked-down free tier kills both.
2. **Senior devs hate cringe gamification.** No participation badges, no global leaderboards, no hearts/lives. Mechanics must signal real competence or solve a real problem.

## Pricing

Recommended hero tier: **$39 one-time (lifetime)** with **$19/mo** as the alternative for fence-sitters. Skip $9/mo — research consistently shows it under-values dev-tools and attracts low-quality users. For educational content where churn would be brutal (people finish + cancel), lifetime is the better default — see Epic React / Total TypeScript / ui.dev pricing.

| Tier | Price | What it includes |
|---|---|---|
| **Free** | $0 | All 11 Foundations · Core modules 01-08 · Journey · 30% rotating sample of interview bank · 1 streak-freeze per month · Ads served |
| **Pro lifetime** | $39 | Everything in Free + Core modules 09-25 (Islands → Incident Simulator) · Full 200-question interview bank · All incident scenarios · Unlimited streak freezes · Spaced-repetition review queue · Shareable certificates (LinkedIn) · Ad-free · Future modules included |
| **Pro monthly** | $19/mo | Same as lifetime, just billed monthly. Auto-converts to lifetime credit after 12 months. |

## Platform: Polar.sh + Clerk + Supabase

Three pieces, all on free tier until real revenue:

- **Polar.sh** for payments — Merchant of Record (handles VAT/sales tax globally, critical for a solo dev), lower effective fee than Stripe + Stripe Tax, dev-tool-friendly DX with a modern TS SDK. Confirms Pro entitlement via webhook on `checkout.completed` and `subscription.updated`.
- **Clerk** for auth — magic links + Google OAuth, free up to 10k MAU. Replaces the no-account model. Stable `userId` becomes the Pro key.
- **Supabase Postgres** for entitlements — one table: `entitlements(user_id pk, tier, polar_customer_id, expires_at)`. Webhook writes here; this is the source of truth.

Hot path uses a signed JWT cookie (`rrl_ent`) refreshed every 1h so we don't hit the DB on every page render. Revocation propagates in ≤24h.

### Why not Stripe direct?

Stripe is the gold standard but isn't a Merchant of Record — we'd owe VAT/sales tax in every jurisdiction we sell into. Stripe Tax adds 0.5% AND we still file ourselves. Polar's MoR fee is lower on the math for typical indie volumes, and the time saved on tax compliance is the real win. Re-evaluate at ~$25k MRR if we ever get there.

## Gamification — what to ship

Five mechanics, ranked by evidence-backed ROI:

### 1. Spaced-repetition review queue
The single mechanic with the strongest research base (200-300% retention boost — Anki, WaniKani, Brilliant). Lessons re-surface on SM-2 intervals. Doesn't feel like a game; feels like a habit. **Free**: review queue exists. **Pro**: longer intervals, archive access, scheduling stats.

### 2. Skill mastery map per concept
Replace (or complement) the flat XP/level with a competence-tagged graph. "Hooks → Apprentice → Adept → Architect" per skill. Brilliant's model. This is the badge replacement that DOESN'T feel cringe to senior devs because it tracks real knowledge, not attendance.

### 3. Verified shareable certificates
The highest-ROI growth loop in edtech (freeCodeCamp's primary organic channel). Per-track certificates ("React Rendering Specialist", "Frontend Systems Architect") with one-click LinkedIn share. **Gated behind real completion + quiz threshold** so the signal is genuine. **Free preview, paid to issue + share.**

### 4. Streak freeze + monetisation
Duolingo's biggest paid-tier lever. The user already has a daily-visit streak. Add: 1 free freeze per month; **Pro unlocks unlimited**. People who built a 30-day streak don't want to lose it; this is loss-aversion done ethically (you're letting them protect work, not paywalling content they already have).

### 5. Daily React challenge
One short problem from the interview bank, picked deterministically per day. Connected to the SRS queue. Monthly perfect-attendance badge = paid-tier perk. Drives DAU without inflating the lab's surface.

### Explicitly NOT shipping
- Global public leaderboards (Advent of Code retired theirs in 2025; demoralises the 80%)
- Cosmetic "first login" badges
- Hearts/lives (works for kids on Duolingo; senior devs rage-quit)
- Gems/coins virtual economy

## What goes Pro — the content split

The hardest decision is what to lock. Lock too much → kill traffic. Lock too little → no one pays. Research suggests gating ~40-60% of the substantive content, with the "advanced / Staff+" material clearly behind the wall, the "fundamentals" free.

**Free:**
- All 11 Foundations (F01-F11) — beginner content drives traffic and is the entry path
- Core modules 01-08 (Reconciliation through Suspense) — the React rendering chain that most working devs need
- The whole Journey route — it's the marketing piece, do not lock it
- 30% rotating sample of interview bank
- 1 incident scenario from the simulator
- The custom profiler + visualisations (they're the SEO + word-of-mouth)

**Pro:**
- Core modules 09-25 — Islands, virtualization, the Compiler, RSC, Server Actions, PPR, state architecture, and the entire systems half (microfrontends through security)
- Full 200-question interview bank with rationale on wrong answers
- All 6 incident scenarios + future additions
- Spaced-repetition review queue + scheduling
- Streak freezes (unlimited)
- Verified certificates with LinkedIn share
- Ad-free experience
- All future modules — explicit promise

This roughly maps to: "the React user" stays free, "the Staff+/Principal user" pays. The free tier is genuinely valuable; the paid tier is the bridge from senior-engineer to architect.

## Shipping order

Phase 1 (this week) — **gamification on the FREE side**:
1. Refactor achievements catalogue to evidence-based (drop cosmetics)
2. Achievement toast component
3. SRS review queue (minimum viable)
4. Skill mastery map viz
5. Certificate generation per track (free preview)

Phase 2 (next 2 weeks) — **monetisation infra**:
1. Clerk auth integration
2. Supabase entitlements table + JWT cookie
3. Polar webhook handlers
4. `<Premium>` wrapper component
5. `/pricing` page
6. Restore-purchases flow

Phase 3 (week 3-4) — **launch & iterate**:
1. Flip live on a custom domain
2. AdSense application + integration (already wired)
3. Soft launch on X/LinkedIn — single post + a few HN/Reddit shares
4. Monitor conversion, iterate on what's Pro vs Free based on actual data

## Success metrics

Watching, in order:

1. **DAU / WAU ratio** (engagement quality, not absolute traffic). Healthy: ≥ 30%.
2. **Lesson completion rate** (do people finish what they start?). Healthy: ≥ 50% on Foundations.
3. **Streak length distribution** — proxy for habit formation.
4. **Free → Pro conversion**. Healthy: ≥ 2% of WAU.
5. **Certificate-share clicks** — viral loop indicator.

## Sources (from the three research agents)

**Monetisation:**
- [Polar Pricing](https://polar.sh/resources/pricing) — confirmed MoR + fee structure
- [UserJot platform comparison](https://userjot.com/blog/stripe-polar-lemon-squeezy-gumroad-transaction-fees)
- [BuildMVPFast: Polar vs LemonSqueezy vs Paddle 2026](https://www.buildmvpfast.com/blog/lemon-squeezy-vs-polar-paddle-merchant-of-record-2026)
- [Freemius — Micro-SaaS Pricing Strategies](https://freemius.com/blog/micro-saas-pricing-strategies/)

**Gamification:**
- [Lenny's Newsletter — How Duolingo reignited user growth](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth)
- [Sensor Tower — Duolingo streak feature](https://sensortower.com/blog/duolingo-streak-feature-app-engagement-growth)
- [Trophy — Brilliant gamification case study](https://trophy.so/blog/brilliant-gamification-case-study)
- [Sage Journals 2025 — Anki spaced repetition exam performance](https://journals.sagepub.com/doi/10.1177/23821205251369705)
- [freeCodeCamp certifications](https://www.freecodecamp.org/news/freecodecamp-certifications/)
- [LearnWorlds — LinkedIn certificate sharing as growth channel](https://support.learnworlds.com/support/solutions/articles/12000016124-viralize-your-online-school-with-linkedin-certificate-sharing)
- [Frontiers in Education 2024 — digital badges effectiveness](https://www.frontiersin.org/journals/education/articles/10.3389/feduc.2024.1429452/full)
- [Advent of Code 2025 retires global leaderboard](https://biggo.com/news/202510271323_Advent-of-Code-2025-Changes)
