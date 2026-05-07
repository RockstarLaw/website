# TA_POWERS.md

## Purpose

This document locks the capabilities and constraints of Teaching Assistants on the RockStar Law platform. TA Powers are the actions a TA can take *as a TA* — distinct from anything that same user might do as a student, professor, or in any other role.

This is the operating contract: what TAs can do, what they cannot do, and the trust posture that explains the distinction.

## Foundational architecture

A TA is a *relationship to a section taught by a specific professor*, not a global role flip. A 2L or 3L can be a student in their own courses and a TA in a 1L course taught by another professor. Their TA capabilities apply *only to the specific professor's section they were invited to*. They have no elevated capability anywhere else in the system.

The relationship is tracked in the `course_tas` table — per-section TA pool, schema shipped and verified end-to-end. A TA must be an existing user with role=student. Two free slots and two paid slots per professor's section. Paid slots are reserved at the schema level but disabled at the action layer until Stripe integration lands.

The acceptance flow is also live: pending invitations show on the invited student's dashboard with Accept/Decline buttons; accepted assignments appear in a separate "Your TA Assignments" section. The professor sees status changes (pending → accepted) reflected on the manage-course page in real time.

This is the substrate. The capabilities below describe what an *accepted* TA can do in the section where they were accepted.

## The Powers

### Power 1 — Download projects from the professor's MY PROJECTS widget

A TA can download project source materials from the professor's MY PROJECTS widget for the section in which they are an active TA.

**Why it exists.** Some projects benefit from physical hard copies. The professor wants to hand out printed packets (the General Rules document, the per-side confidential briefs, exhibits, supporting documents), set up exhibit tables, tape pages to walls, stage materials around the classroom. The TA performs this physical setup so the professor can focus on substantive teaching. Downloading the project lets the TA prepare without requiring the professor to perform the file-management step.

**Scope.**

- The TA can download projects only from the professor's MY PROJECTS widget for the *specific section* where they are an active TA.
- If the same user is also a regular student in a different course, the TA download capability does not apply in that other course's context.
- Download applies to project *source materials*: the professor's uploaded packet, the assignment instructions, exhibits, supporting documents.
- Download does NOT include student submissions, other students' work, or anything produced by other students in any project.

**File format.** The TA downloads files in the *original upload format* the professor used (PDF, DOCX, image, etc.) without system-side conversion or bundling. Whatever the professor uploaded, the TA gets the same file.

### Power 2 — Assign projects to the section

A TA can take a project from the professor's library and assign it to the section, including setting the due date.

**Why it exists.** Professors delegate project deployment so they can focus on substantive teaching. A TA receiving "assign Fruit Fight to Tuesday's class with a Friday due date" should be able to execute that without the professor performing the assignment step themselves.

**Scope.**

- TA can assign any project from the professor's MY PROJECTS widget to the section where they are an active TA.
- TA sets the due date.
- Assignment is immediate. It does not require professor pre-approval. The trust assumption is that the professor instructed the TA to assign.
- Every assignment is attributed and visible to the professor: "Assigned by [TA name] on [date]." The professor knows what their TA did and when.

**Notification.** When a TA assigns a project, the professor receives a notification *by text message* (SMS) — not in-app, not email. The notification fires at the moment of assignment.

**Implementation deferred.** SMS infrastructure (Twilio or equivalent) is not yet wired into the platform. Until it is, the notification is captured as a design intent rather than a live behavior. When Power 2 is built, the assignment action records the notification intent in a queue; when SMS infrastructure ships, the queue starts firing. Compliance scaffolding (10DLC registration, TCPA opt-in capture at registration) needs to be in place before the first SMS goes out.

### Power 3 — Label student matchups for VERSUS projects

A TA can pair students for VERSUS-mode projects — head-to-head simulations where each student is matched against one opponent (Fruit Fight is the canonical example).

**Trigger.** When a project labeled VERSUS is loaded in the section, a "MATCH UPS" button activates. Without that label, no matchup tool appears.

**Roster numbering.** The professor loads a class roster. The order students appear in that loaded roster *is* the 1, 2, 3, 4, 5 sequence used by the matchup tool. First student loaded is 1, second is 2, and so on. A given student may be odd-numbered in one class and even-numbered in another — it doesn't matter, because the numbering is invisible to students. It exists solely as an internal mechanism for auto-dividing the section into two columns when manual pairing isn't done.

**The matchup interface.** Pressing the MATCH UPS button opens a page laid out as follows:

- **Left column**: all *odd-numbered* students from the section roster (1st, 3rd, 5th, etc.), hardcoded in roster order.
- **Right column**: a pulldown menu next to each odd-numbered student. The pulldown contains:
  - All *even-numbered* students from the roster.
  - All section TAs.
  - The professor.
  - A "Randomize" option (see below).
- **Gray-out logic**: when an even-numbered *student* is selected in any pulldown, that student is grayed out in all subsequent pulldowns. Each student-to-student match is one-to-one.
- **TAs and the professor never gray out.** They remain selectable in every pulldown. A TA or the professor can be the counterparty in any number of matches — including, theoretically, every match in the section if needed. This makes the odd-count case (more odd-numbered students than even-numbered students) trivially handled: a TA or the professor can fill the gap.

**Randomization.** Two complementary controls let the TA randomize matches:

1. **Page-level "Randomize" button** at the top of the matchup page. Fills all *unfilled* pulldowns with valid random pairings. Any pulldown the TA has manually set stays locked. The TA can lock the matches that matter, then click Randomize and the rest fill in.
2. **Per-pulldown "Randomize" option** as one of the choices inside each dropdown (sitting at the top of the option list, above the names). Selecting it picks one of the still-available even-numbered students at random for that specific match, then commits and grays them out everywhere else — same effect as a manual selection, just chosen by RNG.

There is no auto-cascade — randomization happens only when the TA explicitly triggers it (manually picks Randomize from a dropdown, presses the page-level Randomize button, or submits the page empty as a fallback default).

**Submit-empty fallback.** If the TA submits the matchup page without making any selections, the system pairs students randomly using the same rules as the Randomize button.

**Optional pattern: two-students-team-up.** The matchup tool supports an ad-hoc pattern where two students from one column share a single match against one student on the other column. This is a teaching-moment override the TA can apply when the section's dynamic calls for it (e.g., a student who would benefit from being paired with a stronger peer against a tough opponent). Pattern observed in a real Fruit Fight class run: Lorenzo & Thykadavil teamed against Gotfried.

**Drop handling.** Students dropping mid-project is handled outside the system. Real law school students rarely drop mid-semester, and when they do, the professor reorganizes pairings manually outside the platform. The matchup tool does not track or respond to roster changes after matches are set. (Future builds may add drop-aware re-pairing if usage warrants it.)

### Power 4 — Project role assignments (half-defined, pending PROJECT_SPEC.md)

For projects that author specific TA character roles into them — the trademark examiner, opposing counsel's witness, the angry client, the bailiff, the customs inspector, the judge — TAs receive role assignments when the project is assigned to their section.

**What is locked now.**

- The *project* (not the professor, not the TA) defines the role(s).
- The project auto-assigns roles to TAs in the section. The professor does not have an approval step. If the casting needs to be different, the TAs sort it out among themselves — they're A students, not adversaries.
- TAs do not choose their roles — the project's authoring assigns them.
- TAs receive the role spec, character notes, scripts, costume/prop requirements, and any prep materials.
- TAs can mark themselves prepped/ready before class.

**What is not yet locked.**

- The data shape of a project's TA role definitions (depends on PROJECT_SPEC.md).
- What happens when a project requires more roles than a section has TAs: professor fills the gap, project declines to run, or system warns "needs N TAs to run as designed."
- What happens when there are more TAs than roles: extras are observers, setup-only, or co-cast.

This power becomes fully defined once project structure is locked. For now, the architectural intent is recorded.

## Future Powers (deferred until prerequisites exist)

### Messaging students about their work

When in-app messaging is built, TAs gain the ability to message students in their section about their work — limited to operational logistical messaging ("Hey, where's your project?"). This is administrative, not pedagogical — TAs remain operators on behalf of the professor, not feedback givers or graders.

This power is gated on messaging infrastructure existing in the platform. Until then, it does not exist.

## Hard Nos

The following capabilities are explicitly outside TA scope. They cannot be granted as exceptions, expanded with additional permissions, or backdoored through other features:

- **No feedback on student work.** TAs do not leave comments, notes, written critique, or qualitative feedback on student filings, drafts, briefs, or submissions of any kind.
- **No grading.** TAs do not grade anything that contributes to a student's final grade. Even practice exercises designated as "review-only" are off-limits.
- **No marking students as needing help.** TAs cannot flag a student for professor attention through any system mechanism.
- **No suggesting mode changes.** TAs cannot recommend a student be moved between Guided / Assisted / Exam modes.
- **No inviting or removing TAs.** Only the professor can invite TAs. Only the professor can revoke them.
- **No modifying the roster.** TAs cannot add students to the section, remove students from the section, or change roster details.
- **No changing or reversing project assignments retroactively.** Once a project is assigned (whether by professor or TA), only the professor can modify or unassign it.
- **No access to other courses.** TAs see only the section where they are an active TA. Their TA permissions do not propagate to any other context — not other sections of the same course taught by other professors, not other courses entirely, not other professors' MY PROJECTS widgets.
- **No access to other students' personal information.** TAs see only what is operationally necessary for the powers above (roster names for matchups, project files for download, project assignment for due-date setting). They do not see student grades, personal contact information beyond what the section roster shows publicly, or anything else.

## Trust Model

TAs are *operators on behalf of the professor*. The trust posture is that the professor has delegated specific tactical responsibilities — download, assign, pair, role-play — to the TA, with the professor retaining final authority over course substance: who is enrolled, what they're learning, how they're graded, what feedback they receive.

The Hard Nos above enforce this distinction. TAs *execute*. Professors *decide*.

A TA is not a junior professor. A TA is not a peer reviewer. A TA is not an evaluator. A TA is the person who downloads the packet, sets up the exhibit table, plays the angry client when the professor calls "action," and texts the late student to ask where the project is. That role is operationally critical and pedagogically real, and the powers in this document are precisely the ones that role requires.

Anything beyond that scope is not a TA Power. It is a professor responsibility.

## Implementation status

| Component | Status |
|---|---|
| `course_tas` schema (per-section TA pool, slot accounting, RLS) | Live (commit d172abc, refined c3be85a, d2fe72d, 44d25fa) |
| Professor invite / revoke flow | Live, verified end-to-end |
| Student-side accept / decline flow | Live, verified end-to-end |
| Power 1 — Download projects | Not implemented |
| Power 2 — Assign projects + due date | Not implemented |
| Power 2 — SMS notification to professor | Blocked on Twilio integration + 10DLC registration + TCPA opt-in capture at signup |
| Power 3 — Matchup tool for VERSUS projects | Not implemented |
| Power 4 — Project role assignments | Half-defined, blocked on PROJECT_SPEC.md |
| Future — Messaging students | Blocked on messaging infrastructure |

## Decisions locked

All design questions from earlier drafts of this document are now resolved. Recap of the locks:

- **Power 1 download format**: original upload format, no conversion.
- **Power 2 professor notification**: by SMS (text message), deferred until SMS infrastructure ships.
- **Power 3 numbering basis**: roster load order. Invisible to students. Just an internal divider.
- **Power 3 randomize**: page-level button + per-pulldown option, no auto-cascade.
- **Power 3 odd-count handling**: replaced by the always-available-TA/professor mechanic. TAs and professor never gray out and can fill any gap.
- **Power 3 drop handling**: not handled in-system. Manual outside-the-platform handling by the professor.
- **Power 4 casting authority**: project auto-assigns. No professor approval step. TAs sort out any conflicts among themselves.
