# Rockstar Law Registration App

Main Rockstar Law registration and onboarding MVP scaffold.

## Scope of this app
This app is for the platform-level Rockstar Law shell only:
- student registration
- professor registration
- school/university onboarding
- roster upload shell
- match review shell
- admin review shell

It does **not** include the separate filing simulation modules such as StarBiz, Copyright Office, USPTO, IRS, SEC, or Courts.

## Current scaffold status
Implemented in this pass:
- Next.js + TypeScript app scaffold
- App Router route shell
- Rockstar-branded shell styling
- Supabase browser/server/admin client utilities
- Email/password login server action
- Initial SQL migration for registration/auth data model
- Placeholder routes for:
  - `/`
  - `/login`
  - `/register`
  - `/register/student`
  - `/register/professor`
  - `/register/school`
  - `/dashboard/student`
  - `/dashboard/professor`
  - `/dashboard/admin`
  - `/professor/rosters`
  - `/professor/rosters/new`
  - `/professor/matches`
  - `/admin/schools`
  - `/admin/users`
  - `/admin/matches`
- Shared registration constants for statuses and account types
- `.env.example` and `.env.local` wiring for Supabase

## What remains next
1. Apply the SQL migration inside Supabase SQL Editor
2. Add registration server actions that create auth users + profile rows
3. Wire role-based redirects after login
4. Build real student/professor/school forms
5. Build roster upload parsing and preview
6. Build matching review actions and dashboard queries
7. Add protected routes and onboarding completion checks

## Local development
```bash
npm install
npm run dev
```

Then open the local Next.js URL shown in the terminal.

## Environment setup
Copy:
```bash
cp .env.example .env.local
```

Then fill in Supabase values.

## Apply the database foundation
Because Supabase CLI is not installed on this machine yet, the fastest path is:
1. Open the Supabase project dashboard
2. Go to SQL Editor
3. Paste the contents of:
   `supabase/migrations/20260504_rockstar_registration_mvp.sql`
4. Run it once

## Quick verification routes
- `/login` exercises the auth sign-in server action
- `/supabase-status` checks whether the server-side key can reach the configured Supabase project
Run system: npm run mvp
Verified: npm run mvp executes full registration flow successfully
