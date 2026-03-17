use anchor_lang::prelude::*;

use crate::error::GherkinPayError;
use crate::state::*;

#[derive(Accounts)]
pub struct FinalizeConditions<'info> {
    pub authority: Signer<'info>,

    #[account(
        has_one = authority,
        constraint = payment.status == PaymentStatus::Created @ GherkinPayError::InvalidPaymentStatus,
    )]
    pub payment: Account<'info, PaymentAgreement>,

    #[account(
        mut,
        constraint = condition_account.payment == payment.key(),
        constraint = !condition_account.is_finalized @ GherkinPayError::ConditionsAlreadyFinalized,
    )]
    pub condition_account: Account<'info, ConditionAccount>,
}

pub fn handle_finalize_conditions(ctx: Context<FinalizeConditions>) -> Result<()> {
    ctx.accounts.condition_account.is_finalized = true;
    Ok(())
}
