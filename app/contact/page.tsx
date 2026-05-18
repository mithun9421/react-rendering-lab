import type { Metadata } from "next";
import { LegalPage } from "@/legal/LegalPage";

export const metadata: Metadata = {
  title: "Contact · React Rendering Lab",
  description:
    "How to reach the maintainers — GitHub issues for bugs and feedback, email for privacy and legal.",
};

export default function ContactPage() {
  return (
    <LegalPage eyebrow="contact" title="Contact">
      <p>
        The lab is an open-source project. Most communication happens on GitHub.
      </p>

      <h2>Bug reports & feature requests</h2>
      <p>
        Open an issue at{" "}
        <a href="https://github.com/mithun9421/react-rendering-lab/issues" target="_blank" rel="noreferrer">
          github.com/mithun9421/react-rendering-lab/issues
        </a>
        .
      </p>
      <p>
        If you&apos;re reporting something the lab claims is true but you can&apos;t reproduce —
        please include your browser, OS, and a short clip or screenshot. Half the bugs that look
        like content bugs turn out to be Chrome-specific PerformanceObserver behaviour.
      </p>

      <h2>Security issues</h2>
      <p>
        For anything that could harm visitors (XSS, dependency CVEs, exposed secrets), open a{" "}
        <a
          href="https://github.com/mithun9421/react-rendering-lab/security/advisories/new"
          target="_blank"
          rel="noreferrer"
        >
          private security advisory
        </a>{" "}
        on GitHub instead of a public issue. We&apos;ll respond within a few days.
      </p>

      <h2>Privacy &amp; legal requests</h2>
      <p>
        GDPR access / deletion requests, DMCA notices, CCPA opt-outs that you can&apos;t complete
        via the cookie banner — open a GitHub issue titled <code>[privacy]</code>, or email{" "}
        <strong>mithun9421</strong> at <strong>github</strong>. We&apos;ll route it through and
        respond within 30 days as required.
      </p>

      <h2>Press / business</h2>
      <p>The lab is a side project. There&apos;s no commercial offering and we&apos;re not for sale.</p>

      <h2>Want to contribute a module?</h2>
      <p>
        Open an issue first with the topic and rough outline. The bottleneck-chain narrative is
        important — new modules need to link cleanly into the existing arc. If we agree on the
        shape, send a pull request.
      </p>
    </LegalPage>
  );
}
