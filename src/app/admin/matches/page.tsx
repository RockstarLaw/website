import { PlaceholderPage } from "@/components/placeholder-page";

export default function AdminMatchesPage() {
  return (
    <PlaceholderPage
      eyebrow="Admin matches"
      title="Global match diagnostics"
      description="Admin users will review match anomalies across schools and professors, especially uncertain, rejected, and unresolved roster matches."
      highlights={[
        "Global match queue",
        "Unresolved roster links",
        "Confidence-score review",
        "Cross-school diagnostics placeholder",
      ]}
      nextSteps={[
        "Load roster_matches globally",
        "Allow admin override and audit trail",
        "Add filters by school, professor, and match status",
      ]}
    />
  );
}
