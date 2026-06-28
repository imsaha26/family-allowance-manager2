// ============================================================
// registry_interface — Type-Safe Interface to family_registry
// ============================================================
use soroban_sdk::{contractclient, Address, Env};

#[soroban_sdk::contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Role {
    Parent,
    Guardian,
    Child,
}

/// Type-safe copy of MemberInfo matching family_registry exactly
#[soroban_sdk::contracttype]
#[derive(Clone, Debug)]
pub struct MemberInfo {
    pub role: Role,
    pub spending_limit: i128,
    pub savings_goal: i128,
    pub active: bool,
    pub joined_at: u64,
}

#[contractclient(name = "FamilyRegistryClient")]
pub trait FamilyRegistryInterface {
    fn is_member(env: Env, family_id: u32, member: Address) -> bool;
    fn get_member_info(env: Env, family_id: u32, member: Address) -> Result<MemberInfo, soroban_sdk::Val>;
}
