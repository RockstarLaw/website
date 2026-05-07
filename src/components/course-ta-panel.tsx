"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { inviteTA, revokeTA } from "@/lib/courses/ta-actions";
import { initialTAState } from "@/lib/courses/ta-types";
import type { CourseTARow } from "@/lib/supabase/queries";

const inputClassName =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-red-700";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    accepted: "bg-green-50 text-green-700",
    declined: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-500"}`}
    >
      {status}
    </span>
  );
}

function RevokeForm({ assignmentId }: { assignmentId: string }) {
  const [state, formAction, pending] = useActionState(revokeTA, initialTAState);
  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="assignmentId" value={assignmentId} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-700 hover:underline disabled:opacity-50"
      >
        {pending ? "Revoking…" : "Revoke"}
      </button>
      {state.error && <span className="text-xs text-red-700">{state.error}</span>}
    </form>
  );
}

export function CourseTAPanel({
  professorCourseId,
  initialTAs,
}: {
  professorCourseId: string;
  initialTAs: CourseTARow[];
}) {
  const router = useRouter();
  const [inviteState, inviteAction, invitePending] = useActionState(inviteTA, initialTAState);

  // Clear stale invite message after success by refreshing the server component.
  useEffect(() => {
    if (inviteState.success) {
      const t = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(t);
    }
  }, [inviteState.success, router]);

  const freeSlotsUsed = initialTAs.filter(
    (ta) =>
      ta.slotType === "free" &&
      (ta.status === "pending" || ta.status === "accepted"),
  ).length;

  const slotsFull = freeSlotsUsed >= 2;

  return (
    <div className="flex flex-col gap-8">

      {/* Slot counters */}
      <div className="flex flex-wrap gap-6 text-sm">
        <span className={freeSlotsUsed >= 2 ? "font-semibold text-red-700" : "text-slate-700"}>
          Free TAs: {freeSlotsUsed} / 2
        </span>
        <span className="text-slate-400">Paid TAs: 0 / 2 — coming soon</span>
      </div>

      {/* Current TA list */}
      {initialTAs.length > 0 ? (
        <ul className="grid gap-4">
          {initialTAs.map((ta) => (
            <li
              key={ta.id}
              className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4"
            >
              <div>
                <p className="font-medium text-slate-900">
                  {ta.student.firstName} {ta.student.lastName}
                </p>
                <p className="text-sm text-slate-500">{ta.student.universityEmail}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={ta.status} />
                {ta.status !== "declined" && <RevokeForm assignmentId={ta.id} />}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No TAs invited yet.</p>
      )}

      {/* Invite form */}
      {slotsFull ? (
        <p className="text-sm text-slate-500">Free TA slots are full for this course.</p>
      ) : (
        <form action={inviteAction} className="flex flex-col gap-4">
          <input type="hidden" name="professorCourseId" value={professorCourseId} />
          <input type="hidden" name="slotType" value="free" />
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-700">
              Invite a TA by university email
            </span>
            <input
              type="email"
              name="email"
              required
              placeholder="student@law.edu"
              className={inputClassName}
              style={{ maxWidth: "24rem" }}
            />
          </label>
          {inviteState.error && (
            <p className="text-sm text-red-700">{inviteState.error}</p>
          )}
          {inviteState.success && (
            <p className="text-sm text-green-700">{inviteState.success}</p>
          )}
          <div>
            <button
              type="submit"
              disabled={invitePending}
              className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {invitePending ? "Sending…" : "Invite"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
