use anchor_lang::prelude::*;

pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use instructions::*;
use state::*;

declare_id!("2wL3PPjoG4UmVrNYZyXvxfTfV738AVCG8LHJPUEtxEeV");

#[program]
pub mod gherkin_pay {
    use super::*;

    pub fn create_payment(
        ctx: Context<CreatePayment>,
        payment_id: u64,
        total_amount: u64,
        operator: ConditionOperator,
    ) -> Result<()> {
        instructions::create_payment::handle_create_payment(ctx, payment_id, total_amount, operator)
    }

    pub fn create_milestone_payment(
        ctx: Context<CreateMilestonePayment>,
        payment_id: u64,
        total_amount: u64,
        milestone_count: u8,
    ) -> Result<()> {
        instructions::create_milestone_payment::handle_create_milestone_payment(ctx, payment_id, total_amount, milestone_count)
    }

    pub fn add_milestone(
        ctx: Context<AddMilestone>,
        milestone_index: u8,
        amount: u64,
        operator: ConditionOperator,
    ) -> Result<()> {
        instructions::add_milestone::handle_add_milestone(ctx, milestone_index, amount, operator)
    }

    pub fn add_condition(ctx: Context<AddCondition>, condition: Condition) -> Result<()> {
        instructions::add_condition::handle_add_condition(ctx, condition)
    }

    pub fn finalize_conditions(ctx: Context<FinalizeConditions>) -> Result<()> {
        instructions::finalize_conditions::handle_finalize_conditions(ctx)
    }

    pub fn fund_payment(ctx: Context<FundPayment>) -> Result<()> {
        instructions::fund_payment::handle_fund_payment(ctx)
    }

    pub fn sign_multisig(ctx: Context<SignMultisig>, condition_index: u8) -> Result<()> {
        instructions::sign_multisig::handle_sign_multisig(ctx, condition_index)
    }

    pub fn crank_time(ctx: Context<CrankTime>, condition_index: u8) -> Result<()> {
        instructions::crank_time::handle_crank_time(ctx, condition_index)
    }

    pub fn crank_oracle(ctx: Context<CrankOracle>, condition_index: u8) -> Result<()> {
        instructions::crank_oracle::handle_crank_oracle(ctx, condition_index)
    }

    pub fn confirm_webhook(
        ctx: Context<ConfirmWebhook>,
        condition_index: u8,
        event_hash: [u8; 32],
    ) -> Result<()> {
        instructions::confirm_webhook::handle_confirm_webhook(ctx, condition_index, event_hash)
    }

    pub fn crank_token_gate(ctx: Context<CrankTokenGate>, condition_index: u8) -> Result<()> {
        instructions::crank_token_gate::handle_crank_token_gate(ctx, condition_index)
    }

    pub fn evaluate_and_release(ctx: Context<EvaluateAndRelease>) -> Result<()> {
        instructions::evaluate_and_release::handle_evaluate_and_release(ctx)
    }

    pub fn cancel_payment(ctx: Context<CancelPayment>) -> Result<()> {
        instructions::cancel_payment::handle_cancel_payment(ctx)
    }
}
