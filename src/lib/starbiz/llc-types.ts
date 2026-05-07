// Shared types for the LLC formation wizard and server action.
// No "use client" or "use server" — importable from either context.

export type PersonRow = {
  name: string;
  title: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  ownershipPct: string;
};

export type WizardData = {
  // Step 1
  name: string;
  managementStructure: "member-managed" | "manager-managed" | "";
  purpose: string;
  effectiveDate: string;
  // Step 2
  principalStreet: string;
  principalCity: string;
  principalState: string;
  principalZip: string;
  mailingIsSame: boolean;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingZip: string;
  // Step 3
  raName: string;
  raStreet: string;
  raCity: string;
  raState: string;
  raZip: string;
  raEmail: string;
  raAccepted: boolean;
  // Step 4
  organizerName: string;
  organizerStreet: string;
  organizerCity: string;
  organizerState: string;
  organizerZip: string;
  feiEin: string;
  feeAcknowledged: boolean;
};

export type LLCSubmitResult = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  returnToStep?: 1 | 2 | 3 | 4;
};
