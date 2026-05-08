"use client";

/**
 * LLC Single-Page Form — Retrofit R2
 *
 * Pixel-faithful recreation of the real Sunbiz coretype.exe form.
 * Reference: Florida_Sunbiz_website/3_Step_3_2_SUNBIZ FILING AN LLC/
 *            3_sunbiz.org - Florida Department of State.html
 *
 * All field names, max-lengths, section order, and legal copy come from
 * that captured HTML — not from general knowledge.
 *
 * Route: /starbiz/filing/llc/form
 * Reachable from: /starbiz/filing/llc/disclaimer  → "Start New Filing"
 * NOT linked from the existing wizard (/starbiz/filing/llc/page.tsx) — untouched.
 */

import { useActionState, useState } from "react";

import { StarBizShell } from "@/components/starbiz/StarBizShell";

import { submitLLCForm, type LLCFormState } from "./actions";

// ─── Style constants (faithful to Sunbiz CSS classes) ────────────────────────

const font = "Arial, Helvetica, sans-serif";

const sPageTitle: React.CSSProperties = {
  fontFamily: font,
  fontSize: "15px",
  fontWeight: "bold",
  color: "#003366",
};

const sHeading: React.CSSProperties = {
  fontFamily: font,
  fontSize: "13px",
  fontWeight: "bold",
  backgroundColor: "#d0d8e8",
  border: "1px solid #aabbcc",
  padding: "2px 6px",
};

/** .descript — italic label cells */
const sLabel: React.CSSProperties = {
  fontFamily: font,
  fontSize: "12px",
  fontStyle: "italic",
  whiteSpace: "nowrap",
  paddingRight: "6px",
  verticalAlign: "middle",
};

/** .descript non-italic variant for plain body labels */
const sLabelPlain: React.CSSProperties = {
  ...sLabel,
  fontStyle: "normal",
};

const sData: React.CSSProperties = {
  fontFamily: font,
  fontSize: "12px",
  verticalAlign: "middle",
};

const sBodyText: React.CSSProperties = {
  fontFamily: font,
  fontSize: "12px",
};

/** .TableNote — yellow background legal/notice boxes */
const sTableNote: React.CSSProperties = {
  backgroundColor: "#FFFFCC",
  border: "1px solid #999",
  padding: "8px 10px",
};

/** .LegalText — small italic legal disclaimer text */
const sLegalText: React.CSSProperties = {
  fontFamily: font,
  fontSize: "11px",
  fontStyle: "italic",
};

/** .RedText — bold red warning */
const sRedText: React.CSSProperties = {
  fontFamily: font,
  fontSize: "12px",
  color: "red",
  fontWeight: "bold",
};

const sLink: React.CSSProperties = {
  fontFamily: font,
  fontSize: "12px",
  color: "#003366",
};

const sInput: React.CSSProperties = {
  fontFamily: font,
  fontSize: "12px",
  border: "1px solid #999",
  padding: "1px 3px",
};

// ─── Small helpers ────────────────────────────────────────────────────────────

function Spacer({ h = 5 }: { h?: number }) {
  return <tr><td colSpan={99}><div style={{ height: `${h}px` }} /></td></tr>;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span
      style={{
        color: "red",
        fontSize: "11px",
        fontWeight: "bold",
        display: "block",
        marginTop: "1px",
      }}
    >
      ⚠ {msg}
    </span>
  );
}

// ─── Manager Slot (6 fixed slots: off1 … off6) ───────────────────────────────

function ManagerSlot({
  n,
  errors,
}: {
  n: number;
  errors: Record<string, string>;
}) {
  const p = `off${n}`;

  return (
    <>
      {/* Title */}
      <table cellPadding={2} cellSpacing={0}>
        <tbody>
          <tr>
            <td style={sLabel}>
              <label htmlFor={`${p}_name_title`}>Title</label>
            </td>
            <td style={sData} colSpan={4}>
              <input
                type="text"
                id={`${p}_name_title`}
                name={`${p}_name_title`}
                size={4}
                maxLength={4}
                style={sInput}
              />
              {" "}(MGR, AMBR, AP or other designated title(s))
            </td>
          </tr>
          {n === 1 && errors.off1_name_title && (
            <tr>
              <td colSpan={5}>
                <FieldError msg={errors.off1_name_title} />
              </td>
            </tr>
          )}
          {/* Name: Last, First, Initial, Title (Sr., Jr.) */}
          <tr>
            <td style={sLabel}>Name</td>
            <td style={sData}>
              <input
                type="text"
                id={`${p}_name_last_name`}
                name={`${p}_name_last_name`}
                size={20}
                maxLength={20}
                style={sInput}
              />
              ,
            </td>
            <td style={sData}>
              <input
                type="text"
                name={`${p}_name_first_name`}
                size={14}
                maxLength={14}
                style={sInput}
              />
              ,
            </td>
            <td style={sData}>
              <input
                type="text"
                name={`${p}_name_m_name`}
                size={3}
                maxLength={1}
                style={sInput}
              />
              ,
            </td>
            <td style={sData}>
              <input
                type="text"
                name={`${p}_name_title_name`}
                size={7}
                maxLength={7}
                style={sInput}
              />
            </td>
          </tr>
          {/* Labels under name fields */}
          <tr>
            <td style={{ width: "10%" }} />
            <td style={sLabel}>
              <label htmlFor={`${p}_name_last_name`}>Last Name</label>
            </td>
            <td style={sLabel}>First Name</td>
            <td style={sLabel}>Initial</td>
            <td style={sLabel}>Title (Sr., Jr., etc.)</td>
          </tr>
          {/* OR separator */}
          <tr>
            <td style={{ ...sLabel, textAlign: "center" }}>
              <b>- OR -</b>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Entity name + address */}
      <table cellPadding={2} cellSpacing={0}>
        <tbody>
          <tr>
            <td style={sLabel}>
              <label htmlFor={`${p}_name_corp_name`}>
                Entity Name to serve as MGR,<br />AMBR, AP or other designated title(s)
              </label>
            </td>
            <td style={sData}>
              <input
                type="text"
                id={`${p}_name_corp_name`}
                name={`${p}_name_corp_name`}
                size={42}
                maxLength={42}
                style={sInput}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}><div style={{ height: "10px" }} /></td>
          </tr>
          <tr>
            <td style={sLabel}>
              <label htmlFor={`${p}_name_addr1`}>Street Address</label>
            </td>
            <td style={sData}>
              <input
                type="text"
                id={`${p}_name_addr1`}
                name={`${p}_name_addr1`}
                size={42}
                maxLength={42}
                style={sInput}
              />
            </td>
          </tr>
          <tr>
            <td style={sLabel}>
              <label htmlFor={`${p}_name_city`}>City,</label>{" "}
              <label htmlFor={`${p}_name_st`}>State</label>
            </td>
            <td style={sData}>
              <input
                type="text"
                id={`${p}_name_city`}
                name={`${p}_name_city`}
                size={28}
                maxLength={28}
                style={sInput}
              />
              ,{" "}
              <input
                type="text"
                id={`${p}_name_st`}
                name={`${p}_name_st`}
                size={2}
                maxLength={2}
                style={sInput}
              />
            </td>
          </tr>
          <tr>
            <td style={sLabel}>
              <label htmlFor={`${p}_name_zip`}>Zip Code</label> &amp;{" "}
              <label htmlFor={`${p}_name_cntry`}>Country</label>
            </td>
            <td style={sData}>
              <input
                type="text"
                id={`${p}_name_zip`}
                name={`${p}_name_zip`}
                size={9}
                maxLength={9}
                style={sInput}
              />
              {" "}
              <input
                type="text"
                id={`${p}_name_cntry`}
                name={`${p}_name_cntry`}
                size={2}
                maxLength={2}
                style={sInput}
              />
            </td>
          </tr>
          <tr>
            <td colSpan={2}><div style={{ height: "10px" }} /></td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LLCFormPage() {
  const [state, formAction, isPending] = useActionState<LLCFormState, FormData>(
    submitLLCForm,
    {},
  );

  const fd   = state.formData    ?? {};
  const errs = state.fieldErrors ?? {};

  // Character counter for purpose textarea (initialise from returned formData)
  const [charsLeft, setCharsLeft] = useState(
    240 - (fd.purpose?.length ?? 0),
  );

  // Mailing same-as-principal: controlled state
  const [sameAddr,  setSameAddr]  = useState(fd.same_addr_flag === "Y");
  const [mailAddr1, setMailAddr1] = useState(fd.mail_addr1 ?? "");
  const [mailAddr2, setMailAddr2] = useState(fd.mail_addr2 ?? "");
  const [mailCity,  setMailCity]  = useState(fd.mail_city  ?? "");
  const [mailSt,    setMailSt]    = useState(fd.mail_st    ?? "");
  const [mailZip,   setMailZip]   = useState(fd.mail_zip   ?? "");
  const [mailCntry, setMailCntry] = useState(fd.mail_cntry ?? "");

  /** Copies current principal DOM values into mailing state (matches Sunbiz copyPrincToMail()). */
  function handleSameAddrChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setSameAddr(checked);
    if (checked) {
      const val = (id: string) =>
        (document.getElementById(id) as HTMLInputElement | null)?.value ?? "";
      setMailAddr1(val("princ_addr1"));
      setMailAddr2(val("princ_addr2"));
      setMailCity(val("princ_city"));
      setMailSt(val("princ_st"));
      setMailZip(val("princ_zip"));
      setMailCntry(val("princ_cntry"));
    }
  }

  const readonlyMailStyle: React.CSSProperties = {
    ...sInput,
    backgroundColor: sameAddr ? "#f0f0f0" : undefined,
  };

  return (
    <StarBizShell>
      {/* Global DB/auth error */}
      {state.error && (
        <div
          style={{
            ...sRedText,
            marginBottom: "10px",
            padding: "6px 10px",
            border: "2px solid red",
            backgroundColor: "#fff0f0",
          }}
        >
          {state.error}
        </div>
      )}

      <form action={formAction} id="filingform">
        {/* Hidden fields matching real Sunbiz */}
        <input type="hidden" name="filing_type" value="LLC" />
        <input type="hidden" name="menu_function" value="ADD" />

        <table
          summary="This table is used for page layout"
          style={{ width: "100%", borderCollapse: "collapse" }}
          cellPadding={4}
          cellSpacing={2}
        >
          <tbody>
            {/* ══ Page title ════════════════════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sPageTitle}>
                        Florida Limited Liability Company Filing
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 1 — Filing Information ═══════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sHeading}>Filing Information</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Effective date */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        If an effective date is required for this filing, enter here
                      </td>
                      <td style={{ ...sData, textAlign: "center", whiteSpace: "nowrap" }}>
                        <input
                          type="text"
                          size={2}
                          maxLength={2}
                          name="eff_date_mm"
                          id="eff_date_mm"
                          defaultValue={fd.eff_date_mm ?? ""}
                          style={sInput}
                        />
                        /
                        <input
                          type="text"
                          size={2}
                          maxLength={2}
                          name="eff_date_dd"
                          id="eff_date_dd"
                          defaultValue={fd.eff_date_dd ?? ""}
                          style={sInput}
                        />
                        /
                        <input
                          type="text"
                          size={4}
                          maxLength={4}
                          name="eff_date_yyyy"
                          id="eff_date_yyyy"
                          defaultValue={fd.eff_date_yyyy ?? ""}
                          style={sInput}
                        />
                      </td>
                      <td style={{ ...sBodyText, whiteSpace: "nowrap" }}>
                        <label htmlFor="eff_date_mm">(MM</label>
                        <label htmlFor="eff_date_dd">/DD</label>
                        <label htmlFor="eff_date_yyyy">/YYYY)</label>
                      </td>
                      <td>
                        <a href="#" style={sLink}>What is an effective date?</a>
                      </td>
                    </tr>
                    {errs.eff_date_mm && (
                      <tr>
                        <td colSpan={4}>
                          <FieldError msg={errs.eff_date_mm} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Required filing fee */}
            <tr>
              <td style={sLabel}>&nbsp;Required Filing Fees: $125.00</td>
            </tr>

            {/* Certificate of Status + Certified Copy */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="cos_num_flag">Certificate of Status</label>
                      </td>
                      <td style={sLabel}>
                        <input
                          type="checkbox"
                          name="cos_num_flag"
                          value="Y"
                          id="cos_num_flag"
                          defaultChecked={fd.cos_num_flag === "Y"}
                        />{" "}
                        $5.00{" "}
                        <span style={{ fontSize: "11px", color: "#555" }}>
                          (Optional)
                        </span>
                      </td>
                      <td>
                        <a href="#" style={sLink}>
                          What is a certificate of status?
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="cert_num_flag">Certified Copy</label>
                      </td>
                      <td style={sLabel}>
                        <input
                          type="checkbox"
                          name="cert_num_flag"
                          value="Y"
                          id="cert_num_flag"
                          defaultChecked={fd.cert_num_flag === "Y"}
                        />{" "}
                        $30.00{" "}
                        <span style={{ fontSize: "11px", color: "#555" }}>
                          (Optional)
                        </span>
                      </td>
                      <td>
                        <a href="#" style={sLink}>
                          What is a certified copy?
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Limited Liability Company Name */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="corp_name">
                          Limited Liability Company Name
                        </label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={60}
                          maxLength={192}
                          name="corp_name"
                          id="corp_name"
                          defaultValue={fd.corp_name ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {errs.corp_name && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.corp_name} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {/* Red name-format warning */}
                <table>
                  <tbody>
                    <tr>
                      <td style={{ width: "37%", verticalAlign: "top" }} />
                      <td
                        style={{
                          ...sBodyText,
                          color: "red",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                        }}
                      >
                        (Name must end with &quot;Limited Liability Company&quot;,
                        &quot;L.L.C.&quot; or &quot;LLC&quot;)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 2 — Principal Place of Business ═══════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <Spacer />
                    <tr>
                      <td style={sHeading}>Principal Place of Business</td>
                      <td style={{ ...sBodyText, whiteSpace: "nowrap", paddingLeft: "8px" }}>
                        &nbsp;&nbsp;(The principal address must be a{" "}
                        <b>
                          <u>street</u>
                        </b>{" "}
                        address)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="princ_addr1">Address</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="princ_addr1"
                          id="princ_addr1"
                          defaultValue={fd.princ_addr1 ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {errs.princ_addr1 && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.princ_addr1} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="princ_addr2">Suite, Apt. #, etc.</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="princ_addr2"
                          id="princ_addr2"
                          defaultValue={fd.princ_addr2 ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="princ_city">City,</label>{" "}
                        <label htmlFor="princ_st">State</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={28}
                          maxLength={28}
                          name="princ_city"
                          id="princ_city"
                          defaultValue={fd.princ_city ?? ""}
                          style={sInput}
                        />
                        ,{" "}
                        <input
                          type="text"
                          size={2}
                          maxLength={2}
                          name="princ_st"
                          id="princ_st"
                          defaultValue={fd.princ_st ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {(errs.princ_city || errs.princ_st) && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.princ_city} />
                          <FieldError msg={errs.princ_st} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="princ_zip">Zip Code</label> &amp;{" "}
                        <label htmlFor="princ_cntry">Country</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={9}
                          maxLength={9}
                          name="princ_zip"
                          id="princ_zip"
                          defaultValue={fd.princ_zip ?? ""}
                          style={sInput}
                        />
                        {" "}
                        <input
                          type="text"
                          size={2}
                          maxLength={2}
                          name="princ_cntry"
                          id="princ_cntry"
                          defaultValue={fd.princ_cntry ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {errs.princ_zip && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.princ_zip} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 3 — Mailing Address ════════════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <Spacer />
                    <tr>
                      <td style={sHeading}>Mailing Address</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table style={{ width: "90%" }} cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        If your limited liability company mailing address is the same as the
                        principal address above, please check the box below. Otherwise, enter
                        your limited liability company mailing address.
                      </td>
                    </tr>
                    <tr>
                      <td style={sLabel}>
                        <input
                          type="checkbox"
                          name="same_addr_flag"
                          value="Y"
                          id="same_addr_flag"
                          checked={sameAddr}
                          onChange={handleSameAddrChange}
                        />{" "}
                        <label htmlFor="same_addr_flag">
                          Mailing address same as principal address
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="mail_addr1">Address</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="mail_addr1"
                          id="mail_addr1"
                          value={mailAddr1}
                          onChange={(e) => setMailAddr1(e.target.value)}
                          readOnly={sameAddr}
                          style={readonlyMailStyle}
                        />
                      </td>
                    </tr>
                    {errs.mail_addr1 && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.mail_addr1} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="mail_addr2">Suite, Apt. #, etc.</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="mail_addr2"
                          id="mail_addr2"
                          value={mailAddr2}
                          onChange={(e) => setMailAddr2(e.target.value)}
                          readOnly={sameAddr}
                          style={readonlyMailStyle}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="mail_city">City,</label>{" "}
                        <label htmlFor="mail_st">State</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={28}
                          maxLength={28}
                          name="mail_city"
                          id="mail_city"
                          value={mailCity}
                          onChange={(e) => setMailCity(e.target.value)}
                          readOnly={sameAddr}
                          style={readonlyMailStyle}
                        />
                        ,{" "}
                        <input
                          type="text"
                          size={2}
                          maxLength={2}
                          name="mail_st"
                          id="mail_st"
                          value={mailSt}
                          onChange={(e) => setMailSt(e.target.value)}
                          readOnly={sameAddr}
                          style={readonlyMailStyle}
                        />
                      </td>
                    </tr>
                    {(errs.mail_city || errs.mail_st) && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.mail_city} />
                          <FieldError msg={errs.mail_st} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="mail_zip">Zip Code</label> &amp;{" "}
                        <label htmlFor="mail_cntry">Country</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={9}
                          maxLength={9}
                          name="mail_zip"
                          id="mail_zip"
                          value={mailZip}
                          onChange={(e) => setMailZip(e.target.value)}
                          readOnly={sameAddr}
                          style={readonlyMailStyle}
                        />
                        {" "}
                        <input
                          type="text"
                          size={2}
                          maxLength={2}
                          name="mail_cntry"
                          id="mail_cntry"
                          value={mailCntry}
                          onChange={(e) => setMailCntry(e.target.value)}
                          readOnly={sameAddr}
                          style={readonlyMailStyle}
                        />
                      </td>
                    </tr>
                    {errs.mail_zip && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.mail_zip} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 4 — Name And Address of Registered Agent ══════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <Spacer />
                    <tr>
                      <td style={sHeading}>
                        Name And Address of Registered Agent
                      </td>
                      <td />
                      <td>
                        <a href="#" style={sLink}>
                          What is a registered agent?
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                {/* Individual name row */}
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={{ ...sLabel, whiteSpace: "nowrap" }}>Name</td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={16}
                          maxLength={20}
                          name="ra_name_last_name"
                          id="ra_name_last_name"
                          defaultValue={fd.ra_name_last_name ?? ""}
                          style={sInput}
                        />
                        ,
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={14}
                          maxLength={14}
                          name="ra_name_first_name"
                          id="ra_name_first_name"
                          defaultValue={fd.ra_name_first_name ?? ""}
                          style={sInput}
                        />
                        ,
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={3}
                          maxLength={1}
                          name="ra_name_m_name"
                          id="ra_name_m_name"
                          defaultValue={fd.ra_name_m_name ?? ""}
                          style={sInput}
                        />
                        ,
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={7}
                          maxLength={7}
                          name="ra_name_title_name"
                          id="ra_name_title_name"
                          defaultValue={fd.ra_name_title_name ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {/* Labels */}
                    <tr>
                      <td />
                      <td style={sLabel}>
                        <label htmlFor="ra_name_last_name">Last Name</label>
                      </td>
                      <td style={sLabel}>
                        <label htmlFor="ra_name_first_name">First Name</label>
                      </td>
                      <td style={sLabel}>
                        <label htmlFor="ra_name_m_name">Initial</label>
                      </td>
                      <td style={sLabel}>
                        <label htmlFor="ra_name_title_name">
                          Title (Sr., Jr., etc.)
                        </label>
                      </td>
                    </tr>
                  </tbody>
                </table>
                {errs.ra_name_last_name && (
                  <FieldError msg={errs.ra_name_last_name} />
                )}

                {/* OR + business name + address */}
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={{ ...sLabel, textAlign: "center" }}>
                        <b>- OR -</b>
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...sLabel, whiteSpace: "nowrap" }}>
                        <label htmlFor="ra_name_corp_name">
                          Business to serve as RA
                        </label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="ra_name_corp_name"
                          id="ra_name_corp_name"
                          defaultValue={fd.ra_name_corp_name ?? ""}
                          style={sInput}
                        />{" "}
                        (Must be different from entity name being filed)
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2}>
                        <div style={{ height: "10px" }} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...sLabel, whiteSpace: "nowrap" }}>
                        <label htmlFor="ra_addr1">Address</label>
                      </td>
                      <td style={{ ...sData, whiteSpace: "nowrap" }}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="ra_addr1"
                          id="ra_addr1"
                          defaultValue={fd.ra_addr1 ?? ""}
                          style={sInput}
                        />{" "}
                        (PO Box not acceptable)
                      </td>
                    </tr>
                    {errs.ra_addr1 && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.ra_addr1} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="ra_addr2">Suite, Apt. #, etc.</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="ra_addr2"
                          id="ra_addr2"
                          defaultValue={fd.ra_addr2 ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="ra_city">City,</label> State
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={28}
                          maxLength={28}
                          name="ra_city"
                          id="ra_city"
                          defaultValue={fd.ra_city ?? ""}
                          style={sInput}
                        />
                        , FL
                      </td>
                    </tr>
                    {errs.ra_city && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.ra_city} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="ra_zip">Zip Code</label> &amp; Country
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={9}
                          maxLength={9}
                          name="ra_zip"
                          id="ra_zip"
                          defaultValue={fd.ra_zip ?? ""}
                          style={sInput}
                        />{" "}
                        US
                      </td>
                    </tr>
                    {errs.ra_zip && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.ra_zip} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 5 — RA Signature (yellow box) ══════════════════════ */}
            <tr>
              <td>
                <table
                  style={{ ...sTableNote, width: "80%" }}
                  cellPadding={4}
                  cellSpacing={0}
                >
                  <tbody>
                    <tr>
                      <td
                        colSpan={2}
                        style={{ ...sBodyText, textAlign: "justify" }}
                      >
                        The Registered Agent must type their name in the
                        &lsquo;Registered Agent Signature&rsquo; block below.
                        RA signature MUST be an individual name. If the RA is a
                        business entity, an individual must sign on the
                        entity&apos;s behalf.{" "}
                        <b>
                          Do not enter the name of the entity you are attempting
                          to file as Registered Agent.
                        </b>{" "}
                        A business entity cannot serve as its own RA.
                      </td>
                      <td />
                    </tr>
                    <tr>
                      <td style={{ ...sLabel, whiteSpace: "nowrap" }}>
                        <label htmlFor="ra_signature">
                          Registered Agent Signature
                        </label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={40}
                          maxLength={40}
                          name="ra_signature"
                          id="ra_signature"
                          defaultValue={fd.ra_signature ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {errs.ra_signature && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.ra_signature} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td
                        colSpan={2}
                        style={{ ...sLegalText, textAlign: "justify" }}
                      >
                        This signature must be that of the individual
                        &ldquo;signing&rdquo; this document electronically or be
                        made with the full knowledge and permission of the
                        individual, otherwise it constitutes <b>forgery</b>{" "}
                        under s.{" "}
                        <a href="#" style={{ ...sLink, fontSize: "11px" }}>
                          831.06
                        </a>
                        , F.S.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 6 — Any Other Provision(s) ════════════════════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <Spacer />
                    <tr>
                      <td style={sHeading}>
                        Any Other Provision(s) - Optional (Purpose, Statements, etc.)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="purpose">(Maximum of 240 characters.)</label>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <textarea
                          rows={6}
                          cols={40}
                          name="purpose"
                          id="purpose"
                          maxLength={240}
                          defaultValue={fd.purpose ?? ""}
                          style={{
                            fontFamily: font,
                            fontSize: "12px",
                            border: "1px solid #999",
                          }}
                          onChange={(e) =>
                            setCharsLeft(240 - e.target.value.length)
                          }
                        />
                      </td>
                    </tr>
                    <tr>
                      <td style={sLabel}>
                        <input
                          type="text"
                          name="counter"
                          maxLength={3}
                          size={3}
                          value={charsLeft}
                          readOnly
                          style={{ ...sInput, width: "30px", textAlign: "center" }}
                        />{" "}
                        characters remaining
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 7 — Notice of Annual Report (yellow box) ══════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <Spacer />
                    <tr>
                      <td style={sHeading}>Notice of Annual Report</td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table
                  style={{ ...sTableNote, width: "80%" }}
                  cellPadding={4}
                  cellSpacing={0}
                >
                  <tbody>
                    <tr>
                      <td style={{ ...sLegalText, textAlign: "justify" }}>
                        This Limited Liability Company (LLC) must file an Annual
                        Report with the Division of Corporations between January
                        1st and May 1st of every year to maintain &ldquo;active&rdquo;
                        status. The LLC&apos;s first annual report will be due between
                        January 1st and May 1st of the calendar year following
                        the year the LLC is formed and must be filed{" "}
                        <a href="#" style={{ ...sLink, fontSize: "11px" }}>
                          online
                        </a>
                        . The fee to file a LLC Annual Report is $138.75. A late
                        fee of $400 is applied if the report is filed after May
                        1st. Reminder notices to file the Annual Report will be
                        sent to the e-mail address you provide in these articles.
                        File early to avoid the late fee.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 8 — Correspondence Name And E-mail Address ════════ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={2}>
                  <tbody>
                    <Spacer />
                    <tr>
                      <td style={sHeading}>
                        Correspondence Name And E-mail Address
                      </td>
                      <td />
                      <td>
                        <a href="#" style={sLink}>
                          Why do you need my e-mail address?
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table style={{ width: "80%" }} cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        Please enter your e-mail address carefully and verify
                        that it is correct. This is the address correspondence
                        pertaining to this filing and future annual report notices
                        will be sent.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="ret_name">Name</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={42}
                          maxLength={42}
                          name="ret_name"
                          id="ret_name"
                          defaultValue={fd.ret_name ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {errs.ret_name && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.ret_name} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={sLabel}>
                        <label htmlFor="ret_email_addr">E-mail Address</label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={30}
                          maxLength={60}
                          name="ret_email_addr"
                          id="ret_email_addr"
                          defaultValue={fd.ret_email_addr ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {errs.ret_email_addr && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.ret_email_addr} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td style={{ ...sLabel, whiteSpace: "nowrap" }}>
                        <label htmlFor="email_addr_verify">
                          Re-enter E-mail Address
                        </label>
                      </td>
                      <td style={sData}>
                        <input
                          type="text"
                          size={30}
                          maxLength={60}
                          name="email_addr_verify"
                          id="email_addr_verify"
                          defaultValue={fd.email_addr_verify ?? ""}
                          style={sInput}
                        />
                      </td>
                    </tr>
                    {errs.email_addr_verify && (
                      <tr>
                        <td colSpan={2}>
                          <FieldError msg={errs.email_addr_verify} />
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 9 — Member/Authorized Rep Signature (yellow box) ══ */}
            <tr>
              <td>
                <table
                  style={{ ...sTableNote, width: "80%" }}
                  cellPadding={4}
                  cellSpacing={0}
                >
                  <tbody>
                    <tr>
                      <td style={{ ...sLabelPlain, fontWeight: "bold" }}>
                        Signature of a member or an authorized representative.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <table cellPadding={2} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td style={{ ...sLabel, whiteSpace: "nowrap" }}>
                                <label htmlFor="signature">
                                  Electronic Signature
                                </label>
                              </td>
                              <td style={sData}>
                                <input
                                  type="text"
                                  size={40}
                                  maxLength={40}
                                  name="signature"
                                  id="signature"
                                  defaultValue={fd.signature ?? ""}
                                  style={sInput}
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    {errs.signature && (
                      <tr>
                        <td>
                          <FieldError msg={errs.signature} />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>
                        <table cellPadding={2} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td
                                style={{ ...sLegalText, textAlign: "justify" }}
                              >
                                I am the member or authorized representative
                                submitting these Articles of Organization and
                                affirm that the facts stated herein are true. I
                                am aware that false information submitted in a
                                document to the Department of State constitutes a
                                third degree felony as provided for in s.{" "}
                                <a
                                  href="#"
                                  style={{ ...sLink, fontSize: "11px" }}
                                >
                                  817.155
                                </a>
                                , F.S. I acknowledge that I have read the above
                                &ldquo;Notice of Annual Report&rdquo; statement
                                and understand the requirement to file an annual
                                report between January 1st and May 1st in the
                                calendar year following formation of this LLC and
                                every year thereafter to maintain
                                &ldquo;active&rdquo; status.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 10 — Manager/Authorized Rep Slots (off1 … off6) ══ */}
            <tr>
              <td>
                <table cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <Spacer />
                    <Spacer />
                    <tr>
                      <td style={{ ...sHeading, whiteSpace: "nowrap" }}>
                        Name And Address of Person(s) Authorized to Manage LLC
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <a
                          href="#"
                          style={{ ...sLink, fontSize: "11px" }}
                        >
                          What is an Authorized Representative (AR), Authorized
                          Person (AP), Authorized Member (AMBR), or Manager
                          (MGR)?
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* Red instruction box */}
            <tr>
              <td>
                <table
                  style={{ ...sTableNote, width: "80%" }}
                  cellPadding={4}
                  cellSpacing={0}
                >
                  <tbody>
                    <tr>
                      <td
                        colSpan={2}
                        style={{ ...sBodyText, textAlign: "justify" }}
                      >
                        <span
                          style={{
                            color: "red",
                            fontWeight: "bold",
                            textDecoration: "underline",
                          }}
                        >
                          List the name and address of each manager or
                          representative authorized to manage and control the
                          company.
                        </span>{" "}
                        <b>
                          This information is required to open most bank accounts
                          and to obtain workers&apos; comp exemption. Once this
                          document is filed, any changes will require an
                          amendment, which cannot be filed online, and cost an
                          additional $25.00 filing fee.
                        </b>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* 6 fixed manager slots */}
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <tr key={n}>
                <td>
                  <ManagerSlot n={n} errors={errs} />
                </td>
              </tr>
            ))}

            {/* ══ Section 11 — Bottom red accuracy warning ═══════════════════ */}
            <tr>
              <td>
                <table style={{ width: "100%" }} cellPadding={2} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={sRedText}>
                        Please review the filing for accuracy. If you need to
                        make corrections, do so at this time. The filing
                        information will be added/edited exactly as you have
                        entered it. Once you have submitted the information, your
                        filing cannot be updated, removed, cancelled or refunded.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>

            {/* ══ Section 12 — Buttons ════════════════════════════════════════ */}
            <tr>
              <td>
                <table style={{ width: "80%" }} cellPadding={4} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="submit"
                          disabled={isPending}
                          style={{
                            fontFamily: font,
                            fontSize: "13px",
                            padding: "3px 18px",
                            cursor: isPending ? "not-allowed" : "pointer",
                          }}
                        >
                          {isPending ? "Submitting…" : "Continue"}
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          style={{
                            fontFamily: font,
                            fontSize: "13px",
                            padding: "3px 18px",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            (document.getElementById("filingform") as HTMLFormElement | null)?.reset();
                            setSameAddr(false);
                            setMailAddr1("");
                            setMailAddr2("");
                            setMailCity("");
                            setMailSt("");
                            setMailZip("");
                            setMailCntry("");
                            setCharsLeft(240);
                          }}
                        >
                          Reset
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </StarBizShell>
  );
}
