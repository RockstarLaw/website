import Link from "next/link";

import { ContentCard } from "@/components/content-card";
import { LoginForm } from "@/components/login-form";
import { SiteShell } from "@/components/site-shell";

export default function LoginPage() {
  return (
    <SiteShell
      eyebrow="Auth"
      title="Login"
      description="Sign in with the email and password created during registration. Successful sign-in redirects into the correct dashboard for the account role."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ContentCard title="Need an account first?">
          <ul className="grid gap-2 text-slate-200">
            <li><Link className="text-amber-300 hover:text-amber-200" href="/register/student">Student registration</Link></li>
            <li><Link className="text-amber-300 hover:text-amber-200" href="/register/professor">Professor registration</Link></li>
            <li><Link className="text-amber-300 hover:text-amber-200" href="/register/school">School request</Link></li>
          </ul>
        </ContentCard>
        <ContentCard title="Sign in to Rockstar Law">
          <LoginForm />
        </ContentCard>
      </div>
    </SiteShell>
  );
}
