// storage.rs — Storage key definitions for family_registry
// Full implementation in Phase 2.
#![allow(dead_code)]
use soroban_sdk::{contracttype, Address};

/// Enum of all storage keys used by the registry contract.
/// Uses Soroban's three-tier storage model:
///   - Instance  → rarely-changing data (admin, counters)
///   - Persistent → long-lived family/member records (TTL bumped)
///   - Temporary  → short-lived session data
#[contracttype]
#[derive(Clone, Debug)]
pub enum DataKey {
    // Instance storage keys
    Admin,
    FamilyCount,

    // Persistent storage keys
    Family(u32),
    FamilyMembers(u32),
    Member(u32, Address),
}

/// Minimum TTL extension for persistent entries (approx. 1 year in ledgers).
/// At ~5 seconds per ledger: 365 * 24 * 3600 / 5 ≈ 6_311_520 ledgers.
pub const PERSISTENT_TTL_LEDGERS: u32 = 6_311_520;
/// Bump threshold — extend when remaining TTL drops below this.
pub const PERSISTENT_BUMP_THRESHOLD: u32 = 518_400; // ~30 days
