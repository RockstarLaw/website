import { ContentCard } from "@/components/content-card";
import { SiteShell } from "@/components/site-shell";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function SupabaseStatusPage() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

  return (
    <SiteShell
      eyebrow="Infrastructure"
      title="Supabase connection status"
      description="This route checks whether the current environment can reach the configured Supabase project using the server-side key."
    >
      <div className="grid gap-6">
        <ContentCard title="Result">
          {error ? (
            <p className="text-rose-200">Connection failed: {error.message}</p>
          ) : (
            <div className="grid gap-2 text-slate-200">
              <p>Supabase connection succeeded.</p>
              <p>Project returned {data.users.length} user record(s) in the test request.</p>
            </div>
          )}
        </ContentCard>
      </div>
    </SiteShell>
  );
}
