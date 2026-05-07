import { SiteShell } from "@/components/site-shell";

export default async function ProjectShopPage() {
  return (
    <SiteShell title="Project Shop" description="" hideIntro>
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Project Shop.</h1>
        <div className="mt-2 h-0.5 w-12 bg-red-700" />
        <p className="mt-6 text-base leading-7 text-slate-600">
          Course projects will be available here.
        </p>
      </div>
    </SiteShell>
  );
}
