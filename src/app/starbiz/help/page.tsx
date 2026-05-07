import { StarBizShell } from "@/components/starbiz/StarBizShell";

export default function HelpPage() {
  return (
    <StarBizShell>
      <h2 style={{ fontFamily: "Times New Roman, Georgia, serif", fontSize: "16px", color: "#003366" }}>
        Help
      </h2>
      <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", color: "#444", marginTop: "8px" }}>
        This is an educational simulation of the Florida Division of Corporations online portal.
        All filings are for practice only and have no legal effect.
        Contact your professor if you need assistance with a specific assignment.
      </p>
    </StarBizShell>
  );
}
