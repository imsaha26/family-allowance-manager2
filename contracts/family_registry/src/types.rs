// types.rs — Data types for family_registry
// Full implementation in Phase 2.
#![allow(dead_code)]
use soroban_sdk::{contracttype, Address, String};

/// Member role within a family group.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Role {
    Parent,
    Guardian,
    Child,
}

/// A family group record stored on-chain.
#[contracttype]
#[derive(Clone, Debug)]
pub struct FamilyGroup {
    pub id: u32,
    pub name: String,
    pub admin: Address,
    pub created_at: u64,
    pub active: bool,
}

/// Per-member information stored in the registry.
#[contracttype]
#[derive(Clone, Debug)]
pub struct MemberInfo {
    pub role: Role,
    pub spending_limit: i128,
    pub savings_goal: i128,
    pub active: bool,
    pub joined_at: u64,
}
