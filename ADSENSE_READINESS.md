# AdSense Readiness Audit

> Done **2026-05-19**, end-to-end check against Google AdSense's policies, Better Ads Standards, and the practical things reviewers look at. The lab needs to pass on the first submission — re-applies take weeks.

## Status

| Requirement | Status | Notes |
|---|---|---|
| Original, substantive content | ✅ done | 25 modules + Journey, all original technical writing |
| Privacy policy | ✅ this PR | `/privacy` — covers cookies, AdSense, third parties, user rights |
| Cookie consent (EEA/UK) | ✅ this PR | First-visit banner + Google Consent Mode v2 — required since Jan 2024 |
| Terms of Service | ✅ this PR | `/terms` — educational disclaimer, MIT code license, "as is" |
| About page | ✅ this PR | `/about` — what the lab is, who made it, why |
| Contact page | ✅ this PR | `/contact` — email + GitHub issues + bug report |
| Footer with policy links on every page | ✅ this PR | shared `<SiteFooter/>` across landing, lab, legal pages |
| `ads.txt` at site root | ⚠️ placeholder | `public/ads.txt` ships; **replace `pub-0000000000000000` with your real ID before deploying** |
| Site verification meta tag | ✅ this PR | env-gated `<meta name="google-adsense-account">` slot |
| robots.txt | ✅ this PR | allows all crawlers + points at sitemap |
| Dynamic sitemap | ✅ this PR | generated from the module registry |
| Per-page metadata (title + description) | ✅ this PR | each module gets keyword-rich metadata |
| HTTPS | ✅ done | Vercel default |
| Mobile responsive | ✅ done | v0.5 mobile pass |
| Clear navigation | ✅ done | sidebar + journey + mobile drawer |
| No prohibited content | ✅ done | technical content only |
| Site age + uptime | n/a | a few days of live history helps; nothing to build |
| **Custom domain** | ❌ **YOU** | `*.vercel.app` subdomains usually get rejected. You'll need to point a domain at it (e.g. `react-rendering-lab.com`) before applying |

The only blocker only you can fix is the custom domain. Everything else is shipped in this commit.

## What we built

### Privacy policy (`/privacy`)
Covers AdSense data collection, cookies (ad personalization + functional), third parties (Google), user rights (GDPR access/delete/portability, CCPA opt-out, "Do Not Sell"), opt-out links (Google ad settings, NAI, YourAdChoices), data retention, and contact. Reviewable, defensible, plain-English.

### Cookie consent + Google Consent Mode v2
- First-visit banner: **Accept all** / **Reject non-essential** / **Manage**.
- Default consent state on every page load: `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage` all **denied** (Google's required default for EEA visitors).
- On accept: consent updates to `granted`, AdSense fires with personalized ads.
- On reject: consent stays `denied`, AdSense fires with **non-personalized ads only** (still earns, lower CPM but legally compliant).
- Choice persists in `localStorage` (`rrl:consent`). The banner doesn't return.
- Provides a footer link that re-opens the banner so users can change their mind.

### Site verification
`NEXT_PUBLIC_ADSENSE_VERIFICATION_TAG` env var → `<meta name="google-adsense-account" content="ca-pub-…">` in the document head. Required during the AdSense application step where they ask you to add the meta tag to prove site ownership.

### SEO foundation
- `robots.txt` allowing all bots, with `Sitemap:` line.
- Dynamic sitemap from the module registry → all 27 routes get indexed.
- Per-module `generateMetadata` produces unique `<title>` and `<meta description>` using each module's `title` + `hook` from the registry. Replaces the previous single page-level title.

## The application flow (what you actually do)

1. **Point a custom domain at the Vercel deployment.** This is the one thing you must do before applying. Cloudflare for the registrar is fine; ten minutes.
2. Visit https://www.google.com/adsense and **apply**.
3. Google's bot crawls your site. They look for:
   - Privacy policy → linked from footer ✓
   - Original content → 25 modules ✓
   - ads.txt at root ✓
4. AdSense shows you a **verification meta tag**. Drop it into `NEXT_PUBLIC_ADSENSE_VERIFICATION_TAG` and redeploy.
5. **Wait.** Anywhere from a few hours to a few weeks. Most approvals come in 3-7 days for sites with original technical content.
6. On approval, Google emails you. You then:
   - Set `NEXT_PUBLIC_ADSENSE_CLIENT_ID` to your `ca-pub-…` ID.
   - Create the four ad units in the dashboard (in-feed fluid, vertical, two in-article).
   - Fill in `NEXT_PUBLIC_ADSENSE_SLOT_*` env vars.
   - Update `public/ads.txt` with your real publisher ID.
7. Deploy. Ads start showing within 30 minutes of the next user visit.

## What can still get you rejected

In order of likelihood:

1. **Vercel subdomain.** They'll politely reject `*.vercel.app` with "Insufficient site quality." Custom domain solves it.
2. **No real traffic.** AdSense doesn't have a public threshold but in practice they want to see real human visits over a few weeks. Submit a few weeks after launch, not day one.
3. **Privacy policy mentions AdSense but no actual ads visible at crawl time.** This is a chicken-and-egg trap: AdSense wants to see the integration in production before approving you to serve ads. The lab handles this — when `NEXT_PUBLIC_ADSENSE_CLIENT_ID` is set, the AdSense script loads and slots try to fill. Approved or not, the markup is there for the crawler.
4. **Reused content / scraped articles.** N/A — all content is original.
5. **Adult content / violence / regulated industries.** N/A.

## Maintenance after launch

- **Quarterly privacy review** — if you add analytics, change ad networks, or accept user accounts, update the policy.
- **Watch your invalid-traffic ratio** — Google penalises sites where >5% of clicks look invalid (mostly accidental self-clicks while testing — **don't** click your own ads, ever).
- **Don't put ads on `/privacy`, `/terms`, etc.** — policy pages aren't supposed to monetise. The lab's `<AdSlot/>` placements are already only on content pages.

## Files in this commit

```
ADSENSE_READINESS.md          this doc
app/privacy/page.tsx          privacy policy
app/terms/page.tsx            terms of service
app/about/page.tsx            about + license
app/contact/page.tsx          contact + bug-report link
app/sitemap.ts                dynamic sitemap from module registry
app/robots.ts                 robots.txt with sitemap pointer
src/legal/CookieConsent.tsx   banner + Consent Mode v2 wiring
src/legal/consentMode.ts      consent helpers (default denied, update on choice)
src/shell/SiteFooter.tsx      shared footer with policy links
```
