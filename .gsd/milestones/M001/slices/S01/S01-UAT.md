# S01: shadcn Setup and Design System — UAT

**Written:** 2026-03-19
**Slice:** S01
**Milestone:** M001
**Non-blocking:** Run this whenever convenient. Report failures as issues.

---

## What You're Testing

shadcn/ui is installed and themed into the GherkinPay frontend. The dark green design should look identical to before, with shadcn components rendering correctly alongside the existing hand-rolled CSS.

## Setup

```bash
cd app/web
bun run dev
# Open http://localhost:3000/agreements
```

## Test Steps

### 1. Existing design is intact

- [ ] Open http://localhost:3000 — landing page loads with dark green background and ambient glow blobs
- [ ] Open http://localhost:3000/agreements — console layout appears: dark sidebar on left, content area on right
- [ ] Navigation links (Agreements, Milestones, Compliance, Relayers, Activity) are visible in the sidebar and styled correctly (muted text, hover highlight)
- [ ] Page title "Agreements" and subtitle "Condition engine settlement workspace" appear in the content header
- [ ] The mock agreement table renders with correct borders, hover states, and text colours

### 2. shadcn Button is present and themed

- [ ] In the sidebar, a "Connect Wallet" button is visible at the bottom
- [ ] The button has the dark green outline style (not the browser default grey button)
- [ ] Hovering the button changes its appearance slightly (border or background shift)

### 3. Build passes

```bash
cd app/web && bun run build
```
- [ ] Build exits with no errors (exit code 0)
- [ ] No TypeScript errors reported
- [ ] No CSS parse errors in the build output

## What a Failure Looks Like

| Symptom | Likely Cause |
|---------|--------------|
| Borders missing on panels/tables | `--gp-border` rename missed a reference |
| Sidebar background wrong colour | `--gp-sidebar` rename missed a reference |
| "Connect Wallet" button unstyled | shadcn CSS variable block not loading |
| Build error mentioning `@/lib/utils` | shadcn component import alias wrong |
| Build error mentioning unknown CSS property | `tw-animate-css` not installed |

## Report Failures

If any test fails, note the symptom and which step number failed. A fix slice will be created.
