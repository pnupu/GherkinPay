use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::error::GherkinPayError;
use crate::events::{MilestoneAdvanced, PaymentCompleted, PaymentReleased};
use crate::state::*;

#[derive(Accounts)]
pub struct EvaluateAndRelease<'info> {
    #[account(
        mut,
        constraint = payment.status == PaymentStatus::Active @ GherkinPayError::InvalidPaymentStatus,
    )]
    pub payment: Account<'info, PaymentAgreement>,

    #[account(
        mut,
        constraint = condition_account.payment == payment.key(),
        constraint = condition_account.milestone_status == MilestoneStatus::Active @ GherkinPayError::MilestoneNotActive,
        constraint = condition_account.milestone_index == payment.current_milestone @ GherkinPayError::MilestoneIndexMismatch,
    )]
    pub condition_account: Account<'info, ConditionAccount>,

    /// The next milestone's ConditionAccount (only required for milestone payments
    /// that have a subsequent milestone). Pass the same account as condition_account
    /// if this is a simple payment or the last milestone.
    #[account(
        mut,
        constraint = next_condition_account.payment == payment.key(),
    )]
    pub next_condition_account: Account<'info, ConditionAccount>,

    #[account(
        constraint = token_mint.key() == payment.token_mint,
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        constraint = escrow_token_account.key() == payment.escrow_token_account,
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: validated against payment.payee
    #[account(
        mut,
        constraint = payee_token_account.mint == payment.token_mint,
        constraint = payee_token_account.owner == payment.payee,
    )]
    pub payee_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_evaluate_and_release(ctx: Context<EvaluateAndRelease>) -> Result<()> {
    let cond = &ctx.accounts.condition_account;
    require!(cond.are_conditions_met(), GherkinPayError::ConditionsNotMet);

    let payment = &ctx.accounts.payment;
    let release_amount = cond.amount;
    let decimals = ctx.accounts.token_mint.decimals;

    let authority_key = payment.authority;
    let payment_id_bytes = payment.payment_id.to_le_bytes();
    let bump = &[payment.bump];
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"payment",
        authority_key.as_ref(),
        payment_id_bytes.as_ref(),
        bump,
    ]];

    token_interface::transfer_checked(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                mint: ctx.accounts.token_mint.to_account_info(),
                to: ctx.accounts.payee_token_account.to_account_info(),
                authority: ctx.accounts.payment.to_account_info(),
            },
            signer_seeds,
        ),
        release_amount,
        decimals,
    )?;

    let cond = &mut ctx.accounts.condition_account;
    cond.milestone_status = MilestoneStatus::Released;

    let payment = &mut ctx.accounts.payment;
    payment.released_amount = payment
        .released_amount
        .checked_add(release_amount)
        .ok_or(GherkinPayError::ArithmeticOverflow)?;

    let milestone_index = cond.milestone_index;

    emit!(PaymentReleased {
        payment: payment.key(),
        payee: payment.payee,
        amount: release_amount,
        milestone_index,
    });

    let is_final = if payment.is_milestone {
        milestone_index + 1 >= payment.milestone_count
    } else {
        true
    };

    if is_final {
        payment.status = PaymentStatus::Completed;
        emit!(PaymentCompleted {
            payment: payment.key(),
        });
    } else {
        let next_idx = milestone_index + 1;
        payment.current_milestone = next_idx;

        let next_cond = &mut ctx.accounts.next_condition_account;
        require!(
            next_cond.milestone_index == next_idx,
            GherkinPayError::MilestoneIndexMismatch
        );
        next_cond.milestone_status = MilestoneStatus::Active;

        emit!(MilestoneAdvanced {
            payment: payment.key(),
            completed_index: milestone_index,
            next_index: next_idx,
        });
    }

    Ok(())
}
