use anchor_lang::prelude::*;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::error::GherkinPayError;
use crate::events::PaymentCancelled;
use crate::state::*;

#[derive(Accounts)]
pub struct CancelPayment<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        constraint = payment.status != PaymentStatus::Completed @ GherkinPayError::CannotCancelCompleted,
        constraint = payment.status != PaymentStatus::Cancelled @ GherkinPayError::CannotCancelCompleted,
    )]
    pub payment: Account<'info, PaymentAgreement>,

    #[account(
        constraint = token_mint.key() == payment.token_mint,
    )]
    pub token_mint: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        constraint = escrow_token_account.key() == payment.escrow_token_account,
    )]
    pub escrow_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        constraint = payer_token_account.mint == payment.token_mint,
        constraint = payer_token_account.owner == payment.payer,
    )]
    pub payer_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_cancel_payment(ctx: Context<CancelPayment>) -> Result<()> {
    let payment = &ctx.accounts.payment;
    let refund_amount = payment
        .total_amount
        .checked_sub(payment.released_amount)
        .ok_or(GherkinPayError::ArithmeticOverflow)?;

    if refund_amount == 0 {
        let payment = &mut ctx.accounts.payment;
        payment.status = PaymentStatus::Cancelled;

        emit!(PaymentCancelled {
            payment: payment.key(),
            refund_amount: 0,
        });

        return Ok(());
    }

    let escrow_balance = ctx.accounts.escrow_token_account.amount;
    let transfer_amount = refund_amount.min(escrow_balance);

    if transfer_amount > 0 {
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
                    to: ctx.accounts.payer_token_account.to_account_info(),
                    authority: ctx.accounts.payment.to_account_info(),
                },
                signer_seeds,
            ),
            transfer_amount,
            decimals,
        )?;
    }

    let payment = &mut ctx.accounts.payment;
    payment.status = PaymentStatus::Cancelled;

    emit!(PaymentCancelled {
        payment: payment.key(),
        refund_amount: transfer_amount,
    });

    Ok(())
}
