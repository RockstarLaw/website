"use client";

import { useActionState } from "react";

import { signInWithEmailPassword } from "@/lib/auth/actions";

const initialState = { error: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInWithEmailPassword, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          required
          type="email"
          name="email"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700"
          placeholder="name@school.edu"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          required
          type="password"
          name="password"
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700"
          placeholder="Enter your password"
        />
      </label>

      {state.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-red-700 bg-red-700 px-4 py-3 font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
