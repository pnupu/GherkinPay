use anchor_lang::prelude::*;

use crate::error::GherkinPayError;
use crate::events::ConditionMet;
use crate::state::*;

#[derive(Accounts)]
#[instruction(condition_index: u8)]
pub struct CrankTime<'info> {
    #[account(
        constraint = payment.status == PaymentStatus::Active @ GherkinPayError::InvalidPaymentStatus,
    )]
    pub payment: Account<'info, PaymentAgreement>,

    #[account(
        mut,
        constraint = condition_account.payment == payment.key(),
        constraint = condition_account.milestone_status == MilestoneStatus::Active @ GherkinPayError::MilestoneNotActive,
        constraint = (condition_index as usize) < condition_account.conditions.len() @ GherkinPayError::ConditionIndexOutOfBounds,
    )]
    pub condition_account: Account<'info, ConditionAccount>,
}

pub fn handle_crank_time(ctx: Context<CrankTime>, condition_index: u8) -> Result<()> {
    let clock = Clock::get()?;
    let cond = &mut ctx.accounts.condition_account;
    let idx = condition_index as usize;
    let condition = &mut cond.conditions[idx];

    match condition {
        Condition::TimeBased { unlock_at, met } => {
            if *met {
                return Ok(());
            }

            if clock.unix_timestamp >= *unlock_at {
                *met = true;

                emit!(ConditionMet {
                    payment: ctx.accounts.payment.key(),
                    milestone_index: cond.milestone_index,
                    condition_index,
                    condition_type: "TimeBased".to_string(),
                });
            }
        }
        _ => return Err(GherkinPayError::ConditionTypeMismatch.into()),
    }

    Ok(())
}
