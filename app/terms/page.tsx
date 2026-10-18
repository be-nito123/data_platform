import type { Metadata } from "next";
import DocumentPage from "@/components/DocumentPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms governing your use of the DataVault market data application, including licensing, data sources, disclaimers and liability.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <DocumentPage eyebrow="Legal" title="Terms of Service" updated="18 October 2026">
      <div className="site-callout">
        <strong>Template notice.</strong> These terms describe how the DataVault application is
        currently offered. Have them reviewed by a qualified adviser, and insert your legal entity
        name, registered address and governing jurisdiction (marked below) before launch.
      </div>

      <h2>1. Agreement</h2>
      <p>
        By accessing or using DataVault (the &ldquo;Service&rdquo;), you agree to these terms. If you
        do not agree, do not use the Service. If you use the Service on behalf of an organisation,
        you confirm you are authorised to bind that organisation.
      </p>

      <h2>2. The Service</h2>
      <p>
        The Service presents market data — exchange price and volume series and CFTC Commitments of
        Traders reporting — through charts, statistics panels and data sheets. We may add, change or
        withdraw features, instruments or datasets at any time.
      </p>

      <h2>3. Accounts</h2>
      <ul>
        <li>You must provide accurate registration information and keep it current.</li>
        <li>
          You are responsible for activity under your account and for keeping your credentials
          confidential.
        </li>
        <li>
          Notify us promptly at <a href="mailto:support@datavault.app">support@datavault.app</a> if
          you believe your account has been compromised.
        </li>
        <li>You must be old enough to enter a binding contract in your jurisdiction.</li>
      </ul>

      <h2>4. Plans, access and payment</h2>
      <ul>
        <li>
          Some parts of the Service require an entitlement, such as a time-limited access pass or a
          paid subscription.
        </li>
        <li>
          Payments, when enabled, are processed by a third-party payment provider, and are subject to
          that provider&rsquo;s terms. Access is granted for the period recorded against your
          entitlement.
        </li>
        <li>
          Unless stated otherwise at the point of purchase, fees are payable in advance and are
          non-refundable except where required by law. Please contact us before disputing a charge.
        </li>
        <li>
          We may change prices or plan features prospectively; changes will not reduce access you have
          already paid for during its current term.
        </li>
      </ul>

      <h2>4a. Redemption codes</h2>
      <p>
        Access codes are single-use, non-transferable and may expire. Sharing, reselling or
        attempting to guess or automate redemption of codes is prohibited and may result in
        termination without refund.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          scrape, crawl or bulk-extract the Service, or use automated tools to bypass rate limits or
          access controls;
        </li>
        <li>redistribute, resell, sublicense or republish the data or the Service;</li>
        <li>use the Service to build a competing data product;</li>
        <li>reverse engineer, probe or attempt to gain unauthorised access to any part of the Service;</li>
        <li>interfere with the Service or with other users&rsquo; access to it.</li>
      </ul>

      <h2>6. Data sources and accuracy</h2>
      <p>
        Market data is compiled from third-party sources, including exchange settlement feeds and
        CFTC Commitments of Traders publications. We do not create the underlying data, and we do not
        guarantee that it is complete, accurate, or current. Data may be delayed, revised, restated,
        interrupted or unavailable. Where a figure disagrees with the original source publication,
        the original source governs.
      </p>
      <p>
        All third-party data remains subject to the terms and usage policies of the originating
        source.
      </p>

      <h2>7. Not investment advice</h2>
      <p>
        The Service provides data and analytical tools only. Nothing in the Service is investment,
        legal, tax or accounting advice, or a recommendation, solicitation or offer to buy or sell
        any instrument. You are solely responsible for your own decisions. You should obtain
        independent advice where appropriate. We are not liable for any loss arising from reliance on
        information provided through the Service.
      </p>

      <h2>8. Intellectual property</h2>
      <p>
        The Service — its design, code, presentation and compiled datasets — is owned by us or our
        licensors. These terms grant you a limited, revocable, non-exclusive, non-transferable right
        to use the Service for your own internal purposes. No other rights are granted.
      </p>

      <h2>9. Availability</h2>
      <p>
        We aim to keep the Service available but do not promise uninterrupted access. We may suspend
        it for maintenance, or where we need to protect the Service or comply with the law.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may stop using the Service at any time. We may suspend or terminate your access if you
        breach these terms, if we are required to by law, or if we discontinue the Service. Where we
        discontinue the Service for our own convenience, we will refund any prepaid access that was
        not used.
      </p>

      <h2>11. Disclaimers</h2>
      <p>
        To the extent permitted by law, the Service is provided &ldquo;as is&rdquo; and
        &ldquo;as available&rdquo;, without warranties of any kind, whether express or implied,
        including fitness for a particular purpose, non-infringement or uninterrupted operation.
      </p>

      <h2>12. Limitation of liability</h2>
      <p>
        To the extent permitted by law, we are not liable for indirect, incidental, special,
        consequential or punitive damages, or for lost profits, revenue, data or trading losses. Our
        total aggregate liability arising from the Service is limited to the greater of the amount
        you paid us in the twelve months before the claim, or the minimum permitted by applicable
        law.
      </p>

      <h2>13. Changes to these terms</h2>
      <p>
        We may revise these terms. Continued use of the Service after a revision takes effect means
        you accept the revised terms.
      </p>

      <h2>14. General</h2>
      <p>
        If any provision is found unenforceable, the rest remains in effect. These terms are the
        entire agreement between us regarding the Service, and are governed by the laws of
        <strong> [insert governing jurisdiction]</strong>, with the courts of that jurisdiction having
        exclusive jurisdiction.
      </p>

      <h2>15. Contact</h2>
      <p>
        Questions about these terms: <a href="mailto:support@datavault.app">support@datavault.app</a>.
      </p>
    </DocumentPage>
  );
}
