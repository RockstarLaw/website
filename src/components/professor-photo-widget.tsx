"use client";

import Image from "next/image";
import { useActionState } from "react";

import {
  deleteProfessorPhoto,
  uploadProfessorPhoto,
} from "@/lib/professor/profile-actions";
import { initialPhotoState } from "@/lib/projects/project-types";

export function ProfessorPhotoWidget({
  photoUrl,
  photoPath,
  professorName,
}: {
  photoUrl: string | null;
  photoPath: string | null;
  professorName: string;
}) {
  const [uploadState, uploadAction, uploadPending] = useActionState(
    uploadProfessorPhoto,
    initialPhotoState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteProfessorPhoto,
    initialPhotoState,
  );

  const initials = professorName
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-5">
      {/* Photo or initials placeholder */}
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={professorName}
          width={64}
          height={64}
          className="rounded-full object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-base font-semibold text-slate-600">
          {initials}
        </div>
      )}

      {/* Upload / remove controls */}
      <div className="flex flex-col gap-2">
        <form action={uploadAction} encType="multipart/form-data">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="file"
              name="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              required
              className="text-xs text-slate-600 file:mr-2 file:rounded-full file:border-0 file:bg-red-700 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-red-800"
              onChange={(e) => e.target.form?.requestSubmit()}
            />
          </label>
          {uploadState.error   && <p className="text-xs text-red-700">{uploadState.error}</p>}
          {uploadState.success && <p className="text-xs text-green-700">{uploadState.success}</p>}
          {uploadPending && <p className="text-xs text-slate-400">Uploading…</p>}
        </form>

        {photoPath && (
          <form
            action={deleteAction}
            onSubmit={(e) => {
              if (!confirm("Remove your profile photo?")) e.preventDefault();
            }}
          >
            <button
              type="submit"
              disabled={deletePending}
              className="text-xs text-slate-500 hover:text-red-700 hover:underline disabled:opacity-50"
            >
              {deletePending ? "Removing…" : "Remove photo"}
            </button>
            {deleteState.error && <span className="ml-1 text-xs text-red-700">{deleteState.error}</span>}
          </form>
        )}
      </div>
    </div>
  );
}
