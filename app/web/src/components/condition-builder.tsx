"use client";
// React-hook-form discriminated-union field paths require `as never` casts — no typed alternative exists.

import { useCallback, useEffect, useRef } from "react";
import {
  useForm,
  useFieldArray,
  useWatch,
  Controller,
  type Control,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { PublicKey } from "@solana/web3.js";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";

import { PlusIcon, TrashIcon } from "lucide-react";

// ---------------------------------------------------------------------------
// Constants (matching on-chain limits from condition.rs)
// ---------------------------------------------------------------------------

export const MAX_CONDITIONS = 8;
export const MAX_SIGNERS = 5;

// ---------------------------------------------------------------------------
// Zod validation helpers
// ---------------------------------------------------------------------------

const publicKeyString = z
  .string()
  .min(1, "Required")
  .refine(
    (val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Invalid Solana address (base58)" }
  );

const positiveNumber = z
  .number({ invalid_type_error: "Must be a number" })
  .positive("Must be positive");

const hexHash32 = z
  .string()
  .min(1, "Required")
  .regex(/^[0-9a-fA-F]{64}$/, "Must be a 64-character hex string (32 bytes)");

// ---------------------------------------------------------------------------
// Condition sub-schemas
// ---------------------------------------------------------------------------

const timeBasedSchema = z.object({
  type: z.literal("timeBased"),
  unlockAt: z.string().min(1, "Required").refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getTime() > Date.now();
    },
    { message: "Must be a valid future date/time" }
  ),
});

// Note: threshold ≤ signers.length validated via superRefine on the full form
const multisigSchema = z.object({
  type: z.literal("multisig"),
  signers: z
    .array(z.object({ address: publicKeyString }))
    .min(1, "At least 1 signer required")
    .max(MAX_SIGNERS, `Max ${MAX_SIGNERS} signers`),
  threshold: z
    .number({ invalid_type_error: "Must be a number" })
    .int("Must be an integer")
    .min(1, "Min threshold is 1"),
});

const comparisonOperators = ["gt", "gte", "lt", "lte", "eq"] as const;

const oracleSchema = z.object({
  type: z.literal("oracle"),
  feedAccount: publicKeyString,
  operator: z.enum(comparisonOperators, {
    errorMap: () => ({ message: "Select an operator" }),
  }),
  targetValue: positiveNumber,
  decimals: z
    .number({ invalid_type_error: "Must be a number" })
    .int("Must be an integer")
    .min(0, "Min 0")
    .max(18, "Max 18"),
});

const webhookSchema = z.object({
  type: z.literal("webhook"),
  relayer: publicKeyString,
  eventHash: hexHash32,
});

const tokenGatedSchema = z.object({
  type: z.literal("tokenGated"),
  requiredMint: publicKeyString,
  minAmount: positiveNumber,
  holder: publicKeyString,
});

// ---------------------------------------------------------------------------
// Combined condition schema (discriminated union)
// ---------------------------------------------------------------------------

export const conditionSchema = z.discriminatedUnion("type", [
  timeBasedSchema,
  multisigSchema,
  oracleSchema,
  webhookSchema,
  tokenGatedSchema,
]);

export type ConditionFormValue = z.infer<typeof conditionSchema>;

// Full builder schema with cross-field validation for multisig threshold
export const conditionBuilderSchema = z
  .object({
    operator: z.enum(["and", "or"]),
    conditions: z
      .array(conditionSchema)
      .min(1, "At least one condition required")
      .max(MAX_CONDITIONS, `Max ${MAX_CONDITIONS} conditions`),
  })
  .superRefine((data, ctx) => {
    data.conditions.forEach((condition, index) => {
      if (
        condition.type === "multisig" &&
        condition.threshold > condition.signers.length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Threshold cannot exceed number of signers",
          path: ["conditions", index, "threshold"],
        });
      }
    });
  });

export type ConditionBuilderValue = z.infer<typeof conditionBuilderSchema>;

// ---------------------------------------------------------------------------
// Default values for each condition type
// ---------------------------------------------------------------------------

type ConditionType = ConditionFormValue["type"];

function defaultCondition(type: ConditionType = "timeBased"): ConditionFormValue {
  switch (type) {
    case "timeBased":
      return { type: "timeBased", unlockAt: "" };
    case "multisig":
      return { type: "multisig", signers: [{ address: "" }], threshold: 1 };
    case "oracle":
      return {
        type: "oracle",
        feedAccount: "",
        operator: "gt",
        targetValue: 0,
        decimals: 0,
      };
    case "webhook":
      return { type: "webhook", relayer: "", eventHash: "" };
    case "tokenGated":
      return { type: "tokenGated", requiredMint: "", minAmount: 0, holder: "" };
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ConditionBuilderProps {
  /** Current value — controlled component */
  value: ConditionBuilderValue;
  /** Called whenever the form data changes (may contain invalid fields) */
  onChange: (value: ConditionBuilderValue) => void;
  /** Called when validation state changes */
  onValidChange?: (valid: boolean) => void;
}

// ---------------------------------------------------------------------------
// Condition type labels
// ---------------------------------------------------------------------------

const CONDITION_TYPES: { value: ConditionType; label: string }[] = [
  { value: "timeBased", label: "Time-Based" },
  { value: "multisig", label: "Multi-Signature" },
  { value: "oracle", label: "Oracle Price Feed" },
  { value: "webhook", label: "Webhook Event" },
  { value: "tokenGated", label: "Token-Gated" },
];

const COMPARISON_OPTIONS: { value: string; label: string }[] = [
  { value: "gt", label: "> Greater than" },
  { value: "gte", label: "≥ Greater or equal" },
  { value: "lt", label: "< Less than" },
  { value: "lte", label: "≤ Less or equal" },
  { value: "eq", label: "= Equal" },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConditionBuilder({
  value,
  onChange,
  onValidChange,
}: ConditionBuilderProps) {
  const suppressSync = useRef(false);

  const form = useForm<ConditionBuilderValue>({
    resolver: zodResolver(conditionBuilderSchema),
    defaultValues: value,
    mode: "onChange",
  });

  const { control, formState, setValue, getValues, trigger } = form;
  const { errors } = formState;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "conditions",
  });

  // Expose form helpers for E2E testing (test wallet adapter must be active)
  useEffect(() => {
    if (typeof window !== "undefined" && window.__TEST_WALLET) {
      (window as unknown as Record<string, unknown>).__TEST_CONDITION_FORM = {
        setValue: (name: string, value: unknown) => {
          setValue(name as never, value as never, { shouldValidate: true });
        },
        trigger: (field?: string) => field ? trigger(field as never) : trigger(),
      };
      return () => {
        delete (window as unknown as Record<string, unknown>).__TEST_CONDITION_FORM;
      };
    }
  }, [setValue, trigger]);

  // Watch the whole form for changes and sync to parent
  const watched = useWatch({ control });

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (suppressSync.current) {
      suppressSync.current = false;
      return;
    }
    const current = JSON.stringify(watched);
    const prev = JSON.stringify(value);
    if (current !== prev) {
      onChangeRef.current(watched as ConditionBuilderValue);
    }
  }, [watched, value]);

  // Report validation state
  const onValidChangeRef = useRef(onValidChange);
  onValidChangeRef.current = onValidChange;
  useEffect(() => {
    onValidChangeRef.current?.(formState.isValid);
  }, [formState.isValid]);

  // Sync incoming value when parent changes it (e.g., reset)
  useEffect(() => {
    const current = JSON.stringify(getValues());
    const incoming = JSON.stringify(value);
    if (current !== incoming) {
      suppressSync.current = true;
      form.reset(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleAddCondition = useCallback(() => {
    if (fields.length < MAX_CONDITIONS) {
      append(defaultCondition("timeBased"));
    }
  }, [fields.length, append]);

  const handleConditionTypeChange = useCallback(
    (index: number, newType: ConditionType) => {
      setValue(`conditions.${index}`, defaultCondition(newType), {
        shouldValidate: true,
      });
    },
    [setValue]
  );

  return (
    <div className="space-y-4" data-testid="condition-builder">
      {/* AND / OR operator selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Condition Logic
        </Label>
        <Controller
          control={control}
          name="operator"
          render={({ field }) => (
            <RadioGroup
              value={field.value}
              onValueChange={(val) => field.onChange(val)}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="and" />
                <span className="text-sm">
                  AND{" "}
                  <span className="text-muted-foreground">— all must be met</span>
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="or" />
                <span className="text-sm">
                  OR{" "}
                  <span className="text-muted-foreground">— any one suffices</span>
                </span>
              </label>
            </RadioGroup>
          )}
        />
      </div>

      {/* Conditions list */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <ConditionRow
            key={field.id}
            index={index}
            control={control}
            errors={errors}
            onTypeChange={handleConditionTypeChange}
            onRemove={() => remove(index)}
            canRemove={fields.length > 1}
          />
        ))}
      </div>

      {/* Add Condition button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddCondition}
        disabled={fields.length >= MAX_CONDITIONS}
        className="w-full"
      >
        <PlusIcon className="size-4" />
        Add Condition
        {fields.length >= MAX_CONDITIONS && (
          <span className="text-muted-foreground ml-1">
            (max {MAX_CONDITIONS})
          </span>
        )}
      </Button>

      {/* Top-level array errors */}
      {errors.conditions?.root?.message && (
        <p className="text-sm text-destructive">
          {errors.conditions.root.message}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Condition Row — renders type selector + type-specific fields
// ---------------------------------------------------------------------------

interface ConditionRowProps {
  index: number;
  control: Control<ConditionBuilderValue>;
  errors: FieldErrors<ConditionBuilderValue>;
  onTypeChange: (index: number, type: ConditionType) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ConditionRow({
  index,
  control,
  errors,
  onTypeChange,
  onRemove,
  canRemove,
}: ConditionRowProps) {
  const conditionType = useWatch({
    control,
    name: `conditions.${index}.type`,
  });

  const conditionErrors = errors.conditions?.[index];

  return (
    <div
      className="rounded-lg border border-border bg-card/50 p-4 space-y-3"
      data-testid={`condition-row-${index}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">
            Condition {index + 1}
          </Label>
          <Controller
            control={control}
            name={`conditions.${index}.type`}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(val) =>
                  onTypeChange(index, val as unknown as ConditionType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_TYPES.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="mt-5 text-muted-foreground hover:text-destructive"
            aria-label={`Remove condition ${index + 1}`}
          >
            <TrashIcon className="size-4" />
          </Button>
        )}
      </div>

      {/* Type-specific fields */}
      {conditionType === "timeBased" && (
        <TimeBasedFields
          index={index}
          control={control}
          errors={conditionErrors as never}
        />
      )}
      {conditionType === "multisig" && (
        <MultisigFields
          index={index}
          control={control}
          errors={conditionErrors as never}
        />
      )}
      {conditionType === "oracle" && (
        <OracleFields
          index={index}
          control={control}
          errors={conditionErrors as never}
        />
      )}
      {conditionType === "webhook" && (
        <WebhookFields
          index={index}
          control={control}
          errors={conditionErrors as never}
        />
      )}
      {conditionType === "tokenGated" && (
        <TokenGatedFields
          index={index}
          control={control}
          errors={conditionErrors as never}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Type-specific field components
// ---------------------------------------------------------------------------

interface FieldProps {
  index: number;
  control: Control<ConditionBuilderValue>;
  errors: Record<string, { message?: string } | undefined> | undefined;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-0.5">{message}</p>;
}

/** Safely extract an error message from a nested RHF errors object. */
function getErrorMessage(
  errors: FieldProps["errors"],
  field: string
): string | undefined {
  if (!errors) return undefined;
  const entry = (errors as Record<string, { message?: string } | undefined>)[
    field
  ];
  return entry?.message;
}

// -- TimeBased --

function TimeBasedFields({ index, control, errors }: FieldProps) {
  return (
    <div className="space-y-1">
      <Label
        htmlFor={`condition-${index}-unlockAt`}
        className="text-xs text-muted-foreground"
      >
        Unlock Date/Time
      </Label>
      <Controller
        control={control}
        name={`conditions.${index}.unlockAt` as never}
        render={({ field }) => (
          <Input
            id={`condition-${index}-unlockAt`}
            type="datetime-local"
            value={(field.value as string) ?? ""}
            onChange={(e) => field.onChange(e.target.value)}
            onBlur={field.onBlur}
            ref={field.ref}
            className="w-full [color-scheme:dark]"
          />
        )}
      />
      <FieldError
        message={getErrorMessage(errors, "")}
      />
    </div>
  );
}

// -- Multisig --

function MultisigFields({ index, control, errors }: FieldProps) {
  const {
    fields: signerFields,
    append: appendSigner,
    remove: removeSigner,
  } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: control as Control<any>,
    name: `conditions.${index}.signers`,
  });

  return (
    <div className="space-y-3">
      {/* Signers */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">
          Signers ({signerFields.length}/{MAX_SIGNERS})
        </Label>
        {signerFields.map((signer, sIdx) => (
          <div key={signer.id} className="flex items-center gap-2">
            <Controller
              control={control}
              name={
                `conditions.${index}.signers.${sIdx}.address` as never
              }
              render={({ field }) => (
                <Input
                  placeholder="Signer wallet address (base58)"
                  className="flex-1 font-mono text-xs"
                  value={(field.value as string) ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                />
              )}
            />
            {signerFields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => removeSigner(sIdx)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove signer ${sIdx + 1}`}
              >
                <TrashIcon />
              </Button>
            )}
          </div>
        ))}
        {/* Signer errors */}
        {getErrorMessage(errors, 'signers') && (
          <FieldError
            message={getErrorMessage(errors, "signers")}
          />
        )}
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => appendSigner({ address: "" })}
          disabled={signerFields.length >= MAX_SIGNERS}
        >
          <PlusIcon className="size-3" />
          Add Signer
        </Button>
      </div>

      {/* Threshold */}
      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-threshold`}
          className="text-xs text-muted-foreground"
        >
          Threshold (approvals needed)
        </Label>
        <Controller
          control={control}
          name={`conditions.${index}.threshold` as never}
          render={({ field }) => (
            <Input
              id={`condition-${index}-threshold`}
              type="number"
              min={1}
              max={signerFields.length}
              value={field.value as number}
              onChange={(e) => field.onChange(Number(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
              className="w-24"
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>
    </div>
  );
}

// -- Oracle --

function OracleFields({ index, control, errors }: FieldProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-feedAccount`}
          className="text-xs text-muted-foreground"
        >
          Feed Account
        </Label>
        <Controller
          control={control}
          name={`conditions.${index}.feedAccount` as never}
          render={({ field }) => (
            <Input
              id={`condition-${index}-feedAccount`}
              placeholder="Oracle feed account address (base58)"
              className="font-mono text-xs"
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Operator</Label>
          <Controller
            control={control}
            name={`conditions.${index}.operator` as never}
            render={({ field }) => (
              <Select
                value={field.value as string}
                onValueChange={field.onChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPARISON_OPTIONS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {op.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError
            message={getErrorMessage(errors, "")}
          />
        </div>

        <div className="space-y-1">
          <Label
            htmlFor={`condition-${index}-targetValue`}
            className="text-xs text-muted-foreground"
          >
            Target Value
          </Label>
          <Controller
            control={control}
            name={
              `conditions.${index}.targetValue` as never
            }
            render={({ field }) => (
              <Input
                id={`condition-${index}-targetValue`}
                type="number"
                step="any"
                placeholder="0"
                value={field.value as number}
                onChange={(e) => field.onChange(Number(e.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <FieldError
            message={getErrorMessage(errors, "")}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-decimals`}
          className="text-xs text-muted-foreground"
        >
          Decimals
        </Label>
        <Controller
          control={control}
          name={`conditions.${index}.decimals` as never}
          render={({ field }) => (
            <Input
              id={`condition-${index}-decimals`}
              type="number"
              min={0}
              max={18}
              placeholder="0"
              value={field.value as number}
              onChange={(e) => field.onChange(Number(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
              className="w-24"
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>
    </div>
  );
}

// -- Webhook --

function WebhookFields({ index, control, errors }: FieldProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-relayer`}
          className="text-xs text-muted-foreground"
        >
          Relayer
        </Label>
        <Controller
          control={control}
          name={`conditions.${index}.relayer` as never}
          render={({ field }) => (
            <Input
              id={`condition-${index}-relayer`}
              placeholder="Relayer wallet address (base58)"
              className="font-mono text-xs"
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-eventHash`}
          className="text-xs text-muted-foreground"
        >
          Event Hash (32 bytes hex)
        </Label>
        <Controller
          control={control}
          name={`conditions.${index}.eventHash` as never}
          render={({ field }) => (
            <Input
              id={`condition-${index}-eventHash`}
              placeholder="64 hex characters (e.g. abcdef01…)"
              className="font-mono text-xs"
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>
    </div>
  );
}

// -- TokenGated --

function TokenGatedFields({ index, control, errors }: FieldProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-requiredMint`}
          className="text-xs text-muted-foreground"
        >
          Required Token Mint
        </Label>
        <Controller
          control={control}
          name={
            `conditions.${index}.requiredMint` as never
          }
          render={({ field }) => (
            <Input
              id={`condition-${index}-requiredMint`}
              placeholder="SPL token mint address (base58)"
              className="font-mono text-xs"
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-minAmount`}
          className="text-xs text-muted-foreground"
        >
          Minimum Amount
        </Label>
        <Controller
          control={control}
          name={`conditions.${index}.minAmount` as never}
          render={({ field }) => (
            <Input
              id={`condition-${index}-minAmount`}
              type="number"
              step="any"
              placeholder="0"
              value={field.value as number}
              onChange={(e) => field.onChange(Number(e.target.value))}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>

      <div className="space-y-1">
        <Label
          htmlFor={`condition-${index}-holder`}
          className="text-xs text-muted-foreground"
        >
          Token Holder
        </Label>
        <Controller
          control={control}
          name={`conditions.${index}.holder` as never}
          render={({ field }) => (
            <Input
              id={`condition-${index}-holder`}
              placeholder="Holder wallet address (base58)"
              className="font-mono text-xs"
              value={(field.value as string) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              ref={field.ref}
            />
          )}
        />
        <FieldError
          message={getErrorMessage(errors, "")}
        />
      </div>
    </div>
  );
}
