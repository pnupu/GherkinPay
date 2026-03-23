# S03: Crank Automation Bot — Research

**Date:** 2026-03-23
**Depth:** Targeted

Standalone TypeScript crank bot using existing Anchor Program + IDL pattern. Three crank instructions already exist on-chain. Bot polls ConditionAccounts, evaluates locally, sends crank txs. Time-based cranking is the proof case. Two tasks: T01 core bot with time cranking, T02 oracle+token-gate+docs.