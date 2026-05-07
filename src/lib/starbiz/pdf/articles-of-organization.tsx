/**
 * Articles of Organization — parody-branded PDF template.
 * Server-rendered via @react-pdf/renderer. No client-only imports.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type PdfAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type PdfOfficer = {
  title: string | null;
  name: string;
  address: PdfAddress;
};

export type ArticlesData = {
  documentNumber: string;
  entityName: string;
  filedDateLabel: string;        // pre-formatted "MM/DD/YYYY" in ET
  effectiveDateLabel: string;    // pre-formatted "MM/DD/YYYY" in ET
  effectiveOnFiling: boolean;    // true → "upon filing"; false → use effectiveDateLabel
  principalAddress: PdfAddress;
  mailingAddress: PdfAddress | null; // null = same as principal
  registeredAgent: { name: string; address: PdfAddress };
  authorizedPersons: PdfOfficer[];
  organizer: { name: string; address: PdfAddress };
};

const NAVY   = "#003366";
const BLACK  = "#000000";
const GRAY   = "#555555";
const LIGHT  = "#888888";

const styles = StyleSheet.create({
  page: {
    paddingTop:    54,
    paddingBottom: 54,
    paddingLeft:   54,
    paddingRight:  54,
    fontFamily:    "Times-Roman",
    fontSize:      11,
    color:         BLACK,
    lineHeight:    1.4,
  },

  // ─── Header (text only — seal deferred until transparent asset lands) ─────
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottom: `1pt solid ${NAVY}`,
    paddingBottom: 6,
    marginBottom: 12,
  },
  headerCenter: { flexGrow: 1, alignItems: "center" },
  headerAgency: { fontSize: 12, color: NAVY, fontFamily: "Times-Bold" },
  headerDivision: { fontSize: 11, color: NAVY },
  headerRight: { alignItems: "flex-end", minWidth: 160 },
  headerDocNum: { fontSize: 10, fontFamily: "Times-Bold" },
  headerFiled: { fontSize: 10, color: GRAY, marginTop: 2 },

  // ─── Title ───────────────────────────────────────────────────────────────
  title: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "Times-Bold",
    marginTop: 12,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Times-Roman",
    marginTop: 2,
  },
  statutory: {
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Times-Italic",
    color: GRAY,
    marginTop: 4,
    marginBottom: 18,
  },

  // ─── Article blocks ──────────────────────────────────────────────────────
  articleHeading: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: { marginTop: 2 },
  inset: { marginLeft: 18, marginTop: 2 },

  // ─── Officers table ──────────────────────────────────────────────────────
  table: {
    marginTop: 6,
    borderTop: `0.5pt solid ${BLACK}`,
    borderLeft: `0.5pt solid ${BLACK}`,
  },
  tr: { flexDirection: "row" },
  th: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 4,
    fontSize: 10,
    fontFamily: "Times-Bold",
    backgroundColor: "#EEEEEE",
    borderRight: `0.5pt solid ${BLACK}`,
    borderBottom: `0.5pt solid ${BLACK}`,
  },
  td: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 4,
    fontSize: 10,
    borderRight: `0.5pt solid ${BLACK}`,
    borderBottom: `0.5pt solid ${BLACK}`,
  },
  thTitle:   { flexGrow: 0.6 },
  thName:    { flexGrow: 1.2 },
  thAddress: { flexGrow: 2 },

  // ─── Signature ───────────────────────────────────────────────────────────
  signatureBlock: { marginTop: 36 },
  signatureLine: {
    borderBottom: `0.5pt solid ${BLACK}`,
    width: 260,
    marginTop: 4,
    marginBottom: 4,
    paddingBottom: 4,
    fontFamily: "Times-Italic",
    fontSize: 14,
  },
  signatureLabel: { fontSize: 9, color: GRAY },
  signatureMeta: { fontSize: 10, marginTop: 6 },

  // ─── Footer (every page) ─────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 54,
    right: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: LIGHT,
    fontFamily: "Helvetica",
    borderTop: `0.5pt solid ${LIGHT}`,
    paddingTop: 4,
  },
  footerCenter: { textAlign: "center", flexGrow: 1 },
});

function formatAddressLine(a: PdfAddress): string {
  return `${a.street}, ${a.city}, ${a.state} ${a.zip}`.replace(/\s+/g, " ").trim();
}

export default function ArticlesOfOrganization({ data }: { data: ArticlesData }) {
  return (
    <Document
      title={`Articles of Organization — ${data.entityName}`}
      author="RockStar StarBiz (parody)"
    >
      <Page size="LETTER" style={styles.page} wrap>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.headerRow} fixed>
          <View style={styles.headerCenter}>
            <Text style={styles.headerAgency}>RockStar Department of State (Florida)</Text>
            <Text style={styles.headerDivision}>Division of Corporations</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDocNum}>Document Number: {data.documentNumber}</Text>
            <Text style={styles.headerFiled}>Filed: {data.filedDateLabel}</Text>
          </View>
        </View>

        {/* ── Title ──────────────────────────────────────────────────── */}
        <Text style={styles.title}>ARTICLES OF ORGANIZATION</Text>
        <Text style={styles.subtitle}>Limited Liability Company</Text>
        <Text style={styles.statutory}>Pursuant to § 605.0201, Florida Statutes</Text>

        {/* ── Article I — Entity Name ────────────────────────────────── */}
        <Text style={styles.articleHeading}>Article I — Entity Name</Text>
        <Text style={styles.paragraph}>The name of the limited liability company is:</Text>
        <Text style={styles.inset}>{data.entityName}</Text>

        {/* ── Article II — Principal Office ──────────────────────────── */}
        <Text style={styles.articleHeading}>Article II — Principal Office</Text>
        <Text style={styles.paragraph}>The street address of the principal office is:</Text>
        <Text style={styles.inset}>{formatAddressLine(data.principalAddress)}</Text>
        {data.mailingAddress ? (
          <>
            <Text style={[styles.paragraph, { marginTop: 6 }]}>Mailing address:</Text>
            <Text style={styles.inset}>{formatAddressLine(data.mailingAddress)}</Text>
          </>
        ) : (
          <Text style={[styles.paragraph, { marginTop: 6 }]}>
            Mailing address: same as principal office.
          </Text>
        )}

        {/* ── Article III — Registered Agent ─────────────────────────── */}
        <Text style={styles.articleHeading}>Article III — Registered Agent</Text>
        <Text style={styles.paragraph}>
          The name of the registered agent is: {data.registeredAgent.name}
        </Text>
        <Text style={styles.paragraph}>The Florida street address of the registered agent is:</Text>
        <Text style={styles.inset}>{formatAddressLine(data.registeredAgent.address)}</Text>
        <Text style={[styles.paragraph, { marginTop: 6, fontStyle: "italic" }]}>
          Acceptance: I am familiar with and accept the obligations of registered agent.
        </Text>

        {/* ── Article IV — Authorized Representatives ────────────────── */}
        <Text style={styles.articleHeading}>Article IV — Authorized Representative(s)</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, styles.thTitle]}>Title</Text>
            <Text style={[styles.th, styles.thName]}>Name</Text>
            <Text style={[styles.th, styles.thAddress]}>Address</Text>
          </View>
          {data.authorizedPersons.map((p, i) => (
            <View key={`${p.name}-${i}`} style={styles.tr}>
              <Text style={[styles.td, styles.thTitle]}>{p.title}</Text>
              <Text style={[styles.td, styles.thName]}>{p.name}</Text>
              <Text style={[styles.td, styles.thAddress]}>{formatAddressLine(p.address)}</Text>
            </View>
          ))}
        </View>

        {/* ── Article V — Organizer ──────────────────────────────────── */}
        <Text style={styles.articleHeading}>Article V — Organizer</Text>
        <Text style={styles.paragraph}>The name and address of the organizer:</Text>
        <Text style={styles.inset}>{data.organizer.name}</Text>
        <Text style={styles.inset}>{formatAddressLine(data.organizer.address)}</Text>

        {/* ── Article VI — Effective Date ────────────────────────────── */}
        <Text style={styles.articleHeading}>Article VI — Effective Date</Text>
        <Text style={styles.paragraph}>
          {data.effectiveOnFiling
            ? "These articles shall be effective upon filing."
            : `These articles shall be effective on ${data.effectiveDateLabel}.`}
        </Text>

        {/* ── Signature ──────────────────────────────────────────────── */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Organizer Signature:</Text>
          <Text style={styles.signatureLine}>{data.organizer.name}</Text>
          <Text style={styles.signatureMeta}>Date: {data.filedDateLabel}</Text>
        </View>

        {/* ── Footer (fixed on every page) ───────────────────────────── */}
        <View style={styles.footer} fixed>
          <Text>{data.documentNumber}</Text>
          <Text style={styles.footerCenter}>
            RockStar StarBiz simulation · Educational use only · No legal effect
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}
