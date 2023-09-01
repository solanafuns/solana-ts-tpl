use solana_program::{
    account_info::AccountInfo, entrypoint, entrypoint::ProgramResult, pubkey::Pubkey,
};

use crate::{basic_pda, pda_vault};

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    basic_pda::process_instruction(program_id, accounts, instruction_data)?;
    pda_vault::process_instruction(program_id, accounts, instruction_data)?;
    Ok(())
}
