use anchor_lang::prelude::*;
use anchor_spl::token_interface::TokenAccount;

use crate::error::GherkinPayError;
use crate::events::ConditionMet;
use crate::state::*;

#[derive(Accounts)]
#[instruction(condition_index: u8)]
pub struct CrankTokenGate<'info> {
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

    pub holder_token_account: InterfaceAccount<'info, TokenAccount>,
}

pub fn handle_crank_token_gate(ctx: Context<CrankTokenGate>, condition_index: u8) -> Result<()> {
    let cond = &mut ctx.accounts.condition_account;
    let idx = condition_index as usize;
    let condition = &mut cond.conditions[idx];

    match condition {
        Condition::TokenGated {
            required_mint,
            min_amount,
            holder,
            met,
        } => {
            if *met {
                return Ok(());
            }

            let token_acct = &ctx.accounts.holder_token_account;
            require!(
                token_acct.mint == *required_mint,
                GherkinPayError::ConditionTypeMismatch
            );
            require!(
                token_acct.owner == *holder,
                GherkinPayError::ConditionTypeMismatch
            );

            if token_acct.amount >= *min_amount {
                *met = true;

                emit!(ConditionMet {
                    payment: ctx.accounts.payment.key(),
                    milestone_index: cond.milestone_index,
                    condition_index,
                    condition_type: "TokenGated".to_string(),
                });
            } else {
                return Err(GherkinPayError::TokenBalanceInsufficient.into());
            }
        }
        _ => return Err(GherkinPayError::ConditionTypeMismatch.into()),
    }

    Ok(())
}
