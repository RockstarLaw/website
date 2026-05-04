"use client";

import { useActionState } from "react";

import {
  initialRegistrationState,
  registerProfessor,
} from "@/lib/registration/actions";
import type { SchoolOption } from "@/lib/supabase/queries";

const inputClassName =
  "rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-400";

export function ProfessorRegistrationForm({ schools }: { schools: SchoolOption[] }) {
  const [state, formAction, pending] = useActionState(
    registerProfessor,
    initialRegistrationState,
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <label className="grid gap-2">
        <span>First name</span>
        <input name="firstName" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Last name</span>
        <input name="lastName" required className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Title</span>
        <input name="title" placeholder="Professor, Adjunct Professor" className={inputClassName} />
      </label>
      <label className="grid gap-2">
        <span>Mobile phone</span>
        <input name="mobilePhone" required className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Email</span>
        <input type="email" name="email" required className={inputClassName} />
      </label>
      <label className="grid gap-2 md:col-span-2">
        <span>Password</span>
        <input type="password" name="password" required minLength={8} className={inputClassName} />
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
      <label className="grid gap-2 md:col-span-2">
        <span>Selected courses</span>
        <textarea
          name="selectedCourses"
          required
          rows={4}
          placeholder="Business Organizations\nContracts\nCivil Procedure"
          className={inputClassName}
        />
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
          New professor accounts enter the system with pending approval.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-5 py-3 font-medium text-white transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating account..." : "Create professor account"}
        </button>
      </div>
    </form>
  );
}
