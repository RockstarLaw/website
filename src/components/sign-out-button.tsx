import { signOut } from "@/lib/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-red-700 hover:text-slate-950"
      >
        Sign out
      </button>
    </form>
  );
}
