import type { Metadata } from "next";
import { LegalPage } from "@/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy · React Rendering Lab",
  description:
    "How React Rendering Lab handles cookies, advertising data, and your rights under GDPR and CCPA.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="legal" title="Privacy policy" updated="2026-05-19">
      <p>
        React Rendering Lab (&quot;the lab&quot;, &quot;we&quot;) is an open-source educational
        site at <code>react-rendering-lab</code>. We don&apos;t require accounts, we don&apos;t
        sell anything directly, and we collect as little as we can while keeping the site working
        and funded.
      </p>

      <h2>1. What we collect</h2>

      <h3>1.1 Things we collect ourselves</h3>
      <p>
        <strong>Almost nothing.</strong> The lab is statically rendered and runs entirely in your
        browser. We do not maintain user accounts, we do not run server-side analytics, and we
        don&apos;t set our own cookies that identify you.
      </p>
      <ul>
        <li>
          <strong>Local browser storage</strong> — small flags stored in your browser&apos;s{" "}
          <code>localStorage</code> to remember your choices: cookie consent (<code>rrl:consent</code>),
          Architect Mode toggle (<code>rrl:architect-mode</code>). These never leave your machine.
        </li>
        <li>
          <strong>Standard server logs</strong> kept by our hosting provider (Vercel) for a short
          window for security and abuse prevention. These include IP address, user-agent, and the
          URL requested. They&apos;re not joined to anything else.
        </li>
      </ul>

      <h3>1.2 Things our third parties collect</h3>

      <p>
        We use <strong>Google AdSense</strong> to show advertising on certain pages. With your
        permission, Google may:
      </p>
      <ul>
        <li>Set cookies in your browser to remember ad frequency caps and clicks.</li>
        <li>
          Receive your IP address, user-agent, and the URL you&apos;re viewing so it can choose
          an ad to show.
        </li>
        <li>
          If you&apos;ve consented to ad personalization, use Google&apos;s own data about you
          (from across the web) to choose more relevant ads.
        </li>
      </ul>
      <p>
        Google&apos;s practices are governed by their own{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          privacy policy
        </a>
        . Google is the data controller for the data they collect via AdSense.
      </p>

      <h2>2. How we use cookies</h2>
      <p>The lab uses cookies and similar technologies in three buckets:</p>
      <ul>
        <li>
          <strong>Functional (always on)</strong> — the <code>localStorage</code> entries above.
          We can&apos;t turn these off because they store your consent choice itself.
        </li>
        <li>
          <strong>Ads (consent required in EEA / UK)</strong> — Google AdSense cookies for ad
          delivery and frequency capping.
        </li>
        <li>
          <strong>Ad personalization (consent required in EEA / UK)</strong> — controls whether
          AdSense uses Google&apos;s cross-site data to personalize what you see.
        </li>
      </ul>
      <p>
        We use <strong>Google Consent Mode v2</strong> with all non-essential signals defaulting
        to <em>denied</em> on every page load. When you accept all cookies in the banner, we tell
        Google to switch them to <em>granted</em>. When you reject non-essential, Google
        continues to serve ads but uses no personal data to choose them.
      </p>
      <p>
        You can change your choice at any time using the &quot;Cookie preferences&quot; link in
        the footer.
      </p>

      <h2>3. Your rights</h2>

      <h3>3.1 If you&apos;re in the EEA / UK / Switzerland (GDPR / UK GDPR / FADP)</h3>
      <ul>
        <li>
          <strong>Right to access</strong> — request a copy of any personal data we hold about
          you. (For us, this is usually just your most recent server-log line.)
        </li>
        <li>
          <strong>Right to erasure</strong> — ask us to delete data we hold. Server logs roll off
          on their own; <code>localStorage</code> you can clear yourself in your browser.
        </li>
        <li>
          <strong>Right to object</strong> — withdraw consent for ad cookies any time via the
          banner.
        </li>
        <li>
          <strong>Right to portability</strong> — there isn&apos;t much to port; the only data
          unique to you is in your own browser&apos;s storage.
        </li>
      </ul>

      <h3>3.2 If you&apos;re in California (CCPA / CPRA)</h3>
      <ul>
        <li>
          We do not sell personal information for money. Sharing data with Google AdSense for
          advertising falls under CPRA&apos;s definition of &quot;sharing,&quot; which you can
          opt out of by selecting &quot;Reject non-essential&quot; in our cookie banner — that
          puts AdSense into non-personalized mode.
        </li>
        <li>You may request access and deletion of any data we hold (see addresses below).</li>
        <li>
          Selecting &quot;Reject non-essential&quot; is the equivalent of an opt-out preference
          signal under the CCPA.
        </li>
      </ul>

      <h3>3.3 Industry opt-outs</h3>
      <p>To opt out of Google&apos;s personalized advertising specifically:</p>
      <ul>
        <li>
          <a href="https://www.google.com/settings/ads" target="_blank" rel="noreferrer">
            Google ad settings
          </a>{" "}
          (covers all Google sites and apps)
        </li>
        <li>
          <a href="https://optout.networkadvertising.org/" target="_blank" rel="noreferrer">
            NAI consumer opt-out
          </a>
        </li>
        <li>
          <a href="https://www.youradchoices.com/" target="_blank" rel="noreferrer">
            YourAdChoices (US / DAA)
          </a>
        </li>
      </ul>

      <h2>4. Data retention</h2>
      <p>
        We don&apos;t retain personal data ourselves beyond standard hosting-provider logs (~30
        days). Google&apos;s retention of advertising data is governed by their privacy policy.
      </p>

      <h2>5. International transfers</h2>
      <p>
        The lab is hosted on Vercel, which uses global content-delivery infrastructure including
        servers outside your country. Google AdSense similarly operates globally. Both
        organisations rely on Standard Contractual Clauses (SCCs) for transfers out of the EEA.
      </p>

      <h2>6. Children</h2>
      <p>
        The lab is technical educational content not directed at children under 13. We don&apos;t
        knowingly collect data from anyone under 13.
      </p>

      <h2>7. Changes</h2>
      <p>
        We&apos;ll update this page when our practices change. Material changes (a new advertising
        partner, a new analytics tool) bump the &quot;last updated&quot; date at the top of this
        page.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions, GDPR / CCPA requests, or anything else — email <strong>mithun9421</strong> at{" "}
        <strong>github</strong>, or open an issue at{" "}
        <a href="https://github.com/mithun9421/react-rendering-lab/issues" target="_blank" rel="noreferrer">
          github.com/mithun9421/react-rendering-lab/issues
        </a>
        .
      </p>
    </LegalPage>
  );
}
