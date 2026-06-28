// ============================================================
// family_registry — Production Contract Implementation
// ============================================================
#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec, BytesN};

pub mod types;
pub mod storage;
pub mod events;
pub mod access;
pub mod errors;

use crate::types::{Role, FamilyGroup, MemberInfo};
use crate::storage::{DataKey, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS};
use crate::errors::ContractError;
use crate::access::{require_admin, require_role};

#[contract]
pub struct FamilyRegistryContract;

#[contractimpl]
impl FamilyRegistryContract {
    /// Initialize the contract with an administrator.
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FamilyCount, &0u32);
        
        // Extend TTL for instance storage
        env.storage().instance().extend_ttl(PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);
        
        Ok(())
    }

    /// Create a new family group. The caller becomes the admin of this family.
    pub fn create_family(env: Env, caller: Address, name: String) -> Result<u32, ContractError> {
        caller.require_auth();
        
        // Load and increment family count
        let mut count: u32 = env.storage().instance().get(&DataKey::FamilyCount).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::FamilyCount, &count);
        env.storage().instance().extend_ttl(PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Create the family group
        let family = FamilyGroup {
            id: count,
            name: name.clone(),
            admin: caller.clone(),
            created_at: env.ledger().timestamp(),
            active: true,
        };

        let fam_key = DataKey::Family(count);
        env.storage().persistent().set(&fam_key, &family);
        env.storage().persistent().extend_ttl(&fam_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Create the members list for the family
        let list_key = DataKey::FamilyMembers(count);
        let mut members = Vec::new(&env);
        members.push_back(caller.clone());
        env.storage().persistent().set(&list_key, &members);
        env.storage().persistent().extend_ttl(&list_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Add the creator as a Parent member
        let member_key = DataKey::Member(count, caller.clone());
        let member_info = MemberInfo {
            role: Role::Parent,
            spending_limit: 0, // Admin/Parents have no spending limits in registry
            savings_goal: 0,
            active: true,
            joined_at: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&member_key, &member_info);
        env.storage().persistent().extend_ttl(&member_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Emit events
        events::family_created(&env, count, caller.clone(), name);
        events::member_added(&env, count, caller);

        Ok(count)
    }

    /// Add a new member to a family group. Only Parents/Guardians can add members.
    pub fn add_member(
        env: Env,
        caller: Address,
        family_id: u32,
        member: Address,
        role: Role,
    ) -> Result<(), ContractError> {
        // Enforce authorization and parent/guardian permissions
        require_role(&env, &caller, family_id, &[Role::Parent, Role::Guardian])?;

        let fam_key = DataKey::Family(family_id);
        let family: FamilyGroup = env.storage().persistent().get(&fam_key)
            .ok_or(ContractError::FamilyNotFound)?;
        if !family.active {
            return Err(ContractError::FamilyInactive);
        }

        let member_key = DataKey::Member(family_id, member.clone());
        if env.storage().persistent().has(&member_key) {
            return Err(ContractError::MemberAlreadyExists);
        }

        // Setup default member info
        let member_info = MemberInfo {
            role,
            spending_limit: 0,
            savings_goal: 0,
            active: true,
            joined_at: env.ledger().timestamp(),
        };

        // Save member info
        env.storage().persistent().set(&member_key, &member_info);
        env.storage().persistent().extend_ttl(&member_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Append to family members list
        let list_key = DataKey::FamilyMembers(family_id);
        let mut members: Vec<Address> = env.storage().persistent().get(&list_key)
            .ok_or(ContractError::FamilyNotFound)?;
        members.push_back(member.clone());
        env.storage().persistent().set(&list_key, &members);
        env.storage().persistent().extend_ttl(&list_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Emit event
        events::member_added(&env, family_id, member);

        Ok(())
    }

    /// Remove a member from a family. Only Parents can remove members.
    pub fn remove_member(
        env: Env,
        caller: Address,
        family_id: u32,
        member: Address,
    ) -> Result<(), ContractError> {
        // Only Parents can remove members
        require_role(&env, &caller, family_id, &[Role::Parent])?;

        // Cannot remove oneself
        if caller == member {
            return Err(ContractError::Unauthorized);
        }

        let member_key = DataKey::Member(family_id, member.clone());
        let mut member_info: MemberInfo = env.storage().persistent().get(&member_key)
            .ok_or(ContractError::MemberNotFound)?;
        
        if !member_info.active {
            return Err(ContractError::MemberInactive);
        }

        // Soft delete / deactivate member
        member_info.active = false;
        env.storage().persistent().set(&member_key, &member_info);
        env.storage().persistent().extend_ttl(&member_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Emit event
        events::member_removed(&env, family_id, member);

        Ok(())
    }

    /// Update a member's spending limit and savings goal. Parents/Guardians only.
    pub fn update_member_limits(
        env: Env,
        caller: Address,
        family_id: u32,
        member: Address,
        spending_limit: i128,
        savings_goal: i128,
    ) -> Result<(), ContractError> {
        require_role(&env, &caller, family_id, &[Role::Parent, Role::Guardian])?;

        if spending_limit < 0 || savings_goal < 0 {
            return Err(ContractError::InvalidAmount);
        }

        let member_key = DataKey::Member(family_id, member.clone());
        let mut member_info: MemberInfo = env.storage().persistent().get(&member_key)
            .ok_or(ContractError::MemberNotFound)?;

        if !member_info.active {
            return Err(ContractError::MemberInactive);
        }

        member_info.spending_limit = spending_limit;
        member_info.savings_goal = savings_goal;

        env.storage().persistent().set(&member_key, &member_info);
        env.storage().persistent().extend_ttl(&member_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Emit event
        events::limits_updated(&env, family_id, member, spending_limit);

        Ok(())
    }

    /// Change a member's role. Parents only.
    pub fn change_member_role(
        env: Env,
        caller: Address,
        family_id: u32,
        member: Address,
        new_role: Role,
    ) -> Result<(), ContractError> {
        require_role(&env, &caller, family_id, &[Role::Parent])?;

        let member_key = DataKey::Member(family_id, member.clone());
        let mut member_info: MemberInfo = env.storage().persistent().get(&member_key)
            .ok_or(ContractError::MemberNotFound)?;

        if !member_info.active {
            return Err(ContractError::MemberInactive);
        }

        member_info.role = new_role;

        env.storage().persistent().set(&member_key, &member_info);
        env.storage().persistent().extend_ttl(&member_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Emit event
        events::role_changed(&env, family_id, member);

        Ok(())
    }

    /// Check if an address is an active member of a family.
    pub fn is_member(env: Env, family_id: u32, member: Address) -> bool {
        let member_key = DataKey::Member(family_id, member);
        if let Some(info) = env.storage().persistent().get::<_, MemberInfo>(&member_key) {
            info.active
        } else {
            false
        }
    }

    /// Retrieve a member's info.
    pub fn get_member_info(env: Env, family_id: u32, member: Address) -> Result<MemberInfo, ContractError> {
        let member_key = DataKey::Member(family_id, member);
        env.storage().persistent().get(&member_key)
            .ok_or(ContractError::MemberNotFound)
    }

    /// Retrieve a family group's metadata.
    pub fn get_family(env: Env, family_id: u32) -> Result<FamilyGroup, ContractError> {
        let fam_key = DataKey::Family(family_id);
        env.storage().persistent().get(&fam_key)
            .ok_or(ContractError::FamilyNotFound)
    }

    /// Retrieve all registered member addresses of a family group.
    pub fn get_family_members(env: Env, family_id: u32) -> Result<Vec<Address>, ContractError> {
        let list_key = DataKey::FamilyMembers(family_id);
        env.storage().persistent().get(&list_key)
            .ok_or(ContractError::FamilyNotFound)
    }

    /// Deactivate a family group. Parents only.
    pub fn archive_family(env: Env, caller: Address, family_id: u32) -> Result<(), ContractError> {
        require_role(&env, &caller, family_id, &[Role::Parent])?;

        let fam_key = DataKey::Family(family_id);
        let mut family: FamilyGroup = env.storage().persistent().get(&fam_key)
            .ok_or(ContractError::FamilyNotFound)?;

        if !family.active {
            return Err(ContractError::FamilyInactive);
        }

        family.active = false;
        env.storage().persistent().set(&fam_key, &family);
        env.storage().persistent().extend_ttl(&fam_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        Ok(())
    }

    /// Upgrade the contract WASM. Only the contract administrator can call this.
    pub fn upgrade(env: Env, caller: Address, new_wasm_hash: BytesN<32>) -> Result<(), ContractError> {
        require_admin(&env, &caller)?;
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}

#[cfg(test)]
mod test;
