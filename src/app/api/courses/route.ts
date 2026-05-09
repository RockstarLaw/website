// /api/courses — autocomplete endpoint for the Project Shop course filter and
// the Create Project course-tag input.
//
// GET /api/courses?q=<text>
//   Returns up to 20 courses whose course_name ILIKEs %q%, ordered by name.
//   Public (Project Shop pages are public per SESSION_HANDOFF.md §2A).
//
// Response shape:
//   { courses: [{ id, courseName, schoolName }] }

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type CourseRow = {
  id:          string;
  course_name: string;
  schools:     { name: string } | { name: string }[] | null;
};

export async function GET(req: NextRequest) {
  const q   = (req.nextUrl.searchParams.get("q")   ?? "").trim();
  const ids = req.nextUrl.searchParams.getAll("id");

  // Lookup-by-id mode: filter rail uses this to hydrate chip labels for the
  // ?course=<id>... URL params on first render.
  if (ids.length > 0) {
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from("courses")
      .select("id, course_name, schools(name)")
      .in("id", ids);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const rows = (data ?? []) as CourseRow[];
    const courses = rows.map((c) => {
      const sch = Array.isArray(c.schools) ? c.schools[0] : c.schools;
      return {
        id:         c.id,
        courseName: c.course_name,
        schoolName: sch?.name ?? "",
      };
    });
    return NextResponse.json({ courses });
  }

  if (!q) return NextResponse.json({ courses: [] });

  const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
  const admin = createSupabaseAdminClient();

  const { data, error } = await admin
    .from("courses")
    .select("id, course_name, schools(name)")
    .ilike("course_name", `%${escaped}%`)
    .eq("status", "active")
    .order("course_name", { ascending: true })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as CourseRow[];
  const courses = rows.map((c) => {
    const sch = Array.isArray(c.schools) ? c.schools[0] : c.schools;
    return {
      id:         c.id,
      courseName: c.course_name,
      schoolName: sch?.name ?? "",
    };
  });

  return NextResponse.json({ courses });
}
