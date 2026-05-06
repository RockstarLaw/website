import type { Metadata } from "next";
import Link from "next/link";

import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Legal & Policies | RockStar Law",
};

const policies = [
  { label: "Terms of Service", href: "/policies/terms" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Acceptable Use Policy", href: "/policies/acceptable-use" },
  { label: "Educational Disclaimer", href: "/policies/educational-disclaimer" },
  { label: "Refund and Cancellation Policy", href: "/policies/refund-cancellation" },
  { label: "Cookie Policy", href: "/policies/cookies" },
  { label: "Accessibility Statement", href: "/policies/accessibility" },
  { label: "Intellectual Property Policy", href: "/policies/intellectual-property" },
  { label: "Student Code of Conduct", href: "/policies/student-code-of-conduct" },
  { label: "Professor and Institution Agreement", href: "/policies/professor-institution-agreement" },
  { label: "Data Retention and Account Deletion", href: "/policies/data-retention-account-deletion" },
  { label: "DMCA / Copyright Infringement Policy", href: "/policies/dmca-copyright-infringement" },
  { label: "Children's Privacy (COPPA)", href: "/policies/childrens-privacy-coppa" },
  { label: "FERPA Compliance Statement", href: "/policies/ferpa-compliance" },
  { label: "Contact and Disputes", href: "/policies/contact-disputes" },
];

export default function PoliciesPage() {
  return (
    <SiteShell title="Legal & Policies" description="" hideIntro>
      <section className="flex flex-col gap-6 py-2 md:gap-8 md:py-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            Legal & Policies
          </h1>
          <p className="max-w-4xl text-base leading-7 text-slate-700 md:text-lg">
            Welcome to RockStar Law&apos;s policies center. Below you will find the complete set of legal and operational policies that govern your use of our platform. Please review the policy relevant to your situation, or contact us at legal@rockstar.law with any questions.
          </p>
        </div>

        <nav aria-label="Policies" className="flex flex-col gap-3 pt-2">
          {policies.map((policy) => (
            <Link
              key={policy.href}
              href={policy.href}
              className="text-base font-medium text-slate-900 transition hover:text-red-700"
            >
              {policy.label}
            </Link>
          ))}
        </nav>
      </section>
    </SiteShell>
  );
}
