import { SiteShell } from "@/components/site-shell";

export default async function SelectProfessorPage() {
  return (
    <SiteShell title="Select a Professor" description="" hideIntro>
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Select a Professor
        </h1>
        <div className="mt-2 h-0.5 w-12 bg-red-700" />
        <p className="mt-6 text-base leading-7 text-slate-600">
          Professor selection will be available here. Check back soon.
        </p>
      </div>
    </SiteShell>
  );
}
