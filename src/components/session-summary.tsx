import { getCurrentSession } from "@/lib/auth/session";

export async function SessionSummary() {
  const session = await getCurrentSession();

  if (!session) {
    return (
      <p className="text-sm text-slate-600">
        No active session detected yet. Once auth is fully connected to registration flows, signed-in users will see role-aware dashboard content here.
      </p>
    );
  }

  return (
    <div className="grid gap-1 text-sm text-slate-700">
      <p>
        <span className="font-semibold text-slate-950">Signed in as:</span>{" "}
        {session.user.email}
      </p>
      <p>
        <span className="font-semibold text-slate-950">User ID:</span> {session.user.id}
      </p>
    </div>
  );
}
