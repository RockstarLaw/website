import Link from "next/link";
import { ReactNode } from "react";

const footerLinks = [
  { label: "About RockStar Law" },
  { label: "Announcements" },
  { label: "Community" },
  { label: "Security Center", href: "/security-center" },
  { label: "University Center" },
  { label: "Policies", href: "/policies" },
  { label: "Affiliates" },
  { label: "Product Safety" },
  { label: "Tips" },
  { label: "Help & Contact" },
  { label: "Site Map" },
];

const legalLinks = [
  { label: "Accessibility" },
  { label: "User Agreement", href: "/policies/user-agreement" },
  { label: "Privacy" },
  { label: "Consumer Health Data" },
  { label: "Payments Terms of Use" },
  { label: "Cookies" },
  { label: "CA Privacy Notice" },
  { label: "Your Privacy Choices" },
];

import { primaryRoutes } from "@/lib/registration";

export function SiteShell({
  eyebrow,
  title,
  description,
  children,
  hideIntro = false,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  hideIntro?: boolean;
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-700">
              RockStar Law
            </p>
            <p className="text-sm text-slate-500">
              Train Here. Litigate Anywhere.<br />Graduate Courtroom Ready.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {primaryRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 transition hover:border-red-700 hover:text-slate-950"
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 flex-grow w-full">
        {hideIntro ? null : (
          <section className="py-4">
            {eyebrow ? (
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-red-700">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950">{title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              {description}
            </p>
          </section>
        )}
        {children}
      </main>

      <footer className="mt-10 bg-slate-100 px-6 py-12 text-slate-800 md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm leading-7 md:gap-x-10 md:gap-y-5">
            {footerLinks.map((item) =>
              item.href ? (
                <Link key={item.label} href={item.href}>{item.label}</Link>
              ) : (
                <span key={item.label}>{item.label}</span>
              ),
            )}
          </div>

          <p className="mt-10 text-sm leading-7 text-slate-700 md:mt-12">
            Copyright &copy; 2026 RockStar Law Education Services Inc. All Rights Reserved.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm leading-7 text-slate-700 md:mt-6 md:gap-x-8 md:gap-y-4">
            {legalLinks.map((item) =>
              item.href ? (
                <Link key={item.label} href={item.href}>{item.label}</Link>
              ) : (
                <span key={item.label}>{item.label}</span>
              ),
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
