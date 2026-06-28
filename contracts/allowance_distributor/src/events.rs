// events.rs — Event emission helpers for allowance_distributor
// Full implementation in Phase 2.
#![allow(dead_code)]
use soroban_sdk::{symbol_short, Address, Env};

/// Emitted when a new allowance schedule is created.
pub fn allowance_scheduled(env: &Env, schedule_id: u32, family_id: u32, member: Address, amount: i128) {
    env.events().publish(
        (symbol_short!("sch_new"), schedule_id),
        (family_id, member, amount),
    );
}

/// Emitted when an allowance is successfully distributed.
pub fn allowance_distributed(env: &Env, payment_id: u32, schedule_id: u32, member: Address, amount: i128) {
    env.events().publish(
        (symbol_short!("pay_ok"), payment_id),
        (schedule_id, member, amount),
    );
}

/// Emitted when a distribution attempt fails.
pub fn payment_failed(env: &Env, schedule_id: u32, member: Address) {
    env.events().publish(
        (symbol_short!("pay_err"), schedule_id),
        member,
    );
}

/// Emitted when a schedule is updated (amount / frequency change).
pub fn schedule_updated(env: &Env, schedule_id: u32) {
    env.events().publish(
        (symbol_short!("sch_upd"), schedule_id),
        (),
    );
}

/// Emitted when a schedule is cancelled.
pub fn schedule_cancelled(env: &Env, schedule_id: u32) {
    env.events().publish(
        (symbol_short!("sch_can"), schedule_id),
        (),
    );
}
