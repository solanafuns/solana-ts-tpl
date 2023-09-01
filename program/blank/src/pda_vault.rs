use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    pubkey::Pubkey,
    system_instruction,
};

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    const VAULT_SEED: &[u8] = b"creatordao-pda-vault";
    let account_info_iter: &mut std::slice::Iter<'_, AccountInfo<'_>> = &mut accounts.iter();
    let signer = next_account_info(account_info_iter)?;
    let pda_vault: &AccountInfo<'_> = next_account_info(account_info_iter)?;
    let system_account = next_account_info(account_info_iter)?;

    let (pda, bump_seed) = Pubkey::find_program_address(&[VAULT_SEED], program_id);

    if pda == *pda_vault.key {
        msg!("do pda vault operate : {} , {}", pda.to_string(), bump_seed);
        let action = std::str::from_utf8(instruction_data).unwrap();
        match action {
            "init" => {
                msg!("init vault{}", pda_vault.key.to_string());
                let vault_blance = **pda_vault.lamports.borrow();

                msg!("pda vault blance : {}", vault_blance);

                if vault_blance == 0 {
                    msg!("pda vault is empty, create it!");
                    let rent_lamports: u64 = 3_000_000_000;
                    // 创建账户
                    invoke_signed(
                        &system_instruction::create_account(
                            &signer.key.clone(),
                            &pda_vault.key.clone(),
                            rent_lamports,
                            0,
                            program_id,
                        ),
                        &[signer.clone(), pda_vault.clone(), system_account.clone()],
                        &[&[VAULT_SEED, &[bump_seed]]],
                    )?;
                } else {
                    msg!("checking pda vault blance: {}", vault_blance);

                    if vault_blance <= 3_000_000_000 {
                        msg!("pda vault blance is not enough, transfer 3 sol to it!");
                        invoke_signed(
                            &system_instruction::transfer(signer.key, pda_vault.key, 2_000_000_000),
                            &[signer.clone(), pda_vault.clone(), system_account.clone()],
                            &[&[signer.key.as_ref(), VAULT_SEED, &[bump_seed]]],
                        )?;
                    }
                }
            }
            "transfer" => {
                msg!("transfer sol from vault to signer!!!");
                let amount: u64 = 10_000_000;
                **pda_vault.lamports.borrow_mut() -= amount;
                **signer.lamports.borrow_mut() += amount;
            }
            _ => {
                msg!("unknown action : {}", action);
            }
        }
    }

    Ok(())
}
