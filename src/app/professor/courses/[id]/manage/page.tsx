import { notFound, redirect } from "next/navigation";

import { CourseTAPanel } from "@/components/course-ta-panel";
import { SiteShell } from "@/components/site-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCourseTAs } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export default async function ManageCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createSupabaseAdminClient();

  // Get professor profile
  const { data: professor } = await admin
    .from("professor_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!professor) redirect("/login");

  // Get professor_course and verify ownership in one query
  const { data: profCourse } = await admin
    .from("professor_courses")
    .select("id, custom_course_name, section_name, term, courses(course_name)")
    .eq("id", id)
    .eq("professor_id", professor.id)
    .maybeSingle();

  if (!profCourse) notFound();

  const courseData = Array.isArray(profCourse.courses)
    ? profCourse.courses[0]
    : profCourse.courses;
  const courseName =
    profCourse.custom_course_name ??
    (courseData as { course_name: string } | null)?.course_name ??
    "Unnamed course";
  const sectionInfo = [profCourse.section_name, profCourse.term]
    .filter(Boolean)
    .join(" · ");

  const tas = await getCourseTAs(id);

  return (
    <SiteShell title="Manage Course" description="" hideIntro>
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-12">

        {/* Page header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Manage Course
          </h1>
          <div className="mt-2 h-0.5 w-12 bg-red-700" />
          <p className="mt-3 text-base text-slate-700">{courseName}</p>
          {sectionInfo && (
            <p className="mt-1 text-sm text-slate-400">{sectionInfo}</p>
          )}
        </div>

        {/* Teaching Assistants section */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">
              Teaching Assistants
            </h2>
            <div className="mt-1 h-0.5 w-8 bg-red-700" />
          </div>
          <CourseTAPanel professorCourseId={id} initialTAs={tas} />
        </section>

      </div>
    </SiteShell>
  );
}
