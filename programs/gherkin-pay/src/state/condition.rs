use anchor_lang::prelude::*;

pub const MAX_CONDITIONS: usize = 8;
pub const MAX_SIGNERS: usize = 5;

#[account]
pub struct ConditionAccount {
    pub payment: Pubkey,
    pub milestone_index: u8,
    pub amount: u64,
    pub milestone_status: MilestoneStatus,
    pub operator: ConditionOperator,
    pub conditions: Vec<Condition>,
    pub is_finalized: bool,
    pub bump: u8,
}

impl ConditionAccount {
    pub fn base_size() -> usize {
        8  // discriminator
        + 32 // payment
        + 1  // milestone_index
        + 8  // amount
        + 1  // milestone_status
        + 1  // operator
        + 4  // Vec length prefix
        + 1  // is_finalized
        + 1  // bump
    }

    pub fn current_size(&self) -> usize {
        Self::base_size()
            + self
                .conditions
                .iter()
                .map(|c| c.serialized_size())
                .sum::<usize>()
    }

    pub fn are_conditions_met(&self) -> bool {
        if self.conditions.is_empty() {
            return false;
        }
        match self.operator {
            ConditionOperator::And => self.conditions.iter().all(|c| c.is_met()),
            ConditionOperator::Or => self.conditions.iter().any(|c| c.is_met()),
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    Active,
    Released,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ConditionOperator {
    And,
    Or,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum ComparisonOperator {
    Gt,
    Gte,
    Lt,
    Lte,
    Eq,
}

impl ComparisonOperator {
    pub fn evaluate(&self, actual: i64, target: i64) -> bool {
        match self {
            ComparisonOperator::Gt => actual > target,
            ComparisonOperator::Gte => actual >= target,
            ComparisonOperator::Lt => actual < target,
            ComparisonOperator::Lte => actual <= target,
            ComparisonOperator::Eq => actual == target,
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum Condition {
    Multisig {
        signers: Vec<Pubkey>,
        threshold: u8,
        approvals: Vec<bool>,
        met: bool,
    },
    TimeBased {
        unlock_at: i64,
        met: bool,
    },
    Oracle {
        feed_account: Pubkey,
        operator: ComparisonOperator,
        target_value: i64,
        decimals: u8,
        met: bool,
    },
    Webhook {
        relayer: Pubkey,
        event_hash: [u8; 32],
        met: bool,
    },
    TokenGated {
        required_mint: Pubkey,
        min_amount: u64,
        holder: Pubkey,
        met: bool,
    },
}

impl Condition {
    pub fn is_met(&self) -> bool {
        match self {
            Condition::Multisig { met, .. } => *met,
            Condition::TimeBased { met, .. } => *met,
            Condition::Oracle { met, .. } => *met,
            Condition::Webhook { met, .. } => *met,
            Condition::TokenGated { met, .. } => *met,
        }
    }

    pub fn serialized_size(&self) -> usize {
        1 // enum discriminator
        + match self {
            Condition::Multisig { signers, approvals, .. } => {
                4 + signers.len() * 32 // Vec<Pubkey>
                + 1                     // threshold
                + 4 + approvals.len()   // Vec<bool>
                + 1                     // met
            }
            Condition::TimeBased { .. } => {
                8 // unlock_at
                + 1 // met
            }
            Condition::Oracle { .. } => {
                32 // feed_account
                + 1 // operator
                + 8 // target_value
                + 1 // decimals
                + 1 // met
            }
            Condition::Webhook { .. } => {
                32 // relayer
                + 32 // event_hash
                + 1  // met
            }
            Condition::TokenGated { .. } => {
                32 // required_mint
                + 8 // min_amount
                + 32 // holder
                + 1  // met
            }
        }
    }
}
