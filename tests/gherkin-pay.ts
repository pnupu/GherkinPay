import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { GherkinPay } from "../target/types/gherkin_pay";
import { GherkinPayHook } from "../target/types/gherkin_pay_hook";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  createMint,
  mintTo,
  createAccount,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("GherkinPay", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.GherkinPay as Program<GherkinPay>;
  const hookProgram = anchor.workspace
    .GherkinPayHook as Program<GherkinPayHook>;

  const authority = provider.wallet as anchor.Wallet;
  const payer = Keypair.generate();
  const payee = Keypair.generate();

  let mint: PublicKey;
  let payerTokenAccount: PublicKey;
  let payeeTokenAccount: PublicKey;

  const PAYMENT_AMOUNT = new BN(1_000_000); // 1 USDC (6 decimals)
  const DECIMALS = 6;

  before(async () => {
    // Airdrop to all participants
    for (const kp of [payer, payee]) {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    // Also airdrop to authority if needed
    const authBalance = await provider.connection.getBalance(
      authority.publicKey
    );
    if (authBalance < 5 * LAMPORTS_PER_SOL) {
      const sig = await provider.connection.requestAirdrop(
        authority.publicKey,
        10 * LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    // Create a Token-2022 mint
    mint = await createMint(
      provider.connection,
      (authority as any).payer || authority.payer,
      authority.publicKey,
      null,
      DECIMALS,
      Keypair.generate(),
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Create token accounts
    payerTokenAccount = await createAccount(
      provider.connection,
      (authority as any).payer || authority.payer,
      mint,
      payer.publicKey,
      Keypair.generate(),
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    payeeTokenAccount = await createAccount(
      provider.connection,
      (authority as any).payer || authority.payer,
      mint,
      payee.publicKey,
      Keypair.generate(),
      undefined,
      TOKEN_2022_PROGRAM_ID
    );

    // Mint tokens to payer
    await mintTo(
      provider.connection,
      (authority as any).payer || authority.payer,
      mint,
      payerTokenAccount,
      authority.publicKey,
      10_000_000, // 10 USDC
      [],
      undefined,
      TOKEN_2022_PROGRAM_ID
    );
  });

  function getPaymentPDA(paymentId: BN): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("payment"),
        authority.publicKey.toBuffer(),
        paymentId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
  }

  function getEscrowPDA(paymentPDA: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), paymentPDA.toBuffer()],
      program.programId
    );
  }

  function getConditionPDA(
    paymentPDA: PublicKey,
    milestoneIndex: number
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("conditions"),
        paymentPDA.toBuffer(),
        Buffer.from([milestoneIndex]),
      ],
      program.programId
    );
  }

  describe("Simple Payment with Time-Based Condition", () => {
    const paymentId = new BN(1);
    let paymentPDA: PublicKey;
    let escrowPDA: PublicKey;
    let conditionPDA: PublicKey;

    it("Creates a simple payment", async () => {
      [paymentPDA] = getPaymentPDA(paymentId);
      [escrowPDA] = getEscrowPDA(paymentPDA);
      [conditionPDA] = getConditionPDA(paymentPDA, 0);

      await program.methods
        .createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })
        .accounts({
          authority: authority.publicKey,
          payerWallet: payer.publicKey,
          payee: payee.publicKey,
          tokenMint: mint,
          payment: paymentPDA,
          escrowTokenAccount: escrowPDA,
          conditionAccount: conditionPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.equal(payment.paymentId.toNumber(), 1);
      assert.deepEqual(payment.status, { created: {} });
      assert.equal(payment.totalAmount.toNumber(), PAYMENT_AMOUNT.toNumber());
      assert.equal(payment.isMilestone, false);
    });

    it("Adds a time-based condition (unlock in the past)", async () => {
      const pastTimestamp = new BN(Math.floor(Date.now() / 1000) - 60);

      await program.methods
        .addCondition({
          timeBased: {
            unlockAt: pastTimestamp,
            met: false,
          },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const condAccount = await program.account.conditionAccount.fetch(
        conditionPDA
      );
      assert.equal(condAccount.conditions.length, 1);
    });

    it("Finalizes conditions", async () => {
      await program.methods
        .finalizeConditions()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .rpc();

      const condAccount = await program.account.conditionAccount.fetch(
        conditionPDA
      );
      assert.equal(condAccount.isFinalized, true);
    });

    it("Funds the payment", async () => {
      await program.methods
        .fundPayment()
        .accounts({
          payer: payer.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          tokenMint: mint,
          payerTokenAccount: payerTokenAccount,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.deepEqual(payment.status, { active: {} });

      const escrow = await getAccount(
        provider.connection,
        escrowPDA,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      assert.equal(Number(escrow.amount), PAYMENT_AMOUNT.toNumber());
    });

    it("Cranks the time condition", async () => {
      await program.methods
        .crankTime(0)
        .accounts({
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .rpc();

      const condAccount = await program.account.conditionAccount.fetch(
        conditionPDA
      );
      const cond = condAccount.conditions[0];
      assert.ok("timeBased" in cond);
      assert.equal((cond as any).timeBased.met, true);
    });

    it("Evaluates and releases funds", async () => {
      await program.methods
        .evaluateAndRelease()
        .accounts({
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          nextConditionAccount: conditionPDA, // same for simple payment
          tokenMint: mint,
          escrowTokenAccount: escrowPDA,
          payeeTokenAccount: payeeTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.deepEqual(payment.status, { completed: {} });
      assert.equal(
        payment.releasedAmount.toNumber(),
        PAYMENT_AMOUNT.toNumber()
      );

      const payeeAcct = await getAccount(
        provider.connection,
        payeeTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      assert.equal(Number(payeeAcct.amount), PAYMENT_AMOUNT.toNumber());
    });
  });

  describe("Payment with Multisig Condition", () => {
    const paymentId = new BN(2);
    let paymentPDA: PublicKey;
    let escrowPDA: PublicKey;
    let conditionPDA: PublicKey;

    const signer1 = Keypair.generate();
    const signer2 = Keypair.generate();
    const signer3 = Keypair.generate();

    before(async () => {
      // Airdrop to signers
      for (const kp of [signer1, signer2, signer3]) {
        const sig = await provider.connection.requestAirdrop(
          kp.publicKey,
          LAMPORTS_PER_SOL
        );
        await provider.connection.confirmTransaction(sig);
      }

      // Mint more tokens
      await mintTo(
        provider.connection,
        (authority as any).payer || authority.payer,
        mint,
        payerTokenAccount,
        authority.publicKey,
        10_000_000,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
    });

    it("Creates payment with multisig (2-of-3 threshold)", async () => {
      [paymentPDA] = getPaymentPDA(paymentId);
      [escrowPDA] = getEscrowPDA(paymentPDA);
      [conditionPDA] = getConditionPDA(paymentPDA, 0);

      await program.methods
        .createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })
        .accounts({
          authority: authority.publicKey,
          payerWallet: payer.publicKey,
          payee: payee.publicKey,
          tokenMint: mint,
          payment: paymentPDA,
          escrowTokenAccount: escrowPDA,
          conditionAccount: conditionPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Add multisig condition
      await program.methods
        .addCondition({
          multisig: {
            signers: [signer1.publicKey, signer2.publicKey, signer3.publicKey],
            threshold: 2,
            approvals: [false, false, false],
            met: false,
          },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .finalizeConditions()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .rpc();

      await program.methods
        .fundPayment()
        .accounts({
          payer: payer.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          tokenMint: mint,
          payerTokenAccount: payerTokenAccount,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();
    });

    it("First signer approves (not yet met)", async () => {
      await program.methods
        .signMultisig(0)
        .accounts({
          signer: signer1.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .signers([signer1])
        .rpc();

      const condAccount = await program.account.conditionAccount.fetch(
        conditionPDA
      );
      const cond = condAccount.conditions[0];
      assert.ok("multisig" in cond);
      assert.equal((cond as any).multisig.met, false);
      assert.deepEqual((cond as any).multisig.approvals, [true, false, false]);
    });

    it("Second signer approves (threshold met)", async () => {
      await program.methods
        .signMultisig(0)
        .accounts({
          signer: signer2.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .signers([signer2])
        .rpc();

      const condAccount = await program.account.conditionAccount.fetch(
        conditionPDA
      );
      const cond = condAccount.conditions[0];
      assert.ok("multisig" in cond);
      assert.equal((cond as any).multisig.met, true);
    });

    it("Releases funds after multisig met", async () => {
      await program.methods
        .evaluateAndRelease()
        .accounts({
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          nextConditionAccount: conditionPDA,
          tokenMint: mint,
          escrowTokenAccount: escrowPDA,
          payeeTokenAccount: payeeTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.deepEqual(payment.status, { completed: {} });
    });
  });

  describe("Payment with Webhook Condition", () => {
    const paymentId = new BN(3);
    let paymentPDA: PublicKey;
    let escrowPDA: PublicKey;
    let conditionPDA: PublicKey;

    const relayer = Keypair.generate();
    const eventHash = Buffer.alloc(32);
    eventHash.write("webhook_event_12345", 0);

    before(async () => {
      const sig = await provider.connection.requestAirdrop(
        relayer.publicKey,
        LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);

      await mintTo(
        provider.connection,
        (authority as any).payer || authority.payer,
        mint,
        payerTokenAccount,
        authority.publicKey,
        10_000_000,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
    });

    it("Creates, conditions, funds, confirms webhook, and releases", async () => {
      [paymentPDA] = getPaymentPDA(paymentId);
      [escrowPDA] = getEscrowPDA(paymentPDA);
      [conditionPDA] = getConditionPDA(paymentPDA, 0);

      // Create
      await program.methods
        .createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })
        .accounts({
          authority: authority.publicKey,
          payerWallet: payer.publicKey,
          payee: payee.publicKey,
          tokenMint: mint,
          payment: paymentPDA,
          escrowTokenAccount: escrowPDA,
          conditionAccount: conditionPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Add webhook condition
      await program.methods
        .addCondition({
          webhook: {
            relayer: relayer.publicKey,
            eventHash: Array.from(eventHash),
            met: false,
          },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Finalize and fund
      await program.methods
        .finalizeConditions()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .rpc();

      await program.methods
        .fundPayment()
        .accounts({
          payer: payer.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          tokenMint: mint,
          payerTokenAccount: payerTokenAccount,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      // Confirm webhook
      await program.methods
        .confirmWebhook(0, Array.from(eventHash))
        .accounts({
          relayer: relayer.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .signers([relayer])
        .rpc();

      const condAccount = await program.account.conditionAccount.fetch(
        conditionPDA
      );
      assert.equal((condAccount.conditions[0] as any).webhook.met, true);

      // Release
      await program.methods
        .evaluateAndRelease()
        .accounts({
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          nextConditionAccount: conditionPDA,
          tokenMint: mint,
          escrowTokenAccount: escrowPDA,
          payeeTokenAccount: payeeTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.deepEqual(payment.status, { completed: {} });
    });
  });

  describe("Payment with OR Logic", () => {
    const paymentId = new BN(4);
    let paymentPDA: PublicKey;
    let escrowPDA: PublicKey;
    let conditionPDA: PublicKey;

    before(async () => {
      await mintTo(
        provider.connection,
        (authority as any).payer || authority.payer,
        mint,
        payerTokenAccount,
        authority.publicKey,
        10_000_000,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
    });

    it("With OR operator, one met condition is enough", async () => {
      [paymentPDA] = getPaymentPDA(paymentId);
      [escrowPDA] = getEscrowPDA(paymentPDA);
      [conditionPDA] = getConditionPDA(paymentPDA, 0);

      // Create with OR operator
      await program.methods
        .createPayment(paymentId, PAYMENT_AMOUNT, { or: {} })
        .accounts({
          authority: authority.publicKey,
          payerWallet: payer.publicKey,
          payee: payee.publicKey,
          tokenMint: mint,
          payment: paymentPDA,
          escrowTokenAccount: escrowPDA,
          conditionAccount: conditionPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Add time condition (already past)
      const pastTimestamp = new BN(Math.floor(Date.now() / 1000) - 60);
      await program.methods
        .addCondition({
          timeBased: { unlockAt: pastTimestamp, met: false },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Add webhook condition (will NOT be met)
      const fakeRelayer = Keypair.generate();
      await program.methods
        .addCondition({
          webhook: {
            relayer: fakeRelayer.publicKey,
            eventHash: Array.from(Buffer.alloc(32, 0xff)),
            met: false,
          },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Finalize and fund
      await program.methods
        .finalizeConditions()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .rpc();

      await program.methods
        .fundPayment()
        .accounts({
          payer: payer.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          tokenMint: mint,
          payerTokenAccount: payerTokenAccount,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      // Crank only the time condition
      await program.methods
        .crankTime(0)
        .accounts({
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .rpc();

      // OR logic: time is met, webhook is not — should still release
      await program.methods
        .evaluateAndRelease()
        .accounts({
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          nextConditionAccount: conditionPDA,
          tokenMint: mint,
          escrowTokenAccount: escrowPDA,
          payeeTokenAccount: payeeTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.deepEqual(payment.status, { completed: {} });
    });
  });

  describe("Cancellation", () => {
    const paymentId = new BN(5);
    let paymentPDA: PublicKey;
    let escrowPDA: PublicKey;
    let conditionPDA: PublicKey;

    before(async () => {
      await mintTo(
        provider.connection,
        (authority as any).payer || authority.payer,
        mint,
        payerTokenAccount,
        authority.publicKey,
        10_000_000,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
    });

    it("Cancels a funded payment and refunds payer", async () => {
      [paymentPDA] = getPaymentPDA(paymentId);
      [escrowPDA] = getEscrowPDA(paymentPDA);
      [conditionPDA] = getConditionPDA(paymentPDA, 0);

      await program.methods
        .createPayment(paymentId, PAYMENT_AMOUNT, { and: {} })
        .accounts({
          authority: authority.publicKey,
          payerWallet: payer.publicKey,
          payee: payee.publicKey,
          tokenMint: mint,
          payment: paymentPDA,
          escrowTokenAccount: escrowPDA,
          conditionAccount: conditionPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Add a future time condition
      const futureTimestamp = new BN(Math.floor(Date.now() / 1000) + 9999);
      await program.methods
        .addCondition({
          timeBased: { unlockAt: futureTimestamp, met: false },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .finalizeConditions()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
        })
        .rpc();

      const balBefore = await getAccount(
        provider.connection,
        payerTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );

      await program.methods
        .fundPayment()
        .accounts({
          payer: payer.publicKey,
          payment: paymentPDA,
          conditionAccount: conditionPDA,
          tokenMint: mint,
          payerTokenAccount: payerTokenAccount,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      // Cancel
      await program.methods
        .cancelPayment()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          tokenMint: mint,
          escrowTokenAccount: escrowPDA,
          payerTokenAccount: payerTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.deepEqual(payment.status, { cancelled: {} });

      const balAfter = await getAccount(
        provider.connection,
        payerTokenAccount,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      assert.equal(Number(balAfter.amount), Number(balBefore.amount));
    });
  });

  describe("Milestone Payment", () => {
    const paymentId = new BN(6);
    const totalAmount = new BN(3_000_000); // 3 USDC
    const milestone0Amount = new BN(1_000_000);
    const milestone1Amount = new BN(2_000_000);
    let paymentPDA: PublicKey;
    let escrowPDA: PublicKey;
    let cond0PDA: PublicKey;
    let cond1PDA: PublicKey;

    before(async () => {
      await mintTo(
        provider.connection,
        (authority as any).payer || authority.payer,
        mint,
        payerTokenAccount,
        authority.publicKey,
        10_000_000,
        [],
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
    });

    it("Creates a milestone payment", async () => {
      [paymentPDA] = getPaymentPDA(paymentId);
      [escrowPDA] = getEscrowPDA(paymentPDA);
      [cond0PDA] = getConditionPDA(paymentPDA, 0);
      [cond1PDA] = getConditionPDA(paymentPDA, 1);

      await program.methods
        .createMilestonePayment(paymentId, totalAmount, 2)
        .accounts({
          authority: authority.publicKey,
          payerWallet: payer.publicKey,
          payee: payee.publicKey,
          tokenMint: mint,
          payment: paymentPDA,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.equal(payment.isMilestone, true);
      assert.equal(payment.milestoneCount, 2);
    });

    it("Adds milestones", async () => {
      await program.methods
        .addMilestone(0, milestone0Amount, { and: {} })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: cond0PDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      await program.methods
        .addMilestone(1, milestone1Amount, { and: {} })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: cond1PDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("Adds conditions to each milestone", async () => {
      const pastTimestamp = new BN(Math.floor(Date.now() / 1000) - 60);

      // Milestone 0: time-based condition (past)
      await program.methods
        .addCondition({
          timeBased: { unlockAt: pastTimestamp, met: false },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: cond0PDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Milestone 1: time-based condition (past)
      await program.methods
        .addCondition({
          timeBased: { unlockAt: pastTimestamp, met: false },
        })
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: cond1PDA,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
    });

    it("Finalizes all conditions", async () => {
      await program.methods
        .finalizeConditions()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: cond0PDA,
        })
        .rpc();

      await program.methods
        .finalizeConditions()
        .accounts({
          authority: authority.publicKey,
          payment: paymentPDA,
          conditionAccount: cond1PDA,
        })
        .rpc();
    });

    it("Funds the milestone payment", async () => {
      await program.methods
        .fundPayment()
        .accounts({
          payer: payer.publicKey,
          payment: paymentPDA,
          conditionAccount: cond0PDA,
          tokenMint: mint,
          payerTokenAccount: payerTokenAccount,
          escrowTokenAccount: escrowPDA,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([payer])
        .rpc();

      const escrow = await getAccount(
        provider.connection,
        escrowPDA,
        undefined,
        TOKEN_2022_PROGRAM_ID
      );
      assert.equal(Number(escrow.amount), totalAmount.toNumber());
    });

    it("Releases milestone 0", async () => {
      await program.methods
        .crankTime(0)
        .accounts({
          payment: paymentPDA,
          conditionAccount: cond0PDA,
        })
        .rpc();

      await program.methods
        .evaluateAndRelease()
        .accounts({
          payment: paymentPDA,
          conditionAccount: cond0PDA,
          nextConditionAccount: cond1PDA,
          tokenMint: mint,
          escrowTokenAccount: escrowPDA,
          payeeTokenAccount: payeeTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.equal(
        payment.releasedAmount.toNumber(),
        milestone0Amount.toNumber()
      );
      assert.equal(payment.currentMilestone, 1);
      assert.deepEqual(payment.status, { active: {} });
    });

    it("Releases milestone 1 and completes payment", async () => {
      await program.methods
        .crankTime(0)
        .accounts({
          payment: paymentPDA,
          conditionAccount: cond1PDA,
        })
        .rpc();

      await program.methods
        .evaluateAndRelease()
        .accounts({
          payment: paymentPDA,
          conditionAccount: cond1PDA,
          nextConditionAccount: cond1PDA, // last milestone, pass same
          tokenMint: mint,
          escrowTokenAccount: escrowPDA,
          payeeTokenAccount: payeeTokenAccount,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc();

      const payment = await program.account.paymentAgreement.fetch(paymentPDA);
      assert.deepEqual(payment.status, { completed: {} });
      assert.equal(payment.releasedAmount.toNumber(), totalAmount.toNumber());
    });
  });
});
