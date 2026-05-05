# UI Gap Log — Main Registration / Onboarding

Date: 2026-05-04

| Field name | Screen where discovered | Why it may be needed | Required now or later |
| --- | --- | --- | --- |
| Selected professor(s) / intended professor link | Student registration | Student onboarding is only fully complete once a professor is selected; student dashboard logic already expects professor-linked outcomes. | **Now** |
| Intended course for student | Student registration | Helps connect a student to the correct professor and roster when multiple professors exist at the same school. | **Now** |
| Student-professor selection UI confirmation state | Student dashboard / post-registration flow | There is currently no browser step that lets a student review or update the professor relationship after account creation. | **Now** |
| Professor approval review note / status explanation | Professor registration success / professor dashboard | Approval begins as pending, but the browser flow does not yet explain what happens if approval is delayed or rejected. | Later |
| School requester role/title | School registration request | Admin review may need to know whether the requester is faculty, registrar staff, or an outside submitter. | Later |
| School requester phone | School registration request | Useful for admin follow-up when a school request needs clarification. | Later |
| Distinction between parent university and law school unit | School registration request | Some institutions may need both the university and the law school named explicitly for clean normalization. | Later |
| Admin user management fields | Admin dashboard | The main admin dashboard works, but there is no browser UI yet for assigning/administering roles or reviewing auth-linked user metadata. | Later |

## Notes
- No new fields were added automatically during this phase.
- The most important missing data for a complete student onboarding path is professor/course selection from the student side.
