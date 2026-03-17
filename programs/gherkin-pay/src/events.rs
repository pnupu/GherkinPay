use anchor_lang::prelude::*;

#[event]
pub struct PaymentCreated {
    pub payment: Pubkey,
    pub authority: Pubkey,
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub token_mint: Pubkey,
    pub total_amount: u64,
    pub is_milestone: bool,
    pub milestone_count: u8,
}

#[event]
pub struct PaymentFunded {
    pub payment: Pubkey,
    pub payer: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ConditionAdded {
    pub payment: Pubkey,
    pub milestone_index: u8,
    pub condition_index: u8,
    pub condition_type: String,
}

#[event]
pub struct ConditionMet {
    pub payment: Pubkey,
    pub milestone_index: u8,
    pub condition_index: u8,
    pub condition_type: String,
}

#[event]
pub struct PaymentReleased {
    pub payment: Pubkey,
    pub payee: Pubkey,
    pub amount: u64,
    pub milestone_index: u8,
}

#[event]
pub struct PaymentCompleted {
    pub payment: Pubkey,
}

#[event]
pub struct PaymentCancelled {
    pub payment: Pubkey,
    pub refund_amount: u64,
}

#[event]
pub struct MultisigApproval {
    pub payment: Pubkey,
    pub signer: Pubkey,
    pub milestone_index: u8,
    pub condition_index: u8,
    pub approvals_count: u8,
    pub threshold: u8,
}

#[event]
pub struct MilestoneAdvanced {
    pub payment: Pubkey,
    pub completed_index: u8,
    pub next_index: u8,
}
