#!/usr/bin/env bash
set -euo pipefail

# S03 Verification Script — Devnet Deploy & Smoke Test
# Checks all slice success criteria in sequence.

PROGRAM_ID="2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

check() {
  local label="$1"
  shift
  echo -n "[$label] ... "
  if "$@" > /dev/null 2>&1; then
    echo "PASS ✅"
    PASS=$((PASS + 1))
  else
    echo "FAIL ❌"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== S03 Verification: Devnet Deploy & Smoke Test ==="
echo ""

# 1. Program deployed to devnet
check "Program deployed" \
  solana program show "$PROGRAM_ID" --url devnet

# 2. Program data inspectable (Data Length visible)
check "Program data inspectable" \
  bash -c "solana program show $PROGRAM_ID --url devnet 2>&1 | grep -q 'Data Length'"

# 3. Types synced (diff is empty)
check "Types synced" \
  diff "$REPO_ROOT/target/types/gherkin_pay.ts" "$REPO_ROOT/app/web/src/types/gherkin_pay.ts"

# 4. metadataUri count = 4
check "metadataUri count = 4" \
  bash -c "test \$(grep -c metadataUri '$REPO_ROOT/app/web/src/types/gherkin_pay.ts') -eq 4"

# 5. Frontend builds clean
check "Frontend build" \
  bash -c "cd '$REPO_ROOT/app/web' && bun run build"

# 6. Crank bot connects and polls
# Use perl alarm as portable timeout on macOS
check "Crank bot dry-run" \
  bash -c "perl -e 'alarm 15; exec @ARGV' -- bun run '$REPO_ROOT/scripts/crank-bot.ts' --dry-run 2>&1 | grep -qi 'poll\|scan\|account\|connect\|program\|condition'"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
