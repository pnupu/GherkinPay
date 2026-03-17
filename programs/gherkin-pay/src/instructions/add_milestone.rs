use anchor_lang::prelude::*;

use crate::error::GherkinPayError;
use crate::state::*;

#[derive(Accounts)]
#[instruction(milestone_index: u8, amount: u64, operator: ConditionOperator)]
pub struct AddMilestone<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        has_one = authority,
        constraint = payment.status == PaymentStatus::Created @ GherkinPayError::InvalidPaymentStatus,
        constraint = payment.is_milestone @ GherkinPayError::NotMilestonePayment,
        constraint = milestone_index < payment.milestone_count @ GherkinPayError::MilestoneIndexMismatch,
    )]
    pub payment: Account<'info, PaymentAgreement>,

    #[account(
        init,
        payer = authority,
        space = ConditionAccount::base_size(),
        seeds = [b"conditions", payment.key().as_ref(), &[milestone_index]],
        bump,
    )]
    pub condition_account: Account<'info, ConditionAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handle_add_milestone(
    ctx: Context<AddMilestone>,
    milestone_index: u8,
    amount: u64,
    operator: ConditionOperator,
) -> Result<()> {
    let cond = &mut ctx.accounts.condition_account;
    cond.payment = ctx.accounts.payment.key();
    cond.milestone_index = milestone_index;
    cond.amount = amount;
    cond.milestone_status = MilestoneStatus::Pending;
    cond.operator = operator;
    cond.conditions = Vec::new();
    cond.is_finalized = false;
    cond.bump = ctx.bumps.condition_account;

    Ok(())
}
