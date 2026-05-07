type EmailContent = { subject: string; text: string; html: string };

export function taInvitationEmail({
  studentFirstName,
  professorLastName,
  courseName,
  dashboardUrl,
}: {
  studentFirstName: string;
  professorLastName: string;
  courseName: string;
  dashboardUrl: string;
}): EmailContent {
  const subject = `Professor ${professorLastName} invited you to TA for ${courseName}`;

  const text = `Hi ${studentFirstName},

Professor ${professorLastName}, Esq. has invited you to be a Teaching Assistant for ${courseName}.

Log in to accept or decline this invitation:
${dashboardUrl}

— RockStar Law`;

  const html = `<p>Hi ${studentFirstName},</p>
<p>Professor ${professorLastName}, Esq. has invited you to be a Teaching Assistant for <strong>${courseName}</strong>.</p>
<p>Log in to accept or decline this invitation:<br>
<a href="${dashboardUrl}">${dashboardUrl}</a></p>
<p>— RockStar Law</p>`;

  return { subject, text, html };
}

export function taAcceptedEmail({
  professorLastName,
  studentFullName,
  courseName,
  manageCourseUrl,
}: {
  professorLastName: string;
  studentFullName: string;
  courseName: string;
  manageCourseUrl: string;
}): EmailContent {
  const subject = `${studentFullName} accepted your TA invitation`;

  const text = `Hi Professor ${professorLastName},

${studentFullName} accepted your invitation to be a Teaching Assistant for ${courseName}.

View the course:
${manageCourseUrl}

— RockStar Law`;

  const html = `<p>Hi Professor ${professorLastName},</p>
<p><strong>${studentFullName}</strong> accepted your invitation to be a Teaching Assistant for <strong>${courseName}</strong>.</p>
<p>View the course:<br>
<a href="${manageCourseUrl}">${manageCourseUrl}</a></p>
<p>— RockStar Law</p>`;

  return { subject, text, html };
}

export function taDeclinedEmail({
  professorLastName,
  studentFullName,
  courseName,
}: {
  professorLastName: string;
  studentFullName: string;
  courseName: string;
}): EmailContent {
  const subject = `${studentFullName} declined your TA invitation`;

  const text = `Hi Professor ${professorLastName},

${studentFullName} declined your invitation to be a Teaching Assistant for ${courseName}. The slot is now available for another invitation.

— RockStar Law`;

  const html = `<p>Hi Professor ${professorLastName},</p>
<p><strong>${studentFullName}</strong> declined your invitation to be a Teaching Assistant for <strong>${courseName}</strong>. The slot is now available for another invitation.</p>
<p>— RockStar Law</p>`;

  return { subject, text, html };
}
