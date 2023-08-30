use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    pubkey::Pubkey,
    system_instruction::{self},
    sysvar::{rent::Rent, Sysvar},
};

entrypoint!(process_instruction);
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let account_info_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();
    let signer = next_account_info(account_info_iter)?;
    let pda_account: &AccountInfo<'_> = next_account_info(account_info_iter)?;
    let system_account = next_account_info(account_info_iter)?;
    let action = std::str::from_utf8(instruction_data).unwrap();

    let (pda, bump_seed) =
        Pubkey::find_program_address(&[signer.key.as_ref(), b"pda-account"], program_id);
    msg!(
        "do pda account operate : {} , {}",
        pda.to_string(),
        bump_seed
    );

    {
        if pda_account.data_is_empty() {
            msg!("pda account is empty, create it!");
            const PDA_SPACE: usize = 64;

            // 计算所需的租金
            let rent = Rent::get()?;
            let rent_lamports: u64 = rent.minimum_balance(PDA_SPACE);

            // 创建账户
            invoke_signed(
                &system_instruction::create_account(
                    signer.key,
                    pda_account.key,
                    rent_lamports,
                    PDA_SPACE.try_into().unwrap(),
                    program_id,
                ),
                &[signer.clone(), pda_account.clone(), system_account.clone()],
                &[&[signer.key.as_ref(), b"pda-account", &[bump_seed]]],
            )?;
        } else {
            msg!("pda account is not empty, do something!");
        }
    }

    match action {
        "transfer" => {
            msg!("transfer from pda account");
        }
        "hello" => {
            msg!("say hello world !!!");
        }
        _ => {
            let mut data_mut = pda_account.try_borrow_mut_data()?;
            data_mut[..instruction_data.len()].copy_from_slice(instruction_data);
            msg!("pda lamports : {:?}", pda_account.lamports());
        }
    }

    let mut data_mut = pda_account.try_borrow_mut_data()?;
    data_mut[..instruction_data.len()].copy_from_slice(instruction_data);

    Ok(())
}
