/**
 * IRS EIN Wizard — shared dropdown option lists
 *
 * stateTypes1   — 63-option state/territory list.
 *                 Values and labels verbatim from AddressForm.tsx (W3), which
 *                 sourced them verbatim from the W3 HTML capture.
 *
 * monthTypes    — 12-option month list.
 *                 Values JANUARY–DECEMBER (all-caps) match the IRS SPA's
 *                 submitted values observed in the bundle. Labels are the
 *                 English month names shown in the Additional Details 1 capture.
 */

export const STATE_OPTIONS: [string, string][] = [
  ["AK", "Alaska (AK) "],
  ["AL", "Alabama (AL) "],
  ["AR", "Arkansas (AR) "],
  ["AZ", "Arizona (AZ) "],
  ["CA", "California (CA) "],
  ["CO", "Colorado (CO) "],
  ["CT", "Connecticut (CT) "],
  ["DE", "Delaware (DE) "],
  ["DC", "District of Columbia (DC) "],
  ["FL", "Florida (FL) "],
  ["GA", "Georgia (GA) "],
  ["HI", "Hawaii (HI) "],
  ["ID", "Idaho (ID) "],
  ["IL", "Illinois (IL) "],
  ["IN", "Indiana (IN) "],
  ["IA", "Iowa (IA) "],
  ["KS", "Kansas (KS) "],
  ["KY", "Kentucky (KY) "],
  ["LA", "Louisiana (LA) "],
  ["ME", "Maine (ME) "],
  ["MD", "Maryland (MD) "],
  ["MA", "Massachusetts (MA) "],
  ["MI", "Michigan (MI) "],
  ["MN", "Minnesota (MN) "],
  ["MS", "Mississippi (MS) "],
  ["MO", "Missouri (MO) "],
  ["MT", "Montana (MT) "],
  ["NE", "Nebraska (NE) "],
  ["NV", "Nevada (NV) "],
  ["NH", "New Hampshire (NH) "],
  ["NJ", "New Jersey (NJ) "],
  ["NM", "New Mexico (NM) "],
  ["NY", "New York (NY) "],
  ["NC", "North Carolina (NC) "],
  ["ND", "North Dakota (ND) "],
  ["OH", "Ohio (OH) "],
  ["OK", "Oklahoma (OK) "],
  ["OR", "Oregon (OR) "],
  ["PA", "Pennsylvania (PA) "],
  ["RI", "Rhode Island (RI) "],
  ["SC", "South Carolina (SC) "],
  ["SD", "South Dakota (SD) "],
  ["TN", "Tennessee (TN) "],
  ["TX", "Texas (TX) "],
  ["UT", "Utah (UT) "],
  ["VT", "Vermont (VT) "],
  ["VA", "Virginia (VA) "],
  ["WA", "Washington (WA) "],
  ["WV", "West Virginia (WV) "],
  ["WI", "Wisconsin (WI) "],
  ["WY", "Wyoming (WY) "],
  ["AS", "American Samoa (AS) "],
  ["FM", "Micronesia, Federated States (FM) "],
  ["GU", "Guam (GU) "],
  ["MH", "Marshall Islands (MH) "],
  ["MP", "Northern Mariana Island (MP) "],
  ["PR", "Puerto Rico (PR) "],
  ["VI", "Virgin Islands (US) (VI) "],
  ["AA", "Armed Forces Americas (AA) "],
  ["AP", "Armed Forces Pacific (AP) "],
  ["AE", "Armed Forces Others (AE) "],
  ["AE", "Armed Forces Africa (AE) "],
  ["AE", "Armed Forces Canada (AE) "],
  ["AE", "Armed Forces Europe (AE) "],
  ["AE", "Armed Forces Middle East (AE) "],
];

// Month option values are all-caps per the IRS SPA bundle.
// Labels match the English month names displayed in the Additional Details capture.
export const MONTH_OPTIONS: [string, string][] = [
  ["JANUARY",   "January"],
  ["FEBRUARY",  "February"],
  ["MARCH",     "March"],
  ["APRIL",     "April"],
  ["MAY",       "May"],
  ["JUNE",      "June"],
  ["JULY",      "July"],
  ["AUGUST",    "August"],
  ["SEPTEMBER", "September"],
  ["OCTOBER",   "October"],
  ["NOVEMBER",  "November"],
  ["DECEMBER",  "December"],
];
