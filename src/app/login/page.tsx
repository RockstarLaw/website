import Link from "next/link";

import { LoginForm } from "@/components/login-form";
import { SiteShell } from "@/components/site-shell";

export default function LoginPage() {
  return (
    <SiteShell title="Sign In" description="" hideIntro>
      <div className="mx-auto w-full max-w-sm px-2">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Sign In</h1>
          <div className="mx-auto mt-2 h-0.5 w-12 bg-red-700" />
        </div>

        <LoginForm />

        <div className="mt-8 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Need an account?</p>
          <ul className="mt-2 grid gap-1.5">
            <li>
              <Link href="/register/student" className="text-red-700 hover:text-red-800">
                → Student registration
              </Link>
            </li>
            <li>
              <Link href="/register/professor" className="text-red-700 hover:text-red-800">
                → Professor registration
              </Link>
            </li>
            <li>
              <Link href="/register/school" className="text-red-700 hover:text-red-800">
                → School request
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </SiteShell>
  );
}
