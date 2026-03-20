---
estimated_steps: 2
estimated_files: 1
---

# T02: Clean up relayers page — remove mock data, add static placeholder

**Slice:** S05 — Compliance and Relayers — Live Reads
**Milestone:** M001

## Description

Remove the hardcoded `relayers` mock array from the relayers page and replace it with a clean static placeholder using shadcn components. Real relayer registration is M003 scope — this page should show an informational empty state explaining that relayer management is coming in a future update.

## Steps

1. Rewrite `app/web/src/app/(console)/relayers/page.tsx`:
   - Remove the hardcoded `relayers` array
   - Keep the existing `<header className="topbar">` structure with title and subtitle
   - Replace the table with a shadcn-styled informational section inside a `<section className="panel">`:
     - Use a centered div with `text-muted-foreground` styling
     - Message: "Relayer registration and management will be available in a future update."
     - Optionally use shadcn `Card` or `Badge` for polish
   - No `"use client"` needed — this is a static page with no hooks

2. Verify build passes: `cd app/web && bun run build`

## Must-Haves

- [ ] Hardcoded `relayers` array is removed
- [ ] Page renders a clean static placeholder message
- [ ] No `@/` imports
- [ ] `bun run build` passes

## Verification

- `cd app/web && bun run build` exits 0
- `! grep -q "relayers =" app/web/src/app/\(console\)/relayers/page.tsx`
- `! grep -q "@/" app/web/src/app/\(console\)/relayers/page.tsx`

## Inputs

- `app/web/src/app/(console)/relayers/page.tsx` — existing page with hardcoded mock array to replace

## Expected Output

- `app/web/src/app/(console)/relayers/page.tsx` — rewritten with static placeholder, no mock data
