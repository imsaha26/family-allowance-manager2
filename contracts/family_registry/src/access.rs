// access.rs — RBAC helpers for family_registry
// Full implementation in Phase 2.
#![allow(dead_code)]
use soroban_sdk::{Address, Env};
use crate::{errors::ContractError, storage::DataKey, types::Role};

/// Require that the caller is the contract admin.
pub fn require_admin(env: &Env, caller: &Address) -> Result<(), ContractError> {
    caller.require_auth();
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(ContractError::NotInitialized)?;
    if *caller != admin {
        return Err(ContractError::Unauthorized);
    }
    Ok(())
}

/// Require that the caller holds one of the accepted roles within a family.
///
/// Usage:
/// ```ignore
/// require_role(env, &caller, family_id, &[Role::Parent, Role::Guardian])?;
/// ```
pub fn require_role(
    env: &Env,
    caller: &Address,
    family_id: u32,
    accepted_roles: &[Role],
) -> Result<(), ContractError> {
    caller.require_auth();
    let key = DataKey::Member(family_id, caller.clone());
    let member_info: crate::types::MemberInfo = env
        .storage()
        .persistent()
        .get(&key)
        .ok_or(ContractError::MemberNotFound)?;

    if !member_info.active {
        return Err(ContractError::MemberInactive);
    }
    if !accepted_roles.contains(&member_info.role) {
        return Err(ContractError::Unauthorized);
    }
    Ok(())
}
