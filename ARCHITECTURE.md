# RockStar Law — Architecture & Decisions

These are locked architectural and process decisions for the RockStar Law platform. Do not modify or expand without explicit approval. Companion document to DESIGN_RULES.md (which covers visual rules).

## Purpose

RockStar Law is an educational platform that lets law students train on faithful replicas of real-world legal filing systems before entering practice. Professors assign work; students execute on simulated systems; the platform grades and provides line-by-line feedback.

## User Roles

Four distinct roles exist in the system:

- **student** — Registered learner. Pays for course access. Submits assignments. Receives grading and feedback.

- **professor** — Teaches courses on the platform. Creates assignments or selects from the prebuilt library. Manages course rosters. Reviews student matches against rosters. Grants TA access. Receives detailed feedback to share with students.

- **university** — University-side administrator (Dean, Associate Dean, President, Registrar). Not a teaching role. Manages the institution's overall presence on RockStar Law: course catalog, professor roster, billing.

- **admin** — RockStar Law platform staff only. Internal role. Never registered through the public site. Manages all schools, all data, system-level concerns.

The words "admin" and "administrator" are intentionally distinct: admin always means Rockstar platform staff. University-side administrators use the role name university.

## Authentication & Login

There is one /login route. It is role-neutral.

After successful authentication, the system reads the user's role from their profile and redirects to the appropriate dashboard:

- student → /dashboard/student
- professor → /dashboard/professor
- university → /dashboard/university
- admin → /dashboard/admin

The login page presents no role-specific copy. Registration links below the form direct first-time users to the appropriate registration path.

## Access Model — Account ≠ Access

A registered account does not by itself grant access to course content. Account is identity. Access is the permission to participate in a specific course in a specific role.

Anyone can register a free account. Account creation grants no course access.

There are three ways to gain course access:

1. **Student access** — purchased per course. Grants student-level participation in that course.
2. **TA access** — granted free by a Professor when adding the TA to a specific course. Scoped to that course only. The TA does not need to pay for a student subscription.
3. **Professor access** — granted by the University, or self-registered (final policy TBD). Free to the Professor.

A single account may hold multiple access grants simultaneously: Student in Course A (paid), TA in Course B (free), nothing in Course C.

## Teaching Assistant Model

Each course offers four TA slots: two free and two paid.

- Slots 1 and 2 are free for any active Professor.
- Slots 3 and 4 are grayed-out paid upgrades (paywall to unlock; pricing TBD).

TA slots are scoped per course, not per Professor. A Professor with four courses has up to eight free TA slots in total.

TA management lives on the Professor's course management page (Professor Dashboard → Courses list → individual course). It is not a global "TA list" page.

When a Professor invites a TA, they capture: First Name, Last Name, Phone Number, School Email.

The TA's school email must match the Professor's school domain. Future enhancement: when a University formally registers with multiple legitimate domains, all listed domains are acceptable.

If the invited email is already a registered RockStar account, the system links the TA grant to the existing account. No duplicate account is created.

If the invited email is not yet registered, the system creates an invitation and the TA registers via that flow. Specific mechanics (invitation link with token vs. placeholder grant) are TBD.

TA access expires when the inviting Professor's account is no longer valid for that course.

## Module Fidelity Rule

The platform has two distinct visual treatments for two distinct purposes:

- **Core site** — homepage, About, Why RockStar Law, Pricing, login, registration, dashboards, marketing surfaces. Modern, editorial, premium SaaS feel. See DESIGN_RULES.md.

- **Module simulations** — **StarBiz**, **USPTO**, **U.S. Copyright Office**, SEC, IRS, Courts. Faithfully replicate the actual government or agency user experience including outdated UI, dense forms, and dated styling. The "ugly UX" is intentional — fidelity to the real-world system is the product. Students must learn to navigate the systems they will actually use as attorneys.

Visual rules in DESIGN_RULES.md apply to the core site only. Module simulations follow the styling of their real-world counterparts.

## Initial Modules

- **StarBiz** — RockStar Law's portal based on the State of Florida's Business Filings Portal. File articles of incorporation, articles of organization, bylaws, membership agreements, annual reports, amendments, fictitious name filings, state trademark applications.
- **USPTO** — Search the trademark database, file trademark applications, receive and answer office actions, file renewals, file for incontestability.
- **U.S. Copyright Office** — File copyright applications, assign rights, record security interests, file DMCA designated agent registrations, file DMCA Section 1201 exemption petitions, file Notices of Intention.
- **Securities Exchange Commission** — File Form Ds, 10-Ks, 10-Qs, 8-Ks, insider transaction reports.
- **Internal Revenue Service** — File for Employer Identification Numbers and other federal tax filings.
- **Courts** — State, federal, and international court e-filing systems. New courts added monthly; on-request courts available within five business days of registration.

## Stack

- **Frontend:** Next.js (App Router)
- **Database & Auth:** Supabase (Postgres + Supabase Auth + Row-Level Security)
- **Payments:** Stripe (no card data stored on RockStar Law servers)
- **Deployment:** Vercel (when production-ready)
- **Agent backend** (development): Anthropic API key, token-based billing, not subscription

## Database Conventions

Database migrations are append-only. Once a migration has been applied to a deployed environment, it is treated as historical record. Schema changes are made through new migration files with later timestamps, not by editing existing migration files.

When renaming role values or other enum-like strings, both the application code and the database CHECK constraint must be updated together. The migration sequence is:

1. Backfill existing rows to the new value
2. Drop the old check constraint
3. Add the new check constraint with the updated set

## Build Discipline

The platform is built one vertical slice at a time. A vertical slice is one user-facing flow, completed end-to-end, demonstrably working, committed before the next slice begins.

Slices are sized small. "Build the copyright module" is too large; "build the LLC articles-of-organization form in StarBiz" is right-sized.

Every non-trivial slice begins with a written plan. The plan identifies the files to change, what changes will be made, and how completion will be verified. The plan is reviewed and approved before any code is written.

Every slice ends with manual verification. The verification step is described in user-facing terms — a list of actions a non-programmer can perform in a browser to confirm the slice works.

One slice equals one commit. Slices are not chained into single commits.

Pre-existing issues unrelated to a current slice are not fixed within that slice. They are tracked for separate cleanup.

## Naming Conventions

- **Brand wordmark in text:**
  - In body text: RockStar Law (capital S, capital L), normal text color
  - In a logo position (top-left of nav, etc.): ROCKSTAR LAW — all caps, primary red

- **Image filenames:** lowercase, hyphenated, scoped by purpose. Examples: about-operational-fluency-female.png, why-rockstar-law-operator.png.

- **Roles in code:** lowercase identifiers — student, professor, university, admin.

- **Routes:** lowercase, hyphenated. Role-specific dashboards live at /dashboard/<role>.

## Open Questions — Pending Decisions

These require explicit user decision before implementation:

1. TA invitation mechanics when the invited email is not registered: invitation link with one-time token, or placeholder grant that activates on registration.
2. Multi-domain support: when a University formally registers with multiple legitimate domains, the TA email match rule extends to all of them.
3. Professor onboarding policy: self-registration with verification, or University-issued invitation only.
4. Pricing structure: per-course subscription, per-term, per-academic-year, or other.
5. Top-row footer destinations not yet designed: Announcements, Community, University Center, Affiliates, Product Safety, Tips, Help & Contact, Site Map — each needs either a designed page, removal from the footer, or temporary placeholder.
