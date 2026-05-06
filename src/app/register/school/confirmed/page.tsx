import { SiteShell } from "@/components/site-shell";

export default function SchoolConfirmedPage() {
  return (
    <SiteShell title="Request received." description="" hideIntro>
      <div className="mx-auto w-full max-w-xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Request received.
        </h1>
        <div className="mx-auto mt-2 h-0.5 w-12 bg-red-700" />
        <p className="mt-6 text-base leading-7 text-slate-700">
          Your school registration request has been submitted. We&apos;ll review it and be in touch with next steps.
        </p>
        <p className="mt-10 text-sm italic text-slate-500">
          We don&apos;t book just any venue.
        </p>
      </div>
    </SiteShell>
  );
}
