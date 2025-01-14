use borsh::BorshSerialize;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    program::invoke_signed,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::Sysvar,
};

use crate::state::PageVisits;

pub fn create_page_visits(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    page_visits: PageVisits,
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let page_visits_account = next_account_info(accounts_iter)?;
    let user = next_account_info(accounts_iter)?;
    let payer = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    let account_span = (page_visits.try_to_vec()?).len();
    let lamports_required = (Rent::get()?).minimum_balance(account_span);

    invoke_signed(
        &system_instruction::create_account(
            payer.key,
            page_visits_account.key,
            lamports_required,
            account_span as u64,
            program_id,
        ),
        &[
            payer.clone(),
            page_visits_account.clone(),
            system_program.clone(),
        ],
        &[&[
            PageVisits::SEED_PREFIX.as_bytes(),
            user.key.as_ref(),
            &[page_visits.bump],
        ]],
    )?;

    Ok(())
}
