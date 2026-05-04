import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminUsersPage() {
  return (
    <PlaceholderPage
      eyebrow="Admin users"
      title="User management"
      description="Admin users will inspect student, professor, and future school-admin accounts, along with onboarding states and approval issues."
      highlights={[
        "Student and professor directory placeholder",
        "Pending professor approvals",
        "Onboarding status review",
        "User issue diagnostics",
      ]}
      nextSteps={[
        "Add role filters and approval status filters",
        "Connect profiles to auth users",
        "Add admin correction and review actions",
      ]}
    />
  );
}
