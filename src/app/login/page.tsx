import { ContentCard } from "@/components/content-card";
import { LoginForm } from "@/components/login-form";
import { SiteShell } from "@/components/site-shell";

export default function LoginPage() {
  return (
    <SiteShell
      eyebrow="Auth"
      title="Login"
      description="Supabase authentication is now wired into the app foundation. This page is ready for email/password sign-in while the broader role-based onboarding forms are built next."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ContentCard title="What works now">
          <ul className="grid gap-2 text-slate-200">
            <li>Email/password sign-in server action</li>
            <li>Supabase server client with cookie support</li>
            <li>Redirect into the dashboard shell after sign-in</li>
          </ul>
        </ContentCard>
        <ContentCard title="Sign in to Rockstar Law">
          <LoginForm />
        </ContentCard>
      </div>
    </SiteShell>
  );
}
