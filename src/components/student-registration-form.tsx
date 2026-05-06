"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerStudent } from "@/lib/registration/actions";
import { COUNTRIES, ENROLLMENT_STATUSES, LAW_SCHOOL_YEARS, US_STATES } from "@/lib/registration/options";
import { initialRegistrationState } from "@/lib/registration/types";
import type { SchoolOption } from "@/lib/supabase/queries";

const inputClassName =
  "rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

export function StudentRegistrationForm({ schools }: { schools: SchoolOption[] }) {
  const [state, formAction, pending] = useActionState(
    registerStudent,
    initialRegistrationState,
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2">
        <span>First name</span>
        <input name="firstName" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Middle name</span>
        <input name="middleName" className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Last name</span>
        <input name="lastName" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Preferred name</span>
        <input name="preferredName" className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Login email</span>
        <input type="email" name="email" required className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>University email</span>
        <input type="email" name="universityEmail" required className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Password</span>
        <input type="password" name="password" required minLength={8} className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Mobile phone</span>
        <input name="mobilePhone" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Law school year</span>
        <select name="lawSchoolYear" className={inputClassName} defaultValue="">
          <option value="">Select year</option>
          {LAW_SCHOOL_YEARS.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Street address</span>
        <input name="addressLine1" required className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Address line 2</span>
        <input name="addressLine2" className={inputClassName} />
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
      <label className="grid gap-2 md:col-span-2">
        <span>Enrollment status</span>
        <select name="enrollmentStatus" className={inputClassName} defaultValue="">
          <option value="">Select status</option>
          {ENROLLMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Undergraduate institution</span>
        <input name="undergraduateInstitution" className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>University / school</span>
        <select name="schoolId" required className={inputClassName} defaultValue="">
          <option value="" disabled>
            Select a school
          </option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name} — {school.city}, {school.state} ({school.status})
            </option>
          ))}
        </select>
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
            Next step: <Link className="underline" href="/login">log in to continue</Link>.
          </p>
        </div>
      ) : null}

      <div className="md:col-span-2 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          If your school is missing, use the school registration path first.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-red-700 bg-red-700 px-5 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create student account"}
        </button>
      </div>

      <p className="md:col-span-2 text-sm italic text-slate-500">
        ...because reading cases ain&apos;t the same as filing them.
      </p>
    </form>
  );
}
