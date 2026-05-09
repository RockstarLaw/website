/**
 * CP575G Parody EIN Confirmation Letter — react-pdf Document component.
 *
 * Renders a single-page letter that mirrors the IRS Notice CP575G layout
 * at human-eye-match fidelity (§2, locked 2026-05-09 evening).
 *
 * ── Literal source ───────────────────────────────────────────────────────────
 * IRS_Website/9_EIN WIZARD…/7_EIN_Assignment/cp575g-confirmation-letter-sample.png
 * All text content is verbatim from that specimen except where §4 branding
 * swaps are explicitly applied (see §4 SWAP CONSTANTS below).
 *
 * ── §4 Branding swaps (locked 2026-05-09 evening) ───────────────────────────
 * "Internal Revenue Service"    → "RockStar Internal Revenue Service"
 * "Philadelphia, PA 19255-0023" → "1 RockStar Way / Fort Lauderdale, FL 33394"
 * "IRS Notice CP575G"           → "RockStar IRS Notice CP575G"
 * "800-TAX-FORM (800-829-3676)" → "(954) 426-6424"
 * "800-829-4933"                → "(954) 426-6424"
 * Everything else (Department of the Treasury, body bullets, footer template,
 * IRS.gov URLs, form/publication references) ships verbatim from specimen.
 *
 * ── Fonts ────────────────────────────────────────────────────────────────────
 * Body / headings: Times-Roman / Times-Bold (react-pdf built-in, mirrors IRS
 *   Times New Roman). Subheadings: Times-Bold.
 * EIN value + name control: Courier-Bold / Courier (react-pdf built-in, mirrors
 *   IRS monospace rendering of alphanumeric identifiers).
 *
 * ── Out of scope ─────────────────────────────────────────────────────────────
 * CP575A, CP575B, CP575E variants — Phase 2+.
 * Letter 147C — Phase 4+.
 * IRS eagle seal image — deferred (same precedent as Articles of Organization
 *   seal deferral; text-only header ships clean).
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// ── §4 swap constants (change here, changes everywhere in the template) ────────
const AGENCY_PARENT      = "Department of the Treasury";           // verbatim — no swap
const AGENCY_NAME        = "RockStar Internal Revenue Service";    // §4: IRS → RockStar IRS
const AGENCY_ADDR_LINE1  = "1 RockStar Way";                       // §4: Philadelphia line swapped
const AGENCY_ADDR_LINE2  = "Fort Lauderdale, FL 33394";            // §4: confirmed 2026-05-09
const IMPORTANT_NOTE     = "Important Information - Please Read";   // verbatim
const NOTICE_ID          = "RockStar IRS Notice CP575G";            // §4: IRS prefix + verbatim form name
const HELPDESK_PHONE     = "(954) 426-6424";                        // §4: replaces all IRS phone numbers

// ── Colours ───────────────────────────────────────────────────────────────────
const BLACK  = "#000000";
const GRAY   = "#555555";
const LIGHT  = "#888888";

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    paddingTop:    54,
    paddingBottom: 54,
    paddingLeft:   54,
    paddingRight:  54,
    fontFamily:    "Times-Roman",
    fontSize:      10,
    color:         BLACK,
    lineHeight:    1.45,
    // Thin black border around the entire page content (from specimen)
    borderWidth:   1,
    borderColor:   BLACK,
    borderStyle:   "solid",
  },

  // ── Header (two-column) ──────────────────────────────────────────────────
  headerRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: BLACK,
    borderBottomStyle: "solid",
    paddingBottom:  8,
    marginBottom:   10,
  },
  headerLeft: {
    flexGrow:    1,
    flexShrink:  1,
  },
  headerAgencyParent: {
    fontSize:   10,
    fontFamily: "Times-Bold",
  },
  headerAgencyName: {
    fontSize:   10,
    fontFamily: "Times-Bold",
  },
  headerAgencyAddr: {
    fontSize:   10,
    marginTop:  1,
  },
  headerImportant: {
    fontSize:   9,
    fontStyle:  "italic",
    color:      GRAY,
    marginTop:  3,
  },
  headerRight: {
    alignItems:  "flex-end",
    minWidth:    180,
  },
  headerNoticeId: {
    fontSize:   10,
    fontFamily: "Times-Bold",
    textAlign:  "right",
  },

  // ── Recipient + date band ────────────────────────────────────────────────
  recipientBand: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "flex-start",
    marginBottom:   12,
  },
  recipientBlock: {
    flexShrink: 1,
  },
  recipientLine: {
    fontSize:   10,
    fontFamily: "Times-Bold",
    lineHeight: 1.3,
  },
  dateBlock: {
    alignItems: "flex-end",
    minWidth:   120,
  },
  dateText: {
    fontSize: 10,
  },

  // ── Body ─────────────────────────────────────────────────────────────────
  mainHeading: {
    fontSize:     12,
    fontFamily:   "Times-Bold",
    marginBottom: 6,
  },
  bodyPara: {
    fontSize:     10,
    marginBottom: 10,
    lineHeight:   1.45,
  },
  einValueInline: {
    fontFamily: "Courier-Bold",
    fontSize:   10,
  },
  nameControlInline: {
    fontFamily: "Courier",
    fontSize:   10,
  },

  // ── Section subheadings ──────────────────────────────────────────────────
  sectionRule: {
    borderBottomWidth: 1,
    borderBottomColor: BLACK,
    borderBottomStyle: "solid",
    marginBottom:      6,
  },
  sectionHeading: {
    fontSize:     10,
    fontFamily:   "Times-Bold",
    marginBottom: 3,
  },

  // ── Bullet lists ─────────────────────────────────────────────────────────
  bulletList: {
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom:  6,
    alignItems:    "flex-start",
  },
  bulletDot: {
    width:       14,
    fontSize:    10,
    lineHeight:  1.45,
    flexShrink:  0,
  },
  bulletText: {
    flexGrow:   1,
    flexShrink: 1,
    fontSize:   10,
    lineHeight: 1.45,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position:       "absolute",
    bottom:         24,
    left:           54,
    right:          54,
    flexDirection:  "row",
    justifyContent: "space-between",
    fontSize:       8,
    color:          LIGHT,
    fontFamily:     "Times-Roman",
    borderTopWidth: 1,
    borderTopColor: LIGHT,
    borderTopStyle: "solid",
    paddingTop:     4,
  },
  footerCenter: {
    textAlign: "center",
    flexGrow:  1,
  },
});

// ── Props ─────────────────────────────────────────────────────────────────────

export type Cp575gData = {
  entityName:  string;   // Legal name, will be rendered ALLCAPS
  officerName: string;   // Responsible party full name, rendered ALLCAPS
  ein:         string;   // e.g. "99-1234567"
  nameControl: string;   // e.g. "ABCW" — first 4 letters of entity name
  dateIssued:  string;   // Pre-formatted "Month DD, YYYY"
  street:      string;   // Applicant's physical street
  city:        string;
  state:       string;
  zip:         string;
};

// ── Bullet helper ─────────────────────────────────────────────────────────────

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

// ── Document component ────────────────────────────────────────────────────────

export default function Cp575gDocument({ data }: { data: Cp575gData }) {
  const entityUpper  = data.entityName.toUpperCase();
  const officerUpper = data.officerName.toUpperCase();
  const einWithoutDash = data.ein.replace("-", "");

  return (
    <Document
      title={`IRS Notice CP575G — ${data.entityName}`}
      author="RockStar IRS (parody)"
    >
      <Page size="LETTER" style={styles.page}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.headerRow}>
          {/* Left: agency identity + address */}
          <View style={styles.headerLeft}>
            <Text style={styles.headerAgencyParent}>{AGENCY_PARENT}</Text>
            <Text style={styles.headerAgencyName}>{AGENCY_NAME}</Text>
            <Text style={styles.headerAgencyAddr}>{AGENCY_ADDR_LINE1}</Text>
            <Text style={styles.headerAgencyAddr}>{AGENCY_ADDR_LINE2}</Text>
            <Text style={styles.headerImportant}>{IMPORTANT_NOTE}</Text>
          </View>
          {/* Right: notice ID */}
          <View style={styles.headerRight}>
            <Text style={styles.headerNoticeId}>{NOTICE_ID}</Text>
          </View>
        </View>

        {/* ── Recipient + date band ───────────────────────────────────── */}
        <View style={styles.recipientBand}>
          <View style={styles.recipientBlock}>
            {/* Entity name */}
            <Text style={styles.recipientLine}>{entityUpper}</Text>
            {/* Officer name */}
            <Text style={styles.recipientLine}>{officerUpper}</Text>
            {/* Care-of line (standard LLC convention: % Officer Name) */}
            <Text style={styles.recipientLine}>% {officerUpper}</Text>
            {/* Applicant address */}
            <Text style={[styles.recipientLine, { fontFamily: "Times-Roman" }]}>
              {data.street}
            </Text>
            <Text style={[styles.recipientLine, { fontFamily: "Times-Roman" }]}>
              {data.city}, {data.state} {data.zip}
            </Text>
          </View>
          <View style={styles.dateBlock}>
            <Text style={styles.dateText}>{data.dateIssued}</Text>
          </View>
        </View>

        {/* ── Main heading ────────────────────────────────────────────── */}
        {/* Verbatim from specimen */}
        <Text style={styles.mainHeading}>
          We assigned you an employer identification number (EIN)
        </Text>

        {/* ── EIN + name control sentence ─────────────────────────────── */}
        {/* Verbatim template; EIN in Courier-Bold, name control in Courier */}
        <Text style={styles.bodyPara}>
          {"Your EIN is "}
          <Text style={styles.einValueInline}>{data.ein}</Text>
          {`. The name control associated with this EIN is `}
          <Text style={styles.nameControlInline}>{data.nameControl}</Text>
          {"."}
        </Text>

        {/* ── "What you need to do" section ───────────────────────────── */}
        {/* Verbatim from specimen — no §4 substitutions in this section */}
        <Text style={styles.sectionHeading}>What you need to do</Text>
        <View style={styles.sectionRule} />
        <View style={styles.bulletList}>
          <Bullet>
            If you did not apply for this EIN, visit IRS.gov/EINNotRequested.
          </Bullet>
          <Bullet>
            Use this EIN and your name exactly as they appear above when you fill out
            your tax returns. Otherwise, it may cause delays. Keep a copy of this notice
            for records because we will only send it to you once. You can share a copy
            with future officers of your organization or anyone asking for proof of your
            EIN. If your name or address is incorrect as shown, send the correct
            information to the address at the top of this notice.
          </Bullet>
          <Bullet>
            If a Limited Liability Company (LLC) elects to be classified as an association
            taxable as a corporation, the LLC must file Form 2553, Election by a Small
            Business Corporation. If an LLC wants to elect S corporation status and meets
            certain criteria, the LLC must timely file Form 2553 or a similar business
            corporation election form. See the section titled {"\""}Limited Liability
            Companies{"\""}  in the instructions for Form 1120-S and its corresponding
            annual tax return. For more information, visit IRS.gov/LLC and refer to
            Publication 3402, Taxation of Limited Liability Companies.
          </Bullet>
        </View>

        {/* ── "Additional Information" section ────────────────────────── */}
        {/* Bullets 2 and 3: §4 phone substitution (800-TAX-FORM, 800-829-4933 → helpdesk) */}
        <Text style={styles.sectionHeading}>Additional Information</Text>
        <View style={styles.sectionRule} />
        <View style={styles.bulletList}>
          {/* Bullet 1 — verbatim, no phone, no swap */}
          <Bullet>
            Refer to Publication 4557, Safeguarding Taxpayer Data: A Guide for Your
            Business, for tips on keeping your EIN safe.
          </Bullet>
          {/* Bullet 2 — §4: "800-TAX-FORM (800-829-3676)" → HELPDESK_PHONE */}
          <Bullet>
            Find tax forms or publications by visiting IRS.gov/Forms or by calling{" "}
            {HELPDESK_PHONE}.
          </Bullet>
          {/* Bullet 3 — §4: "800-829-4933" → HELPDESK_PHONE */}
          <Bullet>
            Call us at {HELPDESK_PHONE} if you can{"'"}t find what you need online. If
            you prefer, you can write to the address at the top of this notice.
          </Bullet>
        </View>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        {/* Verbatim template from specimen footer line */}
        <View style={styles.footer} fixed>
          <Text>Notice CP575G</Text>
          <Text style={styles.footerCenter}>
            Employer ID Number {data.ein}
          </Text>
          <Text>Page 1/1</Text>
        </View>

      </Page>
    </Document>
  );
}
