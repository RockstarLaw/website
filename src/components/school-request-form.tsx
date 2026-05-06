"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerSchoolRequest } from "@/lib/registration/actions";
import { COUNTRIES, US_STATES } from "@/lib/registration/options";
import { initialRegistrationState } from "@/lib/registration/types";

const inputClassName =
  "rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

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
        <select name="state" required className={inputClassName} defaultValue="">
          <option value="" disabled>Select a state</option>
          {US_STATES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2">
        <span>Postal code</span>
        <input name="postalCode" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Country</span>
        <select name="country" required className={inputClassName} defaultValue="United States">
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
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
        <p className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
          <p>{state.success}</p>
          <p className="mt-2 text-sm text-emerald-700">
            Return to <Link className="underline" href="/register">registration choices</Link> or <Link className="underline" href="/login">login</Link>.
          </p>
        </div>
      ) : null}

      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          Requests are created as pending review for admin follow-up.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-red-700 bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Submit school request"}
        </button>
      </div>

      <p className="md:col-span-2 text-sm italic text-slate-500">
        Bar passage is the floor, not the ceiling.
      </p>
    </form>
  );
}
