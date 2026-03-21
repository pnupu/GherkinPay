use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::token_interface::Mint;
use spl_tlv_account_resolution::{
    account::ExtraAccountMeta, seeds::Seed, state::ExtraAccountMetaList,
};
use spl_transfer_hook_interface::instruction::{ExecuteInstruction, TransferHookInstruction};

declare_id!("5AfrRNNaFgByD3fxxFf6nieeM4B516hTvcK6xvPEVkJC");

#[account]
#[derive(InitSpace)]
pub struct ComplianceEntry {
    pub is_allowed: bool,
    pub bump: u8,
}

#[error_code]
pub enum HookError {
    #[msg("Sender is not on the compliance allowlist")]
    SenderNotCompliant,
    #[msg("Receiver is not on the compliance allowlist")]
    ReceiverNotCompliant,
}

#[program]
pub mod gherkin_pay_hook {
    use super::*;

    pub fn initialize_extra_account_meta_list(
        ctx: Context<InitializeExtraAccountMetaList>,
    ) -> Result<()> {
        let extra_account_metas = [
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal {
                        bytes: b"compliance".to_vec(),
                    },
                    Seed::AccountKey { index: 1 }, // mint
                    Seed::AccountKey { index: 0 }, // source
                ],
                false,
                false,
            )
            .unwrap(),
            ExtraAccountMeta::new_with_seeds(
                &[
                    Seed::Literal {
                        bytes: b"compliance".to_vec(),
                    },
                    Seed::AccountKey { index: 1 }, // mint
                    Seed::AccountKey { index: 2 }, // destination
                ],
                false,
                false,
            )
            .unwrap(),
        ];

        let account_size = ExtraAccountMetaList::size_of(extra_account_metas.len()).unwrap();
        let lamports = Rent::get()?.minimum_balance(account_size);

        let mint_key = ctx.accounts.mint.key();
        let signer_seeds: &[&[u8]] = &[b"extra-account-metas", mint_key.as_ref()];
        let (_, bump) = Pubkey::find_program_address(signer_seeds, ctx.program_id);
        let signer_seeds_with_bump: &[&[u8]] =
            &[b"extra-account-metas", mint_key.as_ref(), &[bump]];

        system_program::create_account(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::CreateAccount {
                    from: ctx.accounts.payer.to_account_info(),
                    to: ctx.accounts.extra_account_meta_list.to_account_info(),
                },
                &[signer_seeds_with_bump],
            ),
            lamports,
            account_size as u64,
            ctx.program_id,
        )?;

        ExtraAccountMetaList::init::<ExecuteInstruction>(
            &mut ctx
                .accounts
                .extra_account_meta_list
                .try_borrow_mut_data()?,
            &extra_account_metas,
        )?;

        Ok(())
    }

    pub fn transfer_hook(ctx: Context<TransferHook>, _amount: u64) -> Result<()> {
        let source_compliance_info = &ctx.accounts.source_compliance;
        let dest_compliance_info = &ctx.accounts.destination_compliance;

        if !source_compliance_info.data_is_empty() {
            let source_data = source_compliance_info.try_borrow_data()?;
            if source_data.len() >= 9 {
                let is_allowed = source_data[8] != 0;
                require!(is_allowed, HookError::SenderNotCompliant);
            }
        }

        if !dest_compliance_info.data_is_empty() {
            let dest_data = dest_compliance_info.try_borrow_data()?;
            if dest_data.len() >= 9 {
                let is_allowed = dest_data[8] != 0;
                require!(is_allowed, HookError::ReceiverNotCompliant);
            }
        }

        Ok(())
    }

    pub fn set_compliance(ctx: Context<SetCompliance>, is_allowed: bool) -> Result<()> {
        let entry = &mut ctx.accounts.compliance_entry;
        entry.is_allowed = is_allowed;
        entry.bump = ctx.bumps.compliance_entry;
        Ok(())
    }

    pub fn fallback<'info>(
        program_id: &Pubkey,
        accounts: &'info [AccountInfo<'info>],
        data: &[u8],
    ) -> Result<()> {
        let instruction = TransferHookInstruction::unpack(data)?;
        match instruction {
            TransferHookInstruction::Execute { amount } => {
                let amount_bytes = amount.to_le_bytes();
                __private::__global::transfer_hook(program_id, accounts, &amount_bytes)
            }
            _ => Err(ProgramError::InvalidInstructionData.into()),
        }
    }
}

#[derive(Accounts)]
pub struct InitializeExtraAccountMetaList<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: PDA validated by seeds
    #[account(
        mut,
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferHook<'info> {
    /// CHECK: source token account, validated by Token-2022
    pub source_token: UncheckedAccount<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: destination token account, validated by Token-2022
    pub destination_token: UncheckedAccount<'info>,

    /// CHECK: source authority, validated by Token-2022
    pub owner: UncheckedAccount<'info>,

    /// CHECK: ExtraAccountMetaList PDA
    #[account(
        seeds = [b"extra-account-metas", mint.key().as_ref()],
        bump,
    )]
    pub extra_account_meta_list: UncheckedAccount<'info>,

    /// CHECK: Source wallet compliance PDA — may or may not exist
    pub source_compliance: UncheckedAccount<'info>,

    /// CHECK: Destination wallet compliance PDA — may or may not exist
    pub destination_compliance: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(is_allowed: bool)]
pub struct SetCompliance<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: InterfaceAccount<'info, Mint>,

    /// CHECK: The wallet to set compliance for
    pub wallet: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + ComplianceEntry::INIT_SPACE,
        seeds = [b"compliance", mint.key().as_ref(), wallet.key().as_ref()],
        bump,
    )]
    pub compliance_entry: Account<'info, ComplianceEntry>,

    pub system_program: Program<'info, System>,
}
