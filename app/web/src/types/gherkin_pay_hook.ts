/**
 * TypeScript types for the gherkin_pay_hook program.
 */
export interface ComplianceEntry {
  isAllowed: boolean;
  bump: number;
}

export enum HookErrorCode {
  SenderNotCompliant = 6000,
  ReceiverNotCompliant = 6001,
}
