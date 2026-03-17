use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::error::GherkinPayError;
use crate::events::PaymentFunded;
use crate::state::*;

#[derive(Accounts)]
pub struct FundPayment<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        constraint = payment.payer == payer.key(),
        constraint = payment.status == PaymentStatus::Created @ GherkinPayError::InvalidPaymentStatus,
    )]
    pub payment: Account<'info, PaymentAgreement>,

    #[account(
        mut,
        constraint = condition_account.payment == payment.key(),
        constraint = condition_account.milestone_index == 0,
        constraint = condition_account.is_finalized @ GherkinPayError::ConditionsNotFinalized,
    )]
    pub condition_account: Account<'info, ConditionAccount>,

    #[account(
        constraint = token_mint.key() == payment.token_mint,
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        constraint = payer_token_account.mint == payment.token_mint,
        constraint = payer_token_account.owner == payer.key(),
    )]
    pub payer_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = escrow_token_account.key() == payment.escrow_token_account,
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_fund_payment(ctx: Context<FundPayment>) -> Result<()> {
    let payment = &ctx.accounts.payment;
    let amount = payment.total_amount;
    let decimals = ctx.accounts.token_mint.decimals;

    token_interface::transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.payer_token_account.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.escrow_token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        amount,
        decimals,
    )?;

    let payment = &mut ctx.accounts.payment;
    payment.status = PaymentStatus::Active;

    let cond = &mut ctx.accounts.condition_account;
    cond.milestone_status = MilestoneStatus::Active;

    emit!(PaymentFunded {
        payment: payment.key(),
        payer: payment.payer,
        amount,
    });

    Ok(())
}
