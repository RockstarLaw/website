import Link from "next/link";
import { ReactNode } from "react";

import { primaryRoutes } from "@/lib/registration";

export function SiteShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Rockstar Law
            </p>
            <p className="text-sm text-slate-300">
              Main registration and onboarding system
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm">
            {primaryRoutes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className="rounded-full border border-white/10 px-3 py-1.5 text-slate-200 transition hover:border-amber-400 hover:text-white"
              >
                {route.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-4xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            {description}
          </p>
        </section>
        {children}
      </main>
    </div>
  );
}
