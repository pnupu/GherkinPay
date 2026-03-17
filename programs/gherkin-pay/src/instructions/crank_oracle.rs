use anchor_lang::prelude::*;

use crate::error::GherkinPayError;
use crate::events::ConditionMet;
use crate::state::*;

pub const MAX_PRICE_AGE_SECS: i64 = 60;

#[derive(AnchorSerialize, AnchorDeserialize)]
struct PythPriceData {
    pub price: i64,
    pub conf: u64,
    pub publish_time: i64,
}

fn parse_pyth_price(data: &[u8]) -> Option<PythPriceData> {
    // Pyth V2 price feed account layout (simplified):
    // The price update V2 account has header bytes followed by price data.
    // We look for the price at standard offsets.
    // For Pyth pull-based price accounts (PriceUpdateV2):
    //   discriminator: 8 bytes
    //   write_authority: 32 bytes
    //   verification_level: 1 byte
    //   price_message (PriceFeedMessage):
    //     feed_id: 32 bytes
    //     price: i64 (8 bytes) @ offset 73
    //     conf: u64 (8 bytes) @ offset 81
    //     exponent: i32 (4 bytes) @ offset 89
    //     publish_time: i64 (8 bytes) @ offset 93
    //     ...
    // Total minimum: 101 bytes
    if data.len() < 101 {
        return None;
    }
    let price = i64::from_le_bytes(data[73..81].try_into().ok()?);
    let conf = u64::from_le_bytes(data[81..89].try_into().ok()?);
    let publish_time = i64::from_le_bytes(data[93..101].try_into().ok()?);
    Some(PythPriceData {
        price,
        conf,
        publish_time,
    })
}

fn extract_feed_id(data: &[u8]) -> Option<[u8; 32]> {
    if data.len() < 73 {
        return None;
    }
    let mut feed_id = [0u8; 32];
    feed_id.copy_from_slice(&data[41..73]);
    Some(feed_id)
}

#[derive(Accounts)]
#[instruction(condition_index: u8)]
pub struct CrankOracle<'info> {
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

    /// CHECK: Pyth price feed account — data is parsed manually
    pub price_feed: UncheckedAccount<'info>,
}

pub fn handle_crank_oracle(ctx: Context<CrankOracle>, condition_index: u8) -> Result<()> {
    let cond = &mut ctx.accounts.condition_account;
    let idx = condition_index as usize;
    let condition = &mut cond.conditions[idx];

    match condition {
        Condition::Oracle {
            feed_account,
            operator,
            target_value,
            met,
            ..
        } => {
            if *met {
                return Ok(());
            }

            let price_feed_data = ctx.accounts.price_feed.try_borrow_data()?;

            let feed_id = extract_feed_id(&price_feed_data)
                .ok_or(GherkinPayError::OraclePriceStale)?;
            require!(
                feed_id == feed_account.to_bytes(),
                GherkinPayError::ConditionTypeMismatch
            );

            let price_data = parse_pyth_price(&price_feed_data)
                .ok_or(GherkinPayError::OraclePriceStale)?;

            let clock = Clock::get()?;
            require!(
                clock.unix_timestamp - price_data.publish_time <= MAX_PRICE_AGE_SECS,
                GherkinPayError::OraclePriceStale
            );

            require!(
                (price_data.conf as i64) <= (price_data.price.abs() / 20).max(1),
                GherkinPayError::OracleConfidenceTooWide
            );

            if operator.evaluate(price_data.price, *target_value) {
                *met = true;

                emit!(ConditionMet {
                    payment: ctx.accounts.payment.key(),
                    milestone_index: cond.milestone_index,
                    condition_index,
                    condition_type: "Oracle".to_string(),
                });
            }
        }
        _ => return Err(GherkinPayError::ConditionTypeMismatch.into()),
    }

    Ok(())
}
