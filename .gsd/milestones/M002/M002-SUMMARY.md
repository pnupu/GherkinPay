# M002: Core Flows — Summary

**Last updated:** 2026-03-20
**Slices:** 3 (S01, S02, S03)
**Status:** Planned

## Overview

M002 makes GherkinPay actionable — write transactions from the browser. Three slices cover the full payment lifecycle: create (S01), fund (S02), release & cancel (S03). The create payment wizard is the high-risk centerpiece; fund, release, and cancel are single-instruction operations.

## Slice Summary

- **S01: Create Payment Wizard** (4 tasks, risk:high) — Multi-step Dialog wizard for simple and milestone payments with all 5 condition types, AND/OR logic, sequential multi-instruction transaction submission
- **S02: Fund Payment** (2 tasks, risk:medium) — Fund button on Created payments, Token-2022 ATA lookup, USDC balance check
- **S03: Release and Cancel** (2 tasks, risk:low) — Release with nextConditionAccount logic + crankTime for testing, cancel with refund

## Key Decisions

- D009: Wizard as multi-step Dialog (not dedicated page)
- D010: Payment ID via Date.now() * 1000 + random suffix
- D011: Include minimal crankTime in release flow for M002 acceptance

## Requirement Coverage

R007 → S01, R008 → S02, R009 → S03, R010 → S03
