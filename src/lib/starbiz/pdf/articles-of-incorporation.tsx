/**
 * Articles of Incorporation — parody-branded PDF template.
 * Server-rendered via @react-pdf/renderer. No client-only imports.
 */

import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type PdfAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type PdfPerson = {
  title: string | null;
  name: string;
  address: PdfAddress;
};

export type ArticlesOfIncorporationData = {
  documentNumber: string;
  entityName: string;
  filedDateLabel: string;
  effectiveDateLabel: string;
  effectiveOnFiling: boolean;
  principalAddress: PdfAddress;
  mailingAddress: PdfAddress | null;
  registeredAgent: { name: string; address: PdfAddress };
  sharesAuthorized: number;
  parValueCents: number | null;    // null = no par value
  shareClassName: string;
  directors: PdfPerson[];
  officers: PdfPerson[];
  incorporator: { name: string; address: PdfAddress };
  purpose: string;
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

  articleHeading: {
    fontSize: 11,
    fontFamily: "Times-Bold",
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: { marginTop: 2 },
  inset: { marginLeft: 18, marginTop: 2 },

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

function formatParValue(cents: number | null, shareClass: string): string {
  if (cents === null) return `${shareClass} — No Par Value`;
  const dollars = (cents / 100).toFixed(cents % 1 === 0 ? 2 : 4).replace(/\.?0+$/, "");
  return `${shareClass} — $${dollars} par value per share`;
}

export default function ArticlesOfIncorporation({ data }: { data: ArticlesOfIncorporationData }) {
  return (
    <Document
      title={`Articles of Incorporation — ${data.entityName}`}
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
        <Text style={styles.title}>ARTICLES OF INCORPORATION</Text>
        <Text style={styles.subtitle}>Florida Profit Corporation</Text>
        <Text style={styles.statutory}>Pursuant to § 607.0202, Florida Statutes</Text>

        {/* ── Article I — Corporate Name ─────────────────────────────── */}
        <Text style={styles.articleHeading}>Article I — Corporate Name</Text>
        <Text style={styles.paragraph}>The name of the corporation is:</Text>
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

        {/* ── Article IV — Capital Stock ──────────────────────────────── */}
        <Text style={styles.articleHeading}>Article IV — Capital Stock</Text>
        <Text style={styles.paragraph}>
          The aggregate number of shares the corporation is authorized to issue
          is {data.sharesAuthorized.toLocaleString()} shares of:
        </Text>
        <Text style={styles.inset}>
          {formatParValue(data.parValueCents, data.shareClassName)}
        </Text>

        {/* ── Article V — Directors ──────────────────────────────────── */}
        <Text style={styles.articleHeading}>Article V — Directors</Text>
        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, styles.thTitle]}>Title</Text>
            <Text style={[styles.th, styles.thName]}>Name</Text>
            <Text style={[styles.th, styles.thAddress]}>Address</Text>
          </View>
          {data.directors.map((d, i) => (
            <View key={`d-${i}`} style={styles.tr}>
              <Text style={[styles.td, styles.thTitle]}>{d.title ?? "DIR"}</Text>
              <Text style={[styles.td, styles.thName]}>{d.name}</Text>
              <Text style={[styles.td, styles.thAddress]}>{formatAddressLine(d.address)}</Text>
            </View>
          ))}
        </View>

        {/* ── Article VI — Officers (if any) ─────────────────────────── */}
        {data.officers.length > 0 && (
          <>
            <Text style={styles.articleHeading}>Article VI — Officers</Text>
            <View style={styles.table}>
              <View style={styles.tr}>
                <Text style={[styles.th, styles.thTitle]}>Title</Text>
                <Text style={[styles.th, styles.thName]}>Name</Text>
                <Text style={[styles.th, styles.thAddress]}>Address</Text>
              </View>
              {data.officers.map((o, i) => (
                <View key={`o-${i}`} style={styles.tr}>
                  <Text style={[styles.td, styles.thTitle]}>{o.title ?? "OFCR"}</Text>
                  <Text style={[styles.td, styles.thName]}>{o.name}</Text>
                  <Text style={[styles.td, styles.thAddress]}>{formatAddressLine(o.address)}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Article VII — Purpose ──────────────────────────────────── */}
        <Text style={styles.articleHeading}>
          Article {data.officers.length > 0 ? "VII" : "VI"} — Purpose
        </Text>
        <Text style={styles.paragraph}>{data.purpose}</Text>

        {/* ── Article VIII — Incorporator ────────────────────────────── */}
        <Text style={styles.articleHeading}>
          Article {data.officers.length > 0 ? "VIII" : "VII"} — Incorporator
        </Text>
        <Text style={styles.paragraph}>The name and address of the incorporator:</Text>
        <Text style={styles.inset}>{data.incorporator.name}</Text>
        <Text style={styles.inset}>{formatAddressLine(data.incorporator.address)}</Text>

        {/* ── Article IX — Effective Date ────────────────────────────── */}
        <Text style={styles.articleHeading}>
          Article {data.officers.length > 0 ? "IX" : "VIII"} — Effective Date
        </Text>
        <Text style={styles.paragraph}>
          {data.effectiveOnFiling
            ? "These articles shall be effective upon filing."
            : `These articles shall be effective on ${data.effectiveDateLabel}.`}
        </Text>

        {/* ── Signature ──────────────────────────────────────────────── */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Incorporator Signature:</Text>
          <Text style={styles.signatureLine}>{data.incorporator.name}</Text>
          <Text style={styles.signatureMeta}>Date: {data.filedDateLabel}</Text>
        </View>

        {/* ── Footer ─────────────────────────────────────────────────── */}
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
