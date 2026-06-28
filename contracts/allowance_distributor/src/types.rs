// types.rs — Data types for allowance_distributor
// Full implementation in Phase 2.
#![allow(dead_code)]
use soroban_sdk::{contracttype, Address};

/// How often an allowance is distributed.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ScheduleFrequency {
    Daily,
    Weekly,
    Monthly,
}

/// Status of a single payment record.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Processing,
    Confirmed,
    Failed,
}

/// An allowance schedule configured by a parent/guardian.
#[contracttype]
#[derive(Clone, Debug)]
pub struct AllowanceSchedule {
    pub id: u32,
    pub family_id: u32,
    pub member: Address,
    pub amount: i128,
    pub frequency: ScheduleFrequency,
    /// The ledger sequence at which the first distribution becomes valid.
    pub start_ledger: u32,
    pub active: bool,
    pub created_by: Address,
}

/// An immutable on-chain payment record created after each distribution.
#[contracttype]
#[derive(Clone, Debug)]
pub struct PaymentRecord {
    pub id: u32,
    pub schedule_id: u32,
    pub family_id: u32,
    pub member: Address,
    pub amount: i128,
    pub status: PaymentStatus,
    /// Ledger sequence at the time of the distribution.
    pub ledger: u32,
    pub timestamp: u64,
}
