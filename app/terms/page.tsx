import type { Metadata } from "next";
import { LegalPage } from "@/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use · React Rendering Lab",
  description:
    "Educational content disclaimer, MIT license for the source code, and the usual no-warranty boilerplate.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="legal" title="Terms of use" updated="2026-05-19">
      <p>
        React Rendering Lab is a free, open-source educational site. By using the site you agree
        to the following — they&apos;re short on purpose.
      </p>

      <h2>1. Educational use only</h2>
      <p>
        The content of the lab — written explanations, diagrams, code samples, profiling
        techniques, incident scenarios — is provided for educational purposes. We strive for
        accuracy but cannot guarantee that any technique shown is the right answer for your
        specific production application. Profile your own code, run your own benchmarks, and
        sanity-check claims against the React docs and your own measurements before shipping
        based on what you learn here.
      </p>

      <h2>2. License</h2>

      <h3>2.1 Source code</h3>
      <p>
        The lab&apos;s source code is licensed under the <strong>MIT license</strong>. You can
        fork it, modify it, ship it, embed pieces of it in your own teaching, sell derivative
        works — anything the MIT license permits.
      </p>

      <h3>2.2 Written content</h3>
      <p>
        The narrative text and explanations on each module page are released under a{" "}
        <strong>CC BY 4.0</strong> license — you may copy, adapt, and redistribute them with
        attribution to React Rendering Lab.
      </p>

      <h2>3. No warranty</h2>
      <p>
        The lab is provided <strong>&quot;as is&quot;</strong>, without warranty of any kind,
        express or implied, including but not limited to the warranties of merchantability,
        fitness for a particular purpose, or non-infringement. In no event shall the maintainers
        be liable for any claim, damages, or other liability arising from your use of the lab.
      </p>
      <p>
        Some of the lab&apos;s demos intentionally consume CPU or memory (the long-task burner in
        Module 5, the leak triggers in Module 23) to teach the underlying concept. We make those
        opt-in via buttons and clean up resources, but you use them at your own risk. If your
        laptop&apos;s fan starts up, that&apos;s the lab working as designed.
      </p>

      <h2>4. Advertising</h2>
      <p>
        Some pages display ads via Google AdSense. Ads are not endorsements. We don&apos;t
        control which specific advertisers show on which pages. If you see an ad that violates
        AdSense policy, you can{" "}
        <a href="https://support.google.com/adsense/troubleshooter/1631343" target="_blank" rel="noreferrer">
          report it to Google
        </a>
        .
      </p>

      <h2>5. Acceptable use</h2>
      <p>
        You agree not to use the lab to attempt to access non-public functionality, scrape it at
        a rate that affects availability for other users, or otherwise abuse it. The site is
        rate-limited by the hosting layer; please don&apos;t test the limits.
      </p>

      <h2>6. Third-party links</h2>
      <p>
        The lab links to external resources (React documentation, vendor docs, GitHub
        repositories, blog posts). We have no control over those sites and aren&apos;t
        responsible for their content or practices.
      </p>

      <h2>7. Changes</h2>
      <p>
        We&apos;ll update these terms occasionally. The &quot;last updated&quot; date at the top
        of this page reflects the most recent change.
      </p>

      <h2>8. Contact</h2>
      <p>
        Bug reports, security issues, license questions:{" "}
        <a href="https://github.com/mithun9421/react-rendering-lab/issues" target="_blank" rel="noreferrer">
          github.com/mithun9421/react-rendering-lab/issues
        </a>
        .
      </p>
    </LegalPage>
  );
}
