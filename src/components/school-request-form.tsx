"use client";

import { useActionState } from "react";

import {
  initialRegistrationState,
  registerSchoolRequest,
} from "@/lib/registration/actions";

const inputClassName =
  "rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-400";

export function SchoolRequestForm() {
  const [state, formAction, pending] = useActionState(
    registerSchoolRequest,
    initialRegistrationState,
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2 md:col-span-2">
        <span>School name</span>
        <input name="schoolName" required className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Street address</span>
        <input name="addressLine1" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>City</span>
        <input name="city" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>State</span>
        <input name="state" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Postal code</span>
        <input name="postalCode" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Country</span>
        <input name="country" defaultValue="United States" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Admin contact name</span>
        <input name="adminContactName" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Admin contact email</span>
        <input type="email" name="adminContactEmail" required className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Website URL</span>
        <input name="websiteUrl" placeholder="https://www.example.edu" className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Email domains</span>
        <input name="domains" placeholder="lawschool.edu, alumni.lawschool.edu" className={inputClassName} />
      </label>

      {state.error ? (
        <p className="md:col-span-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-rose-200">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="md:col-span-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-200">
          {state.success}
        </p>
      ) : null}

      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">
          Requests are created as pending review for admin follow-up.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-3 font-medium text-white transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Submit school request"}
        </button>
      </div>
    </form>
  );
}
