# S02: README Custody Section + EC2 Deploy — UAT

## Preconditions

- Internet access to reach gherkinpay.lacertalabs.xyz
- SSH access to EC2 via `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147`
- A copy of the project repository (for README checks)
- A browser with Phantom or Solflare wallet extension installed (for visual MPC badge verification)

---

## Test Case 1: README Contains Custody Integration Section

**Goal:** Verify the README documents MPC custody provider compatibility.

1. Open `README.md` in the repository root.
2. Scroll to find the `### Custody Integration` heading.
   - **Expected:** Heading exists between the Compliance Stack section and the `## Tech Stack` section.
3. Read the section content.
   - **Expected:** Explains that GherkinPay uses standard Ed25519 signers, so any MPC wallet works as payer/payee/authority.
   - **Expected:** Mentions that funds are held in PDAs, not user wallets.
   - **Expected:** Lists Fireblocks, Fordefi, and Anchorage Digital as example custody providers.
4. Run: `grep -c "### Custody Integration" README.md`
   - **Expected:** Output is `1`.
5. Run: `grep -c "Fireblocks\|Fordefi\|Anchorage" README.md`
   - **Expected:** Output is ≥ 1.

---

## Test Case 2: Live App Returns HTTP 200

**Goal:** Verify the EC2 deployment is healthy and serving traffic.

1. Run: `curl -s -o /dev/null -w "%{http_code}" https://gherkinpay.lacertalabs.xyz`
   - **Expected:** Output is `200`.
2. Run: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "sudo systemctl is-active gherkinpay-web"`
   - **Expected:** Output is `active`.
3. Run: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "journalctl -u gherkinpay-web -n 5 --no-pager -p err -q"`
   - **Expected:** Empty output (no recent error-level logs).

---

## Test Case 3: MPC Badges Visible on Agreement Detail Page (Live URL)

**Goal:** Verify M007 S01's MPC badge components are deployed and rendering.

1. Open `https://gherkinpay.lacertalabs.xyz` in a browser with a Solana wallet extension.
2. Connect your wallet (Phantom or Solflare).
3. Navigate to the Agreements page via the sidebar.
4. Click on any agreement to open the detail page.
   - **Expected:** The agreement detail page loads with payer, payee, and authority addresses visible.
5. Look at each wallet address (payer, payee, authority).
   - **Expected:** Each address is followed by a small green "MPC Compatible" badge with a shield icon.
6. Hover over any "MPC Compatible" badge.
   - **Expected:** A tooltip appears explaining that GherkinPay works with institutional custody providers like Fireblocks and Fordefi because it uses standard Solana signers.

---

## Test Case 4: MPC Badge Components in Deployed Build (Automated Fallback)

**Goal:** Verify MPC badge code is present in the deployed build when wallet-based visual verification isn't possible.

1. Run: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "grep -c 'MPC Compatible' /opt/gherkinpay/app/web/.next/server/app/\(console\)/agreements/\[id\]/page.js"`
   - **Expected:** Output is ≥ 1 (badge text in server-rendered bundle).
2. Run: `ssh -i ~/.ssh/gherkinpay-eic ubuntu@3.8.170.147 "grep -c 'Fireblocks' /opt/gherkinpay/app/web/.next/server/app/\(console\)/agreements/\[id\]/page.js"`
   - **Expected:** Output is ≥ 1 (tooltip content in server bundle).

---

## Edge Cases

### E1: Agreement Detail Without Wallet Connected
1. Open `https://gherkinpay.lacertalabs.xyz/agreements/some-id` without connecting a wallet.
   - **Expected:** Page shows "Connect your wallet to view agreement details" message. No crash or blank page.

### E2: README Section Ordering
1. Run: `grep -n "Compliance Stack\|Custody Integration\|## Tech Stack" README.md`
   - **Expected:** Custody Integration line number is between Compliance Stack and Tech Stack line numbers, confirming correct placement.
