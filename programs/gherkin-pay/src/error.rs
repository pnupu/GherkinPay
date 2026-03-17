use anchor_lang::prelude::*;

#[error_code]
pub enum GherkinPayError {
    #[msg("Payment is not in the expected status")]
    InvalidPaymentStatus,

    #[msg("Conditions are already finalized")]
    ConditionsAlreadyFinalized,

    #[msg("Conditions are not yet finalized")]
    ConditionsNotFinalized,

    #[msg("Maximum number of conditions reached")]
    MaxConditionsReached,

    #[msg("Maximum number of signers reached")]
    MaxSignersReached,

    #[msg("Signer is not in the multisig signer list")]
    SignerNotInList,

    #[msg("Signer has already approved")]
    AlreadyApproved,

    #[msg("Condition at the given index is not the expected type")]
    ConditionTypeMismatch,

    #[msg("Condition index out of bounds")]
    ConditionIndexOutOfBounds,

    #[msg("Conditions are not met for release")]
    ConditionsNotMet,

    #[msg("Milestone is not in active status")]
    MilestoneNotActive,

    #[msg("All milestones already released")]
    AllMilestonesReleased,

    #[msg("Milestone index mismatch")]
    MilestoneIndexMismatch,

    #[msg("Milestone amounts do not sum to total amount")]
    MilestoneAmountMismatch,

    #[msg("Not all condition accounts are finalized")]
    NotAllConditionsFinalized,

    #[msg("Payment is not a milestone payment")]
    NotMilestonePayment,

    #[msg("Payment is a milestone payment; use milestone-specific instructions")]
    IsMilestonePayment,

    #[msg("Oracle price is stale")]
    OraclePriceStale,

    #[msg("Oracle price confidence too wide")]
    OracleConfidenceTooWide,

    #[msg("Relayer does not match condition")]
    RelayerMismatch,

    #[msg("Event hash does not match condition")]
    EventHashMismatch,

    #[msg("Token balance insufficient for gate")]
    TokenBalanceInsufficient,

    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,

    #[msg("Cannot cancel a completed payment")]
    CannotCancelCompleted,

    #[msg("Nothing to refund")]
    NothingToRefund,

    #[msg("Milestone count cannot be zero")]
    ZeroMilestones,

    #[msg("Exceeded maximum milestone count")]
    MaxMilestonesExceeded,
}
