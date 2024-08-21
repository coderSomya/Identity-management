use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack, Sealed},
    pubkey::Pubkey,
    system_program,
    sysvar::{rent::Rent, Sysvar},
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct IdentityAccount {
    pub address: Pubkey,
    pub name: String,
}

/// Main structure to hold the global map
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct IdentityState {
    pub identities: Vec<IdentityAccount>,
}

impl IdentityState {
    pub fn new() -> Self {
        Self {
            identities: Vec::new(),
        }
    }

    pub fn set_name(&mut self, address: Pubkey, name: String) -> ProgramResult {
        for identity in self.identities.iter_mut() {
            if identity.address == address {
                identity.name = name;
                return Ok(());
            }
        }

        self.identities.push(IdentityAccount { address, name });
        Ok(())
    }

    pub fn get_name(&self, address: Pubkey) -> Option<&String> {
        self.identities
            .iter()
            .find(|identity| identity.address == address)
            .map(|identity| &identity.name)
    }
}

/// Define the entry point for the contract
entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let user_account = next_account_info(accounts_iter)?;
    let system_program_account = next_account_info(accounts_iter)?;

    // Ensure the user account is a signer
    if !user_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Deserialize instruction data to get the name
    let new_name = String::try_from_slice(instruction_data)?;

    // Deserialize the state
    let identity_account = next_account_info(accounts_iter)?;
    let mut identity_data = if identity_account.data_is_empty() {
        IdentityState::new()
    } else {
        IdentityState::try_from_slice(&identity_account.data.borrow())?
    };

    // Ensure the system program is the correct one
    if *system_program_account.key != system_program::ID {
        return Err(ProgramError::IncorrectProgramId);
    }

    // Update the name for the user's address
    identity_data.set_name(*user_account.key, new_nickname)?;

    // Serialize and save the state back to the account
    identity_data.serialize(&mut &mut identity_account.data.borrow_mut()[..])?;

    msg!("name updated successfully!");

    Ok(())
}
