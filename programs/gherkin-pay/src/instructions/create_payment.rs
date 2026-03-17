use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::events::PaymentCreated;
use crate::state::*;

#[derive(Accounts)]
#[instruction(payment_id: u64, total_amount: u64, operator: ConditionOperator)]
pub struct CreatePayment<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: The wallet that will fund the escrow.
    pub payer_wallet: UncheckedAccount<'info>,

    /// CHECK: The wallet that will receive funds on release.
    pub payee: UncheckedAccount<'info>,

    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + PaymentAgreement::INIT_SPACE,
        seeds = [b"payment", authority.key().as_ref(), &payment_id.to_le_bytes()],
        bump,
    )]
    pub payment: Account<'info, PaymentAgreement>,

    #[account(
        init,
        payer = authority,
        token::mint = token_mint,
        token::authority = payment,
        token::token_program = token_program,
        seeds = [b"escrow", payment.key().as_ref()],
        bump,
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = authority,
        space = ConditionAccount::base_size(),
        seeds = [b"conditions", payment.key().as_ref(), &[0u8]],
        bump,
    )]
    pub condition_account: Account<'info, ConditionAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_payment(
    ctx: Context<CreatePayment>,
    payment_id: u64,
    total_amount: u64,
    operator: ConditionOperator,
) -> Result<()> {
    let clock = Clock::get()?;

    let payment = &mut ctx.accounts.payment;
    payment.payment_id = payment_id;
    payment.authority = ctx.accounts.authority.key();
    payment.payer = ctx.accounts.payer_wallet.key();
    payment.payee = ctx.accounts.payee.key();
    payment.token_mint = ctx.accounts.token_mint.key();
    payment.escrow_token_account = ctx.accounts.escrow_token_account.key();
    payment.total_amount = total_amount;
    payment.released_amount = 0;
    payment.status = PaymentStatus::Created;
    payment.is_milestone = false;
    payment.milestone_count = 1;
    payment.current_milestone = 0;
    payment.created_at = clock.unix_timestamp;
    payment.bump = ctx.bumps.payment;
    payment.escrow_bump = ctx.bumps.escrow_token_account;

    let cond = &mut ctx.accounts.condition_account;
    cond.payment = payment.key();
    cond.milestone_index = 0;
    cond.amount = total_amount;
    cond.milestone_status = MilestoneStatus::Pending;
    cond.operator = operator;
    cond.conditions = Vec::new();
    cond.is_finalized = false;
    cond.bump = ctx.bumps.condition_account;

    emit!(PaymentCreated {
        payment: payment.key(),
        authority: payment.authority,
        payer: payment.payer,
        payee: payment.payee,
        token_mint: payment.token_mint,
        total_amount,
        is_milestone: false,
        milestone_count: 1,
    });

    Ok(())
}
