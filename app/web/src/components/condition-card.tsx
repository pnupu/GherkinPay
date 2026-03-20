"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { TransactionStatus } from "~/components/transaction-status";
import { cn } from "~/lib/utils";
import { useAnchorProgram } from "~/lib/anchor";
import { useCrankTime } from "~/lib/mutations/crank-time";
import { useCrankOracle, parsePythPrice, isPriceStale } from "~/lib/mutations/crank-oracle";
import { useCrankTokenGate } from "~/lib/mutations/crank-token-gate";
import { decodeAnchorError } from "~/lib/errors";
import type {
  ParsedCondition,
  TimeBasedData,
  OracleData,
  TokenGatedData,
  MultisigData,
  WebhookData,
} from "~/lib/queries/conditions";

/* ── helpers ──────────────────────────── */

function truncate(pubkey: string): string {
  if (pubkey.length <= 8) return pubkey;
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

function formatDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeTimeLabel(unixSeconds: number): string {
  const now = Date.now() / 1000;
  const diff = unixSeconds - now;
  if (diff <= 0) return "past";
  const days = Math.ceil(diff / 86400);
  if (days === 1) return "in 1 day";
  if (days < 30) return `in ${days} days`;
  const months = Math.round(days / 30);
  return `in ${months} month${months > 1 ? "s" : ""}`;
}

const TYPE_LABELS: Record<string, string> = {
  timeBased: "Time Lock",
  oracle: "Oracle",
  tokenGated: "Token Gate",
  multisig: "Multisig",
  webhook: "Webhook",
};

const TYPE_COLORS: Record<string, string> = {
  timeBased: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  oracle: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  tokenGated: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  multisig: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  webhook: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
};

/* ── type-specific renderers ──────────── */

function TimeBasedMeta({ data }: { data: TimeBasedData }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Unlock at</dt>
      <dd className="font-mono text-xs">{formatDate(data.unlockAt)}</dd>
      <dt className="text-muted-foreground">Status</dt>
      <dd>{relativeTimeLabel(data.unlockAt)}</dd>
    </dl>
  );
}

function OracleMeta({
  data,
  stale,
  currentPrice,
}: {
  data: OracleData;
  stale: boolean | null;
  currentPrice: string | null;
}) {
  const scaledTarget = data.targetValue / Math.pow(10, data.decimals);
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Feed</dt>
      <dd className="font-mono text-xs">{truncate(data.feedAccount)}</dd>
      <dt className="text-muted-foreground">Condition</dt>
      <dd>
        price {data.operator} {scaledTarget.toLocaleString()}
      </dd>
      {currentPrice && (
        <>
          <dt className="text-muted-foreground">Current Price</dt>
          <dd className="font-mono text-xs">{currentPrice}</dd>
        </>
      )}
      {stale === true && (
        <>
          <dt className="text-muted-foreground">Staleness</dt>
          <dd>
            <Badge variant="destructive" className="text-xs">
              ⚠ Stale (&gt;60s)
            </Badge>
          </dd>
        </>
      )}
    </dl>
  );
}

function TokenGatedMeta({ data }: { data: TokenGatedData }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Required Mint</dt>
      <dd className="font-mono text-xs">{truncate(data.requiredMint)}</dd>
      <dt className="text-muted-foreground">Min Amount</dt>
      <dd>{(data.minAmount / 1e6).toLocaleString()}</dd>
      <dt className="text-muted-foreground">Holder</dt>
      <dd className="font-mono text-xs">{truncate(data.holder)}</dd>
    </dl>
  );
}

function MultisigMeta({ data }: { data: MultisigData }) {
  const approvedCount = data.approvals.filter(Boolean).length;
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Signers</dt>
      <dd>{data.signers.length}</dd>
      <dt className="text-muted-foreground">Threshold</dt>
      <dd>{data.threshold}</dd>
      <dt className="text-muted-foreground">Progress</dt>
      <dd>
        {approvedCount} of {data.threshold} signed
      </dd>
    </dl>
  );
}

function WebhookMeta({ data }: { data: WebhookData }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Relayer</dt>
      <dd className="font-mono text-xs">{truncate(data.relayer)}</dd>
      <dt className="text-muted-foreground">Event Hash</dt>
      <dd className="font-mono text-xs">{data.eventHash.slice(0, 16)}…</dd>
    </dl>
  );
}

/* ── oracle price hook ────────────────── */

function useOraclePrice(
  feedAccount: string | null,
  skip: boolean,
) {
  const { connection } = useAnchorProgram();
  const [price, setPrice] = useState<string | null>(null);
  const [stale, setStale] = useState<boolean | null>(null);

  useEffect(() => {
    if (!feedAccount || skip) return;
    let cancelled = false;

    const fetchPrice = async () => {
      try {
        const info = await connection.getAccountInfo(
          new PublicKey(feedAccount),
        );
        if (cancelled || !info?.data) return;
        const parsed = parsePythPrice(Buffer.from(info.data));
        if (!parsed) return;

        const scaledPrice =
          Number(parsed.price) * Math.pow(10, parsed.exponent);
        setPrice(
          scaledPrice.toLocaleString(undefined, {
            maximumFractionDigits: 4,
          }),
        );
        setStale(isPriceStale(parsed.publishTime));
      } catch {
        // Informational only
      }
    };

    void fetchPrice();
    return () => {
      cancelled = true;
    };
  }, [feedAccount, skip, connection]);

  return { price, stale };
}

/* ── crank action area ────────────────── */

function CrankAction({
  condition,
  index,
  paymentPubkey,
  conditionAccountPubkey,
}: {
  condition: ParsedCondition;
  index: number;
  paymentPubkey: string;
  conditionAccountPubkey: string;
}) {
  const crankTime = useCrankTime();
  const crankOracle = useCrankOracle();
  const crankTokenGate = useCrankTokenGate();

  const paymentKey = useMemo(
    () => new PublicKey(paymentPubkey),
    [paymentPubkey],
  );
  const conditionKey = useMemo(
    () => new PublicKey(conditionAccountPubkey),
    [conditionAccountPubkey],
  );

  // Determine which mutation is active for TransactionStatus
  const activeMutation =
    condition.type === "timeBased"
      ? crankTime
      : condition.type === "oracle"
        ? crankOracle
        : condition.type === "tokenGated"
          ? crankTokenGate
          : null;

  const txStatus =
    activeMutation?.status === "pending"
      ? ("pending" as const)
      : activeMutation?.status === "success"
        ? ("success" as const)
        : activeMutation?.status === "error"
          ? ("error" as const)
          : ("idle" as const);

  const txSignature =
    typeof activeMutation?.data === "string" ? activeMutation.data : null;
  const txError = activeMutation?.error
    ? decodeAnchorError(activeMutation.error)
    : null;

  // Already met — show badge, no action button
  if (condition.met) {
    return (
      <Badge
        variant="default"
        className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      >
        ✓ Condition Met
      </Badge>
    );
  }

  return (
    <div data-testid={`crank-action-${index}`}>
      {condition.type === "timeBased" &&
        (() => {
          const data = condition.data as TimeBasedData;
          const canCrank = data.unlockAt < Date.now() / 1000;
          return canCrank ? (
            <Button
              size="sm"
              onClick={() =>
                crankTime.mutate({
                  paymentPubkey: paymentKey,
                  conditionAccountPubkey: conditionKey,
                  conditionIndex: index,
                })
              }
              disabled={crankTime.isPending}
            >
              Crank Time
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Unlocks {relativeTimeLabel(data.unlockAt)}
            </span>
          );
        })()}

      {condition.type === "oracle" &&
        (() => {
          const data = condition.data as OracleData;
          return (
            <Button
              size="sm"
              onClick={() =>
                crankOracle.mutate({
                  paymentPubkey: paymentKey,
                  conditionAccountPubkey: conditionKey,
                  conditionIndex: index,
                  priceFeedPubkey: new PublicKey(data.feedAccount),
                })
              }
              disabled={crankOracle.isPending}
            >
              Crank Oracle
            </Button>
          );
        })()}

      {condition.type === "tokenGated" &&
        (() => {
          const data = condition.data as TokenGatedData;
          return (
            <Button
              size="sm"
              onClick={() =>
                crankTokenGate.mutate({
                  paymentPubkey: paymentKey,
                  conditionAccountPubkey: conditionKey,
                  conditionIndex: index,
                  holder: new PublicKey(data.holder),
                  requiredMint: new PublicKey(data.requiredMint),
                })
              }
              disabled={crankTokenGate.isPending}
            >
              Crank Token Gate
            </Button>
          );
        })()}

      {/* Multisig and Webhook don't have permissionless cranks */}
      {(condition.type === "multisig" || condition.type === "webhook") && (
        <span className="text-xs text-muted-foreground">
          {condition.type === "multisig"
            ? "Requires signer approvals"
            : "Awaiting webhook relay"}
        </span>
      )}

      <TransactionStatus
        status={txStatus}
        signature={txSignature}
        error={txError}
      />
    </div>
  );
}

/* ── main component ───────────────────── */

interface ConditionCardProps {
  condition: ParsedCondition;
  index: number;
  paymentPubkey: string;
  conditionAccountPubkey: string;
}

export function ConditionCard({
  condition,
  index,
  paymentPubkey,
  conditionAccountPubkey,
}: ConditionCardProps) {
  const typeLabel = TYPE_LABELS[condition.type] ?? condition.type;
  const typeColor = TYPE_COLORS[condition.type] ?? "";

  // Oracle-specific live data for metadata display
  const oracleFeed =
    condition.type === "oracle"
      ? (condition.data as OracleData).feedAccount
      : null;
  const { price: oraclePrice, stale: oracleStale } = useOraclePrice(
    oracleFeed,
    condition.met,
  );

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Condition #{index + 1}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs", typeColor)}>
            {typeLabel}
          </Badge>
          <Badge
            variant={condition.met ? "default" : "secondary"}
            className={cn(
              "text-xs",
              condition.met
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
            )}
          >
            {condition.met ? "Met" : "Pending"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {condition.type === "timeBased" && (
          <TimeBasedMeta data={condition.data as TimeBasedData} />
        )}
        {condition.type === "oracle" && (
          <OracleMeta
            data={condition.data as OracleData}
            stale={oracleStale}
            currentPrice={oraclePrice}
          />
        )}
        {condition.type === "tokenGated" && (
          <TokenGatedMeta data={condition.data as TokenGatedData} />
        )}
        {condition.type === "multisig" && (
          <MultisigMeta data={condition.data as MultisigData} />
        )}
        {condition.type === "webhook" && (
          <WebhookMeta data={condition.data as WebhookData} />
        )}

        {/* Crank action area */}
        <div className="mt-4">
          <CrankAction
            condition={condition}
            index={index}
            paymentPubkey={paymentPubkey}
            conditionAccountPubkey={conditionAccountPubkey}
          />
        </div>
      </CardContent>
    </Card>
  );
}
