// Sunbiz-faithful search form. Native GET form — on submit routes to
// /starbiz/results?type=<type>&q=<query> for Slice 2 to pick up.

const NAVY = "#003366";
const WHITE = "#FFFFFF";

const inputStyle: React.CSSProperties = {
  border: "1px solid #666",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "13px",
  padding: "2px 4px",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "12px",
  fontWeight: "bold",
};

const sectionHeaderStyle: React.CSSProperties = {
  backgroundColor: NAVY,
  color: WHITE,
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "13px",
  fontWeight: "bold",
  padding: "3px 8px",
  marginBottom: "8px",
};

export type SearchType =
  | "by-name"
  | "by-document-number"
  | "by-officer"
  | "by-fei"
  | "by-fictitious-owner"
  | "by-trademark"
  | "by-trademark-owner";

const SEARCH_TITLES: Record<SearchType, string> = {
  "by-name":              "Search by Entity Name",
  "by-document-number":   "Search by Document Number",
  "by-officer":           "Search by Officer / Registered Agent Name",
  "by-fei":               "Search by FEI / EIN Number",
  "by-fictitious-owner":  "Search by Fictitious Name Owner",
  "by-trademark":         "Search by Trademark Name",
  "by-trademark-owner":   "Search by Trademark Owner Name",
};

function SearchByName() {
  return (
    <table cellPadding={4} cellSpacing={0} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      <tbody>
        <tr>
          <td style={labelStyle}>Entity Name:</td>
          <td><input type="text" name="q" size={40} style={inputStyle} autoFocus /></td>
        </tr>
        <tr>
          <td style={labelStyle}>Search By:</td>
          <td>
            <label style={labelStyle}><input type="radio" name="name_type" value="current" defaultChecked /> Entity Name</label>
            &nbsp;&nbsp;
            <label style={labelStyle}><input type="radio" name="name_type" value="previous" /> Previous Name</label>
          </td>
        </tr>
        <tr>
          <td style={labelStyle}>Status:</td>
          <td>
            <label style={labelStyle}><input type="radio" name="status" value="active" defaultChecked /> Active</label>
            &nbsp;&nbsp;
            <label style={labelStyle}><input type="radio" name="status" value="inactive" /> Inactive</label>
            &nbsp;&nbsp;
            <label style={labelStyle}><input type="radio" name="status" value="both" /> Both</label>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SearchByDocumentNumber() {
  return (
    <table cellPadding={4} cellSpacing={0} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      <tbody>
        <tr>
          <td style={labelStyle}>Document Number:</td>
          <td><input type="text" name="q" size={30} style={inputStyle} placeholder="e.g. L26000123456" autoFocus /></td>
        </tr>
      </tbody>
    </table>
  );
}

function SearchByOfficer() {
  return (
    <table cellPadding={4} cellSpacing={0} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      <tbody>
        <tr>
          <td style={labelStyle}>Last Name:</td>
          <td><input type="text" name="q" size={30} style={inputStyle} autoFocus /></td>
        </tr>
        <tr>
          <td style={labelStyle}>First Name (optional):</td>
          <td><input type="text" name="first_name" size={20} style={inputStyle} /></td>
        </tr>
      </tbody>
    </table>
  );
}

function SearchByFei() {
  return (
    <table cellPadding={4} cellSpacing={0} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      <tbody>
        <tr>
          <td style={labelStyle}>FEI/EIN Number:</td>
          <td>
            <input type="text" name="q" size={20} style={inputStyle} placeholder="XX-XXXXXXX" autoFocus />
            <span style={{ marginLeft: "8px", fontSize: "11px", color: "#666" }}>Format: XX-XXXXXXX</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SearchByFictitiousOwner() {
  return (
    <table cellPadding={4} cellSpacing={0} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      <tbody>
        <tr>
          <td style={labelStyle}>Owner Name:</td>
          <td><input type="text" name="q" size={35} style={inputStyle} autoFocus /></td>
        </tr>
        <tr>
          <td style={labelStyle}>Owner Type:</td>
          <td>
            <label style={labelStyle}><input type="radio" name="owner_type" value="person" defaultChecked /> Person</label>
            &nbsp;&nbsp;
            <label style={labelStyle}><input type="radio" name="owner_type" value="entity" /> Entity</label>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SearchByTrademark() {
  return (
    <table cellPadding={4} cellSpacing={0} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      <tbody>
        <tr>
          <td style={labelStyle}>Trademark Name:</td>
          <td><input type="text" name="q" size={35} style={inputStyle} autoFocus /></td>
        </tr>
      </tbody>
    </table>
  );
}

function SearchByTrademarkOwner() {
  return (
    <table cellPadding={4} cellSpacing={0} style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: "12px" }}>
      <tbody>
        <tr>
          <td style={labelStyle}>Trademark Owner Name:</td>
          <td><input type="text" name="q" size={35} style={inputStyle} autoFocus /></td>
        </tr>
      </tbody>
    </table>
  );
}

const FORM_BODIES: Record<SearchType, React.ReactNode> = {
  "by-name":              <SearchByName />,
  "by-document-number":   <SearchByDocumentNumber />,
  "by-officer":           <SearchByOfficer />,
  "by-fei":               <SearchByFei />,
  "by-fictitious-owner":  <SearchByFictitiousOwner />,
  "by-trademark":         <SearchByTrademark />,
  "by-trademark-owner":   <SearchByTrademarkOwner />,
};

export function StarBizSearchForm({ type }: { type: SearchType }) {
  return (
    <div>
      <div style={sectionHeaderStyle}>{SEARCH_TITLES[type]}</div>

      <form action="/starbiz/results" method="GET" style={{ marginBottom: "12px" }}>
        <input type="hidden" name="type" value={type} />
        {FORM_BODIES[type]}
        <div style={{ marginTop: "10px" }}>
          <button
            type="submit"
            style={{
              backgroundColor: NAVY,
              color: WHITE,
              border: "none",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "13px",
              fontWeight: "bold",
              padding: "4px 16px",
              cursor: "pointer",
            }}
          >
            Search Now
          </button>
          <button
            type="reset"
            style={{
              marginLeft: "8px",
              backgroundColor: "#888",
              color: WHITE,
              border: "none",
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: "13px",
              padding: "4px 16px",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
