"use client";

import { type PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useComplianceEntries } from "~/lib/queries/compliance";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";

function truncatePubkey(pubkey: PublicKey): string {
  const str = pubkey.toBase58();
  return `${str.slice(0, 4)}…${str.slice(-4)}`;
}

const TABLE_HEADS = ["Account", "Status"] as const;

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {TABLE_HEADS.map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function CompliancePage() {
  const { connected } = useWallet();
  const { data, isLoading, isError, error } = useComplianceEntries();

  return (
    <>
      <header className="topbar">
        <div>
          <h1 className="page-title">Compliance</h1>
          <p className="page-subtitle">
            Token-2022 transfer hook allowlist status
          </p>
        </div>
      </header>

      <section className="panel">
        <div className="panel-title-row">
          <h2 className="panel-title">Wallet policy entries</h2>
        </div>

        {!connected ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-muted-foreground">
            <p className="text-sm">
              Connect your wallet to view compliance entries.
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-destructive">
            <p className="text-sm">
              Failed to load compliance entries
              {error instanceof Error ? `: ${error.message}` : "."}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  {TABLE_HEADS.map((h) => (
                    <TableHead key={h}>{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <SkeletonRows />
                ) : data && data.length > 0 ? (
                  data.map(({ publicKey: accountKey, account }) => (
                    <TableRow key={accountKey.toBase58()}>
                      <TableCell className="font-mono text-xs">
                        {truncatePubkey(accountKey)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            account.isAllowed ? "default" : "destructive"
                          }
                        >
                          {account.isAllowed ? "Allowed" : "Blocked"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={TABLE_HEADS.length}
                      className="py-12 text-center text-muted-foreground"
                    >
                      No compliance entries found. Entries appear when wallets
                      are added to the transfer hook allowlist.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </>
  );
}
