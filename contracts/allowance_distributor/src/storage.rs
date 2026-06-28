// storage.rs — Storage key definitions for allowance_distributor
// Full implementation in Phase 2.
#![allow(dead_code)]
use soroban_sdk::{contracttype, Address};

/// Enum of all storage keys used by the distributor contract.
#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    // Instance storage (rarely-changing metadata)
    Admin,
    RegistryContract,
    TokenContract,
    ScheduleCount,
    PaymentCount,

    // Persistent storage — schedule records
    Schedule(u32),
    FamilySchedules(u32),

    // Persistent storage — payment records
    Payment(u32),
    MemberPayments(u32, Address), // (family_id, member_addr)
    FamilyPayments(u32),          // family_id

    // Last distribution ledger per schedule (for frequency enforcement)
    LastDistribution(u32), // schedule_id
}

/// Minimum TTL for persistent entries (~1 year in ledgers).
pub const PERSISTENT_TTL_LEDGERS: u32 = 6_311_520;
/// Bump threshold (~30 days).
pub const PERSISTENT_BUMP_THRESHOLD: u32 = 518_400;

/// Ledger distance constants for distribution windows.
/// Daily  ≈ 17_280 ledgers (5s/ledger × 86_400s)
/// Weekly ≈ 120_960 ledgers
/// Monthly ≈ 518_400 ledgers (30 days)
pub const LEDGERS_PER_DAY: u32 = 17_280;
pub const LEDGERS_PER_WEEK: u32 = 120_960;
pub const LEDGERS_PER_MONTH: u32 = 518_400;
