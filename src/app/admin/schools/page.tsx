import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminSchoolsPage() {
  return (
    <PlaceholderPage
      eyebrow="Admin schools"
      title="School management"
      description="Rockstar admin will manage placeholder schools, pending review requests, and registered school records from this route."
      highlights={[
        "Placeholder school list",
        "Pending review queue",
        "Registered vs rejected school states",
        "School approval controls",
      ]}
      nextSteps={[
        "Load schools with normalized status filters",
        "Add school approval and rejection actions",
        "Support authoritative address editing",
      ]}
    />
  );
}
