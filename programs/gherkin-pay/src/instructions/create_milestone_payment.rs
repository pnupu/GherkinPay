use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::error::GherkinPayError;
use crate::events::PaymentCreated;
use crate::state::*;

pub const MAX_MILESTONES: u8 = 10;

#[derive(Accounts)]
#[instruction(payment_id: u64, total_amount: u64, milestone_count: u8)]
pub struct CreateMilestonePayment<'info> {
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

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_milestone_payment(
    ctx: Context<CreateMilestonePayment>,
    payment_id: u64,
    total_amount: u64,
    milestone_count: u8,
) -> Result<()> {
    require!(milestone_count > 0, GherkinPayError::ZeroMilestones);
    require!(
        milestone_count <= MAX_MILESTONES,
        GherkinPayError::MaxMilestonesExceeded
    );

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
    payment.is_milestone = true;
    payment.milestone_count = milestone_count;
    payment.current_milestone = 0;
    payment.created_at = clock.unix_timestamp;
    payment.bump = ctx.bumps.payment;
    payment.escrow_bump = ctx.bumps.escrow_token_account;

    emit!(PaymentCreated {
        payment: payment.key(),
        authority: payment.authority,
        payer: payment.payer,
        payee: payment.payee,
        token_mint: payment.token_mint,
        total_amount,
        is_milestone: true,
        milestone_count,
    });

    Ok(())
}
