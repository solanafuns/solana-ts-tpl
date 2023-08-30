use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
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

    let (pda, bump_seed) =
        Pubkey::find_program_address(&[signer.key.as_ref(), b"pda-account"], program_id);
    msg!(
        "do pda account operate : {} , {}",
        pda.to_string(),
        bump_seed
    );

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
    }

    let action = std::str::from_utf8(instruction_data).unwrap();
    match action {
        "realloc" => {
            // 扩展空间需要租金
            let data_size = pda_account.data.borrow().len();
            msg!("transfer realloc pda account");
            msg!("current size : {}", data_size);
            let new_size: usize = data_size + 32;
            msg!("new size : {}", new_size);

            let rent = Rent::get()?;
            let new_minimum_balance = rent.minimum_balance(new_size);
            let lamports_diff = new_minimum_balance.saturating_sub(pda_account.lamports());
            match invoke(
                &system_instruction::transfer(signer.key, pda_account.key, lamports_diff),
                &[signer.clone(), pda_account.clone(), system_account.clone()],
            ) {
                Err(err) => {
                    msg!("invoke error : {:?}", err);
                }
                Ok(_) => {
                    msg!("invoke success");
                    // 扩展存储空间
                    match pda_account.realloc(new_size, true) {
                        Err(err) => {
                            msg!("realloc error : {:?}", err);
                        }
                        Ok(_) => {
                            msg!("realloc success");
                        }
                    };
                }
            }
        }
        // 关闭pda 账户，清空数据，将lamports转移给签名账户
        "close" => {
            let dest_starting_lamports = signer.lamports();
            **signer.lamports.borrow_mut() = dest_starting_lamports
                .checked_add(pda_account.lamports())
                .unwrap();
            **pda_account.lamports.borrow_mut() = 0;
            let mut source_data: std::cell::RefMut<'_, &mut [u8]> = pda_account.data.borrow_mut();
            source_data.fill(0);
        }
        "hello" => {
            msg!("hello world")
        }
        _ => {
            let mut data_mut = pda_account.try_borrow_mut_data()?;
            data_mut[..instruction_data.len()].copy_from_slice(instruction_data);
            msg!("pda lamports : {:?}", pda_account.lamports());
        }
    }

    let mut data_mut: std::cell::RefMut<'_, &mut [u8]> = pda_account.try_borrow_mut_data()?;
    data_mut[..instruction_data.len()].copy_from_slice(instruction_data);

    Ok(())
}
