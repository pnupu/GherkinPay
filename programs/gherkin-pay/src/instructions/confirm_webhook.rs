use anchor_lang::prelude::*;

use crate::error::GherkinPayError;
use crate::events::ConditionMet;
use crate::state::*;

#[derive(Accounts)]
#[instruction(condition_index: u8)]
pub struct ConfirmWebhook<'info> {
    pub relayer: Signer<'info>,

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

pub fn handle_confirm_webhook(ctx: Context<ConfirmWebhook>, condition_index: u8, event_hash: [u8; 32]) -> Result<()> {
    let relayer_key = ctx.accounts.relayer.key();
    let cond = &mut ctx.accounts.condition_account;
    let idx = condition_index as usize;
    let condition = &mut cond.conditions[idx];

    match condition {
        Condition::Webhook {
            relayer,
            event_hash: stored_hash,
            met,
        } => {
            if *met {
                return Ok(());
            }

            require!(relayer_key == *relayer, GherkinPayError::RelayerMismatch);
            require!(event_hash == *stored_hash, GherkinPayError::EventHashMismatch);

            *met = true;

            emit!(ConditionMet {
                payment: ctx.accounts.payment.key(),
                milestone_index: cond.milestone_index,
                condition_index,
                condition_type: "Webhook".to_string(),
            });
        }
        _ => return Err(GherkinPayError::ConditionTypeMismatch.into()),
    }

    Ok(())
}
