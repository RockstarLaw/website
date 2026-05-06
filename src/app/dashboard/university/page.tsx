import { SiteShell } from "@/components/site-shell";

export default function UniversityDashboardPage() {
  return (
    <SiteShell title="University Dashboard" description="" hideIntro>
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          University Dashboard
        </h1>
        <div className="mx-auto mt-2 h-0.5 w-16 bg-red-700" />
        <p className="mt-6 text-base text-slate-500">
          University administration tools are coming soon.
        </p>
      </div>
    </SiteShell>
  );
}
