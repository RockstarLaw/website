"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  acceptTAInvitation,
  declineTAInvitation,
} from "@/lib/courses/ta-student-actions";
import { initialStudentTAState } from "@/lib/courses/ta-student-types";
import type { StudentTARow } from "@/lib/supabase/queries";

function TAInvitationRow({ row }: { row: StudentTARow }) {
  const router = useRouter();
  const [acceptState, acceptAction, acceptPending] = useActionState(
    acceptTAInvitation,
    initialStudentTAState,
  );
  const [declineState, declineAction, declinePending] = useActionState(
    declineTAInvitation,
    initialStudentTAState,
  );

  const anySuccess = acceptState.success || declineState.success;
  const anyPending = acceptPending || declinePending;

  useEffect(() => {
    if (anySuccess) {
      const t = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(t);
    }
  }, [anySuccess, router]);

  const invitedDate = new Date(row.invitedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <li className="flex items-start justify-between gap-6 border-b border-slate-200 pb-5">
      <div className="flex flex-col gap-0.5">
        <p className="font-medium text-slate-950">{row.courseName}</p>
        <p className="text-sm text-slate-600">{row.professorName}</p>
        <p className="text-xs text-slate-400">Invited {invitedDate}</p>
        {anySuccess && (
          <p className="mt-1 text-sm text-green-700">
            {acceptState.success || declineState.success}
          </p>
        )}
        {(acceptState.error || declineState.error) && (
          <p className="mt-1 text-sm text-red-700">
            {acceptState.error || declineState.error}
          </p>
        )}
      </div>

      {!anySuccess && (
        <div className="flex shrink-0 items-center gap-3">
          <form action={acceptAction}>
            <input type="hidden" name="assignmentId" value={row.assignmentId} />
            <button
              type="submit"
              disabled={anyPending}
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              {acceptPending ? "Accepting…" : "Accept"}
            </button>
          </form>
          <form action={declineAction}>
            <input type="hidden" name="assignmentId" value={row.assignmentId} />
            <button
              type="submit"
              disabled={anyPending}
              className="text-sm text-slate-600 hover:text-slate-950 disabled:opacity-60"
            >
              {declinePending ? "Declining…" : "Decline"}
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

export function StudentTAInvitations({ pending }: { pending: StudentTARow[] }) {
  return (
    <ul className="grid gap-0">
      {pending.map((row) => (
        <TAInvitationRow key={row.assignmentId} row={row} />
      ))}
    </ul>
  );
}
