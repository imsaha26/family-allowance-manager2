// events.rs — Event emission helpers for family_registry
// Full implementation in Phase 2.
#![allow(dead_code)]
use soroban_sdk::{symbol_short, Address, Env, String};

/// Emitted when a new family group is created.
pub fn family_created(env: &Env, family_id: u32, admin: Address, name: String) {
    env.events().publish(
        (symbol_short!("fam_new"), family_id),
        (admin, name),
    );
}

/// Emitted when a member is added to a family.
pub fn member_added(env: &Env, family_id: u32, member: Address) {
    env.events().publish(
        (symbol_short!("mem_add"), family_id),
        member,
    );
}

/// Emitted when a member is removed from a family.
pub fn member_removed(env: &Env, family_id: u32, member: Address) {
    env.events().publish(
        (symbol_short!("mem_rem"), family_id),
        member,
    );
}

/// Emitted when a member's spending limit or savings goal is updated.
pub fn limits_updated(env: &Env, family_id: u32, member: Address, spending_limit: i128) {
    env.events().publish(
        (symbol_short!("lim_upd"), family_id),
        (member, spending_limit),
    );
}

/// Emitted when a member's role changes.
pub fn role_changed(env: &Env, family_id: u32, member: Address) {
    env.events().publish(
        (symbol_short!("rol_chg"), family_id),
        member,
    );
}
