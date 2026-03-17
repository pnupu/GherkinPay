use anchor_lang::prelude::*;

use crate::error::GherkinPayError;
use crate::events::ConditionAdded;
use crate::state::*;

#[derive(Accounts)]
pub struct AddCondition<'info> {
    #[account(mut)]
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
        constraint = condition_account.conditions.len() < MAX_CONDITIONS @ GherkinPayError::MaxConditionsReached,
    )]
    pub condition_account: Account<'info, ConditionAccount>,

    pub system_program: Program<'info, System>,
}

pub fn handle_add_condition(ctx: Context<AddCondition>, condition: Condition) -> Result<()> {
    if let Condition::Multisig { ref signers, .. } = condition {
        require!(signers.len() <= MAX_SIGNERS, GherkinPayError::MaxSignersReached);
    }

    let condition_type_name = match &condition {
        Condition::Multisig { .. } => "Multisig",
        Condition::TimeBased { .. } => "TimeBased",
        Condition::Oracle { .. } => "Oracle",
        Condition::Webhook { .. } => "Webhook",
        Condition::TokenGated { .. } => "TokenGated",
    };

    let cond = &mut ctx.accounts.condition_account;
    let condition_index = cond.conditions.len() as u8;

    let new_size = cond.current_size() + condition.serialized_size();
    let rent = Rent::get()?;
    let new_minimum_balance = rent.minimum_balance(new_size);
    let current_balance = cond.to_account_info().lamports();

    if current_balance < new_minimum_balance {
        let diff = new_minimum_balance.saturating_sub(current_balance);
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.authority.to_account_info(),
                    to: cond.to_account_info(),
                },
            ),
            diff,
        )?;
    }

    #[allow(deprecated)]
    cond.to_account_info().realloc(new_size, false)?;

    cond.conditions.push(condition);

    emit!(ConditionAdded {
        payment: ctx.accounts.payment.key(),
        milestone_index: cond.milestone_index,
        condition_index,
        condition_type: condition_type_name.to_string(),
    });

    Ok(())
}
