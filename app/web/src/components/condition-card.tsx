"use client";

import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { TransactionStatus } from "~/components/transaction-status";
import { cn } from "~/lib/utils";
import { useCrankTime } from "~/lib/mutations/crank-time";
import { usePostAndCrankOracle } from "~/lib/mutations/post-and-crank-oracle";
import { useCrankTokenGate } from "~/lib/mutations/crank-token-gate";
import { useSignMultisig } from "~/lib/mutations/sign-multisig";
import { useConfirmWebhook } from "~/lib/mutations/confirm-webhook";
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
          <dd className="space-y-1">
            <Badge variant="destructive" className="text-xs">
              ⚠ Stale (&gt;60s)
            </Badge>
            <p className="text-xs text-muted-foreground">
              FX market may be closed — prices update during trading hours only.
            </p>
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

/* ── oracle price hook (Hermes pull-model) ── */

const HERMES_URL = "https://hermes.pyth.network";

function useOraclePrice(
  feedAccount: string | null,
  skip: boolean,
) {
  const [price, setPrice] = useState<string | null>(null);
  const [stale, setStale] = useState<boolean | null>(null);

  useEffect(() => {
    if (!feedAccount || skip) return;
    let cancelled = false;

    const fetchPrice = async () => {
      try {
        // Convert base58 feedAccount pubkey bytes → hex feed ID
        const feedIdHex = Buffer.from(
          new PublicKey(feedAccount).toBytes(),
        ).toString("hex");

        const { HermesClient } = await import("@pythnetwork/hermes-client");
        const hermes = new HermesClient(HERMES_URL, {});
        const result = await hermes.getLatestPriceUpdates([
          "0x" + feedIdHex,
        ]);

        if (cancelled) return;
        const parsed = result.parsed?.[0];
        if (!parsed) return;

        const scaledPrice =
          Number(parsed.price.price) * Math.pow(10, parsed.price.expo);
        setPrice(
          scaledPrice.toLocaleString(undefined, {
            maximumFractionDigits: 6,
          }),
        );

        // Stale if publish_time is more than 60s ago
        const age = Math.floor(Date.now() / 1000) - parsed.price.publish_time;
        setStale(age > 60);
      } catch {
        // Informational only — price display is best-effort
      }
    };

    void fetchPrice();
    return () => {
      cancelled = true;
    };
  }, [feedAccount, skip]);

  return { price, stale };
}

/* ── multisig approval sub-component ──── */

function MultisigAction({
  data,
  index,
  paymentKey,
  conditionKey,
}: {
  data: MultisigData;
  index: number;
  paymentKey: PublicKey;
  conditionKey: PublicKey;
}) {
  const { publicKey: walletPubkey } = useWallet();
  const signMultisig = useSignMultisig();

  // Find connected wallet in the signer list using PublicKey.equals()
  const signerIndex = useMemo(() => {
    if (!walletPubkey) return -1;
    return data.signers.findIndex((s) =>
      new PublicKey(s).equals(walletPubkey),
    );
  }, [data.signers, walletPubkey]);

  const alreadyApproved = signerIndex >= 0 && data.approvals[signerIndex];

  const txStatus =
    signMultisig.status === "pending"
      ? ("pending" as const)
      : signMultisig.status === "success"
        ? ("success" as const)
        : signMultisig.status === "error"
          ? ("error" as const)
          : ("idle" as const);

  const txSignature =
    typeof signMultisig.data === "string" ? signMultisig.data : undefined;
  const txError = signMultisig.error
    ? decodeAnchorError(signMultisig.error)
    : undefined;

  return (
    <div className="space-y-2">
      {/* Per-signer approval list */}
      <ul className="space-y-1">
        {data.signers.map((signer, i) => (
          <li key={signer} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                data.approvals[i]
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {data.approvals[i] ? "✓" : "○"}
            </span>
            <span className="font-mono">{truncate(signer)}</span>
            {walletPubkey &&
              new PublicKey(signer).equals(walletPubkey) && (
                <Badge variant="outline" className="text-[10px] px-1 py-0">
                  you
                </Badge>
              )}
          </li>
        ))}
      </ul>

      {/* Action area */}
      {!walletPubkey ? (
        <span className="text-xs text-muted-foreground">
          Connect wallet to approve
        </span>
      ) : signerIndex === -1 ? (
        <span className="text-xs text-muted-foreground">
          Not a signer for this condition
        </span>
      ) : alreadyApproved ? (
        <span className="text-xs text-green-700 dark:text-green-400">
          You already approved ✓
        </span>
      ) : (
        <Button
          size="sm"
          onClick={() =>
            signMultisig.mutate({
              paymentPubkey: paymentKey,
              conditionAccountPubkey: conditionKey,
              conditionIndex: index,
            })
          }
          disabled={signMultisig.isPending}
        >
          Approve
        </Button>
      )}

      <TransactionStatus
        status={txStatus}
        signature={txSignature}
        error={txError}
      />
    </div>
  );
}

/* ── webhook confirm sub-component ────── */

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;

function WebhookAction({
  data,
  index,
  paymentKey,
  conditionKey,
}: {
  data: WebhookData;
  index: number;
  paymentKey: PublicKey;
  conditionKey: PublicKey;
}) {
  const { publicKey: walletPubkey } = useWallet();
  const confirmWebhook = useConfirmWebhook();
  const [hexValue, setHexValue] = useState("");

  const isRelayer = useMemo(() => {
    if (!walletPubkey) return false;
    return new PublicKey(data.relayer).equals(walletPubkey);
  }, [data.relayer, walletPubkey]);

  const isValidHex = HEX_64_REGEX.test(hexValue);

  const handleConfirm = () => {
    const eventHash = Array.from(Buffer.from(hexValue, "hex"));
    confirmWebhook.mutate({
      paymentPubkey: paymentKey,
      conditionAccountPubkey: conditionKey,
      conditionIndex: index,
      eventHash,
    });
  };

  const txStatus =
    confirmWebhook.status === "pending"
      ? ("pending" as const)
      : confirmWebhook.status === "success"
        ? ("success" as const)
        : confirmWebhook.status === "error"
          ? ("error" as const)
          : ("idle" as const);

  const txSignature =
    typeof confirmWebhook.data === "string" ? confirmWebhook.data : undefined;
  const txError = confirmWebhook.error
    ? decodeAnchorError(confirmWebhook.error)
    : undefined;

  return (
    <div className="space-y-2">
      {!walletPubkey ? (
        <span className="text-xs text-muted-foreground">
          Connect wallet to confirm
        </span>
      ) : !isRelayer ? (
        <span className="text-xs text-muted-foreground">
          Only the registered relayer can confirm
        </span>
      ) : (
        <div className="flex gap-2">
          <Input
            value={hexValue}
            onChange={(e) => setHexValue(e.target.value.trim())}
            placeholder="64-character hex event hash"
            className="font-mono text-xs h-8"
          />
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!isValidHex || confirmWebhook.isPending}
          >
            Confirm
          </Button>
        </div>
      )}

      <TransactionStatus
        status={txStatus}
        signature={txSignature}
        error={txError}
      />
    </div>
  );
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
  const postAndCrankOracle = usePostAndCrankOracle();
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
        ? postAndCrankOracle
        : condition.type === "tokenGated"
          ? crankTokenGate
          : undefined;

  const txStatus =
    activeMutation?.status === "pending"
      ? ("pending" as const)
      : activeMutation?.status === "success"
        ? ("success" as const)
        : activeMutation?.status === "error"
          ? ("error" as const)
          : ("idle" as const);

  const txSignature =
    typeof activeMutation?.data === "string" ? activeMutation.data : undefined;
  const txError = activeMutation?.error
    ? decodeAnchorError(activeMutation.error)
    : undefined;

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
                postAndCrankOracle.mutate({
                  paymentPubkey: paymentKey,
                  conditionAccountPubkey: conditionKey,
                  conditionIndex: index,
                  feedAccount: new PublicKey(data.feedAccount),
                })
              }
              disabled={postAndCrankOracle.isPending}
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

      {/* Multisig: interactive approval UI */}
      {condition.type === "multisig" && (
        <MultisigAction
          data={condition.data as MultisigData}
          index={index}
          paymentKey={paymentKey}
          conditionKey={conditionKey}
        />
      )}

      {/* Webhook: interactive confirm UI */}
      {condition.type === "webhook" && (
        <WebhookAction
          data={condition.data as WebhookData}
          index={index}
          paymentKey={paymentKey}
          conditionKey={conditionKey}
        />
      )}

      {/* TransactionStatus for permissionless cranks (multisig & webhook have their own) */}
      {condition.type !== "multisig" && condition.type !== "webhook" && (
        <TransactionStatus
          status={txStatus}
          signature={txSignature}
          error={txError}
        />
      )}
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
