# S04: Milestones — Live Reads — UAT

**Written:** 2026-03-20
**Slice:** S04
**Milestone:** M001
**Non-blocking:** Run this whenever convenient. Report failures as issues.

---

## What You're Testing

The Milestones page now fetches real `ConditionAccount` data from Solana devnet, joined to parent payment agreements. Four UI states should work correctly.

## Setup

```bash
cd app/web
bun run dev
# Open http://localhost:3000/milestones
# Have Phantom/Solflare installed and configured for devnet
```

## Test Steps

### 1. Disconnected state

- [ ] Open http://localhost:3000/milestones with wallet disconnected
- [ ] Page shows "Connect your wallet to view milestone schedules." prompt
- [ ] No table, no errors

### 2. Connected — empty state (if no conditionAccounts on devnet)

- [ ] Connect wallet
- [ ] If no conditionAccount accounts exist: page shows "No milestones found. Create a milestone-based payment agreement to get started."
- [ ] Table headers are visible

### 3. Connected — populated state (if conditionAccounts exist)

- [ ] Connect wallet
- [ ] Milestones table appears with columns: Milestone, Agreement, Amount, Status, Conditions, Operator, Finalized
- [ ] Milestone column shows "#N" index (1-based)
- [ ] Agreement column shows payment ID number (e.g. "#1") or truncated pubkey (e.g. "9xKj…mR4P")
- [ ] Amount column shows USDC-formatted value (e.g. "$1,000.00")
- [ ] Status column shows a Badge: Pending (outline), Active (green/default), Released (grey/secondary)
- [ ] Conditions column shows a count number
- [ ] Operator column shows "and" or "or" (lowercase)
- [ ] Finalized column shows "Yes" or "No"

### 4. Loading state

- [ ] On slow connections or first load, skeleton rows appear before data loads
- [ ] Skeletons disappear and are replaced by real data (or empty state)

### 5. Build verification

```bash
cd app/web && bun run build
```
- [ ] Build exits with no errors

## What a Failure Looks Like

| Symptom | Likely Cause |
|---------|--------------|
| Page shows nothing / blank after connecting | useMilestones() query not enabled |
| TypeScript build error mentioning `conditionOperator` | Field name regression — must be `operator` |
| Mock data IDs (M-01, M-02, PAY-4021) visible | Rewrite incomplete |
| Amount shows very large number | Missing `/1e6` USDC conversion |
| Status badge missing / shows raw key | MILESTONE_STATUS_CONFIG missing entry |

## Report Failures

If any test fails, note the symptom and which step number failed. A fix task will be created in the current slice or a new fix slice.
