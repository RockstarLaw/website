// Shared types for the Profit Corporation formation wizard and server action.
// No "use client" or "use server" — importable from either context.

export type DirectorRow = {
  name: string;
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type OfficerRow = {
  name: string;
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type WizardData = {
  // Step 1 — Identity & Stock
  name: string;
  purpose: string;
  effectiveDate: string;
  sharesAuthorized: string;
  parValueDollars: string;     // blank or "0" → no par value
  shareClassName: string;
  // Step 2 — Addresses
  principalStreet: string;
  principalCity: string;
  principalState: string;
  principalZip: string;
  mailingIsSame: boolean;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  // Step 3 — Registered Agent
  raName: string;
  raStreet: string;
  raCity: string;
  raState: string;
  raZip: string;
  raEmail: string;
  raAccepted: boolean;
  // Step 4 — Incorporator + admin
  incorporatorName: string;
  incorporatorStreet: string;
  incorporatorCity: string;
  incorporatorState: string;
  incorporatorZip: string;
  feiEin: string;
  feeAcknowledged: boolean;
};

export type ProfitCorpSubmitResult = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  returnToStep?: 1 | 2 | 3 | 4;
};
