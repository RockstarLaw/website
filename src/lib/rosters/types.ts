// Plain types + state constants for the roster-create form.
// Lives outside actions.ts because Next.js's "use server" directive
// requires that file to export only async functions — object/type
// exports there raise "A 'use server' file can only export async
// functions" at runtime.

export type RosterActionState = {
  error: string;
  success: string;
};

export const initialRosterState: RosterActionState = {
  error: "",
  success: "",
};
