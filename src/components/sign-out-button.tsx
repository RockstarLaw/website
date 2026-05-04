import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-full border border-white/10 px-3 py-1.5 text-sm text-slate-200 transition hover:border-amber-400 hover:text-white"
      >
        Sign out
      </button>
    </form>
  );
}
