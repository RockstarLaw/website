import { LLCWizard } from "@/components/starbiz/LLCWizard";
import { StarBizShell } from "@/components/starbiz/StarBizShell";

export default function LLCFormationPage() {
  return (
    <StarBizShell>
      <div style={{ borderBottom: "2px solid #003366", marginBottom: "10px", paddingBottom: "4px" }}>
        <h1 style={{ fontFamily: "Times New Roman, Georgia, serif", fontSize: "17px", fontWeight: "bold", color: "#003366", margin: 0 }}>
          Articles of Organization — Florida Limited Liability Company
        </h1>
        <p style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "10px", color: "#666", marginTop: "2px" }}>
          Pursuant to § 605.0201, Florida Statutes &nbsp;·&nbsp; Filing fee: $125.00 &nbsp;·&nbsp; RockStar StarBiz simulation — no legal effect
        </p>
      </div>

      <LLCWizard />
    </StarBizShell>
  );
}
