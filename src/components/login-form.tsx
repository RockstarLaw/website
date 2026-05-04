"use client";

import { useActionState } from "react";

import { signInWithEmailPassword } from "@/lib/auth/actions";

const initialState = { error: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signInWithEmailPassword, initialState);

  return (
    <form action={formAction} className="grid gap-4">
      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-200">Email</span>
        <input
          required
          type="email"
          name="email"
          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
          placeholder="name@school.edu"
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium text-slate-200">Password</span>
        <input
          required
          type="password"
          name="password"
          className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-amber-400"
          placeholder="Enter your password"
        />
      </label>

      {state.error ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 font-medium text-white transition hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
