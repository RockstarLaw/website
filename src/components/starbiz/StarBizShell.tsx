import Image from "next/image";
import Link from "next/link";
import { ReactNode } from "react";

// ─── Sunbiz-faithful palette ──────────────────────────────────────────────────
const C = {
  cream:   "#F5F0E1",
  navy:    "#003366",
  maroon:  "#800000",
  yellow:  "#FFFF99",
  white:   "#FFFFFF",
  black:   "#000000",
  border:  "#999999",
  navBg:   "#E8E0D0",
};

const SEARCH_LINKS = [
  { label: "by Entity Name",              href: "/starbiz/search/by-name" },
  { label: "by Officer/RA Name",          href: "/starbiz/search/by-officer" },
  { label: "by Registered Agent Name",    href: "/starbiz/search/by-officer" },
  { label: "by FEI/EIN Number",           href: "/starbiz/search/by-fei" },
  { label: "by Document Number",          href: "/starbiz/search/by-document-number" },
  { label: "by Fictitious Name Owner",    href: "/starbiz/search/by-fictitious-owner" },
  { label: "by Trademark",               href: "/starbiz/search/by-trademark" },
  { label: "by Trademark Owner Name",    href: "/starbiz/search/by-trademark-owner" },
];

const FILING_LINKS = [
  { label: "File LLC Articles of Organization",    href: "#" },
  { label: "File Profit Articles of Incorporation",href: "#" },
  { label: "File Non-Profit Articles",             href: "#" },
  { label: "File Limited Partnership",             href: "#" },
  { label: "File Fictitious Name",                 href: "#" },
  { label: "File Annual Report",                   href: "#" },
  { label: "File State Trademark",                 href: "#" },
];

function NavSection({ title, items }: { title: string; items: { label: string; href: string }[] }) {
  return (
    <div>
      <div style={{
        backgroundColor: C.navy,
        color: C.white,
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "12px",
        fontWeight: "bold",
        padding: "4px 8px",
        borderBottom: `1px solid ${C.border}`,
      }}>
        {title}
      </div>
      {items.map(({ label, href }) => (
        <div key={label} style={{ borderBottom: `1px solid ${C.border}` }}>
          <Link
            href={href}
            className="hover:underline"
            style={{
              display: "block",
              padding: "3px 8px 3px 16px",
              fontSize: "11px",
              color: C.maroon,
              textDecoration: "none",
              fontFamily: "Arial, Helvetica, sans-serif",
              backgroundColor: C.navBg,
            }}
          >
            {label}
          </Link>
        </div>
      ))}
    </div>
  );
}

export function StarBizShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ backgroundColor: C.cream, minHeight: "100vh", fontFamily: "Arial, Helvetica, sans-serif", fontSize: "13px", color: C.black }}>

      {/* ── Header Banner ──────────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.navy, color: C.white }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "6px 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>

          {/* Left: logo + agency name */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Image
              src="/images/modules/icon_florida_starbiz.png"
              alt="StarBiz"
              width={40}
              height={40}
              style={{ borderRadius: 0, imageRendering: "auto" }}
            />
            <div>
              <div style={{ fontSize: "11px", color: "#ccddff" }}>Florida Department of State</div>
              <div style={{ fontSize: "18px", fontFamily: "Times New Roman, Georgia, serif", fontWeight: "bold" }}>
                Division of Corporations
              </div>
            </div>
          </div>

          {/* Right: wordmark + assisted mode slot */}
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "15px", fontWeight: "bold", fontFamily: "Times New Roman, Georgia, serif" }}>
              RockStar StarBiz
            </div>
            <div style={{ fontSize: "10px", color: "#aabbcc" }}>
              (parody — for educational simulation)
            </div>
            {/* AssistedMode toggle slot — Phase 4 inserts here */}
            <div id="assisted-mode-slot" />
          </div>
        </div>
      </div>

      {/* ── Sub-header bar ─────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#002244", color: C.white, borderBottom: `2px solid ${C.black}` }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2px 8px", fontSize: "11px" }}>
          <Link href="/starbiz" style={{ color: "#aaccff", textDecoration: "none", marginRight: "12px" }}>Home</Link>
          <Link href="/oogle?q=starbiz" style={{ color: "#aaccff", textDecoration: "none", marginRight: "12px" }}>OOgle Search</Link>
          <Link href="/starbiz/forms-fees" style={{ color: "#aaccff", textDecoration: "none", marginRight: "12px" }}>Forms &amp; Fees</Link>
          <Link href="/starbiz/help" style={{ color: "#aaccff", textDecoration: "none" }}>Help</Link>
        </div>
      </div>

      {/* ── Main two-column layout ─────────────────────────────────────── */}
      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", alignItems: "flex-start" }}>

        {/* Left nav */}
        <div style={{ width: "210px", minWidth: "210px", borderRight: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>

          <NavSection title="Search Records" items={SEARCH_LINKS} />

          <NavSection title="E-Filing Services" items={FILING_LINKS} />

          <div>
            <div style={{ backgroundColor: C.navy, color: C.white, fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px", fontWeight: "bold", padding: "4px 8px", borderBottom: `1px solid ${C.border}` }}>
              Other
            </div>
            {[
              { label: "Forms & Fees",  href: "/starbiz/forms-fees" },
              { label: "Help",          href: "/starbiz/help" },
            ].map(({ label, href }) => (
              <div key={label} style={{ borderBottom: `1px solid ${C.border}` }}>
                <Link
                  href={href}
                  style={{ display: "block", padding: "3px 8px 3px 16px", fontSize: "11px", color: C.maroon, textDecoration: "none", fontFamily: "Arial, Helvetica, sans-serif", backgroundColor: C.navBg }}
                >
                  {label}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "10px 14px", minWidth: 0 }}>
          {children}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.navy, color: "#ccddee", fontSize: "10px", textAlign: "center", padding: "6px 8px", borderTop: `2px solid ${C.black}`, marginTop: "12px" }}>
        © RockStar Law — Educational simulation only. Not affiliated with the Florida Department of State.
        <span style={{ margin: "0 8px" }}>|</span>
        <Link href="/dashboard/student" style={{ color: "#aaccff" }}>Student Dashboard</Link>
        <span style={{ margin: "0 8px" }}>|</span>
        <Link href="/oogle" style={{ color: "#aaccff" }}>OOgle</Link>
      </div>
    </div>
  );
}
