use anchor_lang::prelude::*;

use crate::error::GherkinPayError;
use crate::events::{ConditionMet, MultisigApproval};
use crate::state::*;

#[derive(Accounts)]
#[instruction(condition_index: u8)]
pub struct SignMultisig<'info> {
    pub signer: Signer<'info>,

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

pub fn handle_sign_multisig(ctx: Context<SignMultisig>, condition_index: u8) -> Result<()> {
    let signer_key = ctx.accounts.signer.key();
    let payment_key = ctx.accounts.payment.key();
    let cond = &mut ctx.accounts.condition_account;
    let milestone_index = cond.milestone_index;
    let idx = condition_index as usize;

    let condition = &mut cond.conditions[idx];

    match condition {
        Condition::Multisig {
            signers,
            threshold,
            approvals,
            met,
        } => {
            if *met {
                return Ok(());
            }

            let signer_pos = signers
                .iter()
                .position(|s| s == &signer_key)
                .ok_or(GherkinPayError::SignerNotInList)?;

            require!(!approvals[signer_pos], GherkinPayError::AlreadyApproved);

            approvals[signer_pos] = true;

            let approval_count = approvals.iter().filter(|a| **a).count() as u8;
            let thresh = *threshold;

            emit!(MultisigApproval {
                payment: payment_key,
                signer: signer_key,
                milestone_index,
                condition_index,
                approvals_count: approval_count,
                threshold: thresh,
            });

            if approval_count >= thresh {
                *met = true;

                emit!(ConditionMet {
                    payment: payment_key,
                    milestone_index,
                    condition_index,
                    condition_type: "Multisig".to_string(),
                });
            }
        }
        _ => return Err(GherkinPayError::ConditionTypeMismatch.into()),
    }

    Ok(())
}
