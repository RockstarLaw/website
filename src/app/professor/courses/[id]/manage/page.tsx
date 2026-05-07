import { SiteShell } from "@/components/site-shell";

export default async function ManageCoursePage() {
  return (
    <SiteShell title="Manage Course" description="" hideIntro>
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Manage Course</h1>
        <div className="mt-2 h-0.5 w-12 bg-red-700" />
        <p className="mt-6 text-base leading-7 text-slate-600">
          Course management tools are coming soon.
        </p>
      </div>
    </SiteShell>
  );
}
