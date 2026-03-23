use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PaymentAgreement {
    pub payment_id: u64,
    pub authority: Pubkey,
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub token_mint: Pubkey,
    pub escrow_token_account: Pubkey,
    pub total_amount: u64,
    pub released_amount: u64,
    pub status: PaymentStatus,
    pub is_milestone: bool,
    pub milestone_count: u8,
    pub current_milestone: u8,
    pub created_at: i64,
    pub bump: u8,
    pub escrow_bump: u8,
    #[max_len(200)]
    pub metadata_uri: String,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum PaymentStatus {
    Created,
    Active,
    Completed,
    Cancelled,
}
