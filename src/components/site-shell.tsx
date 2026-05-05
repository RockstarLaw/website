import Link from "next/link";
import { ReactNode } from "react";

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
    <div className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-700">
              RockStar Law
            </p>
            <p className="text-sm text-slate-500">
              Main registration and onboarding system
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

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        {hideIntro ? null : (
          <section className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
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
    </div>
  );
}
