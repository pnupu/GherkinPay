---
estimated_steps: 6
estimated_files: 7
---

# T01: Install shadcn form components and create transaction status toast

**Slice:** S01 — Create Payment Wizard
**Milestone:** M002

## Description

Install the shadcn/ui form components needed by the wizard (Input, Label, Select, RadioGroup, Tabs, Separator) and create a reusable TransactionStatus component that shows loading/success/error states for all write flows in M002.

## Steps

1. Run `npx shadcn@canary add input label select radio-group tabs separator` in `app/web` to install all 6 components
2. Verify all components are generated in `app/web/src/components/ui/` and import correctly
3. Create `app/web/src/components/transaction-status.tsx` — a component that accepts `status: 'idle' | 'loading' | 'success' | 'error'`, `signature?: string`, `error?: string` and renders: loading spinner + "Confirming transaction..." for loading, green checkmark + truncated signature linking to `https://explorer.solana.com/tx/${signature}?cluster=devnet` for success, red X + error message for error
4. Use shadcn Badge for status display and existing Button for the Explorer link
5. Export the component and its props type
6. Run `bun run build` and `bun run typecheck` to verify clean compilation

## Must-Haves

- [ ] All 6 shadcn components install and compile
- [ ] TransactionStatus component renders loading, success (with Explorer link), and error states
- [ ] `bun run build` passes clean

## Verification

- `cd app/web && bun run build` exits 0
- `cd app/web && bun run typecheck` exits 0
- `ls app/web/src/components/ui/{input,label,select,radio-group,tabs,separator}.tsx` — all 6 exist

## Inputs

- `app/web/components.json` — shadcn configuration for component generation
- `app/web/src/components/ui/badge.tsx` — existing Badge component pattern to follow
- `app/web/src/components/ui/button.tsx` — existing Button for Explorer link

## Expected Output

- `app/web/src/components/ui/input.tsx` — shadcn Input component
- `app/web/src/components/ui/label.tsx` — shadcn Label component
- `app/web/src/components/ui/select.tsx` — shadcn Select component
- `app/web/src/components/ui/radio-group.tsx` — shadcn RadioGroup component
- `app/web/src/components/ui/tabs.tsx` — shadcn Tabs component
- `app/web/src/components/ui/separator.tsx` — shadcn Separator component
- `app/web/src/components/transaction-status.tsx` — reusable transaction status display

## Observability Impact

- **New signal:** TransactionStatus component renders `role="status"` with `aria-live="polite"` so screen readers and automated tests can observe transaction state changes.
- **Inspection surface:** Success state links directly to Solana Explorer (`explorer.solana.com/tx/{sig}?cluster=devnet`) for on-chain verification.
- **Failure visibility:** Error state renders the Anchor error message in the UI; upstream callers should `console.error` the full error object before passing the message string to this component.
- **Agent inspection:** The `data-slot="badge"` attribute on Badge variants allows programmatic querying of status (e.g., `[data-slot="badge"]` with text "Confirmed" or "Failed").
