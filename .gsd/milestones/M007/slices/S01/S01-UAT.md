# S01: MPC Badge + Agreement Detail Integration — UAT

## Preconditions

- `cd app/web && bun run dev` running on localhost:3000
- Phantom or Solflare wallet connected to devnet
- At least one payment agreement exists on devnet (navigate to `/agreements` to verify)

---

## Test Cases

### TC1: MPC Badge Visibility on Agreement Detail Page

**Steps:**
1. Navigate to `/agreements` in the browser
2. Click any agreement row to open the detail page (`/agreements/<id>`)
3. Locate the Payer address field in the details grid

**Expected:**
- A small emerald-colored "MPC Compatible" badge with a shield icon appears inline next to the payer wallet address
- The same badge appears next to the Payee address
- The same badge appears next to the Authority address
- All three badges are visually identical (emerald outline, ShieldCheck icon, "MPC Compatible" text)

### TC2: Tooltip Content on Hover

**Steps:**
1. On the agreement detail page, hover over any "MPC Compatible" badge

**Expected:**
- A tooltip appears after a brief delay
- Tooltip text mentions MPC custody providers (Fireblocks, Fordefi)
- Tooltip explains that standard Solana signers work without protocol changes
- Tooltip disappears when the mouse moves away from the badge

### TC3: Tooltip Works on All Three Badges

**Steps:**
1. Hover over the payer's MPC badge — verify tooltip appears
2. Move mouse away — verify tooltip disappears
3. Hover over the payee's MPC badge — verify tooltip appears
4. Move mouse away — verify tooltip disappears
5. Hover over the authority's MPC badge — verify tooltip appears

**Expected:**
- All three badges produce the same tooltip content
- No console errors in browser DevTools

### TC4: Badge Layout Alignment

**Steps:**
1. On the agreement detail page, inspect the visual alignment of badges relative to wallet addresses

**Expected:**
- Badges sit inline with the wallet address text, not on a separate line
- Badges are vertically centered with the address text
- The `<dl>` grid layout is not broken — all other fields (status, amount, token, etc.) render normally

### TC5: No Runtime Errors

**Steps:**
1. Open browser DevTools Console tab
2. Navigate to `/agreements/<id>`
3. Hover each MPC badge
4. Check console for errors

**Expected:**
- No React errors or warnings
- No "TooltipProvider must be used within a TooltipProvider" error
- No unhandled exceptions

### TC6: Badge on Agreement Without All Addresses

**Steps:**
1. If an agreement has the same wallet for payer and authority, navigate to its detail page

**Expected:**
- Both fields still show their own MPC badge independently
- Badges render correctly regardless of whether addresses are identical

---

## Edge Cases

### EC1: Rapid Hover Between Badges

**Steps:**
1. Quickly move the mouse between the three MPC badges

**Expected:**
- Previous tooltip dismisses before the new one appears
- No overlapping tooltip portals in the DOM
- No flicker or layout shift

### EC2: Page Refresh Persistence

**Steps:**
1. On an agreement detail page with visible badges, press F5 to refresh

**Expected:**
- Badges reappear after page reload without errors
- Tooltip functionality works immediately after reload

### EC3: Tooltips Work Alongside Existing UI

**Steps:**
1. Verify that other interactive elements on the agreement detail page (buttons, links, metadata URI link) still function normally
2. If other tooltips exist on the page, verify they also still work

**Expected:**
- MPC badge tooltips do not interfere with other page interactions
- TooltipProvider serves all tooltip instances app-wide
