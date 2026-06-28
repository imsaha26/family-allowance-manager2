// errors.rs — ContractError enum for family_registry
#![allow(dead_code)]
use soroban_sdk::contracterror;

/// All error codes returned by the family_registry contract.
/// Using `contracterror` macro so errors are surfaced as XDR error codes.
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    // Initialization
    AlreadyInitialized = 1,
    NotInitialized = 2,

    // Authorization
    Unauthorized = 3,

    // Family errors
    FamilyNotFound = 4,
    FamilyAlreadyExists = 5,
    FamilyInactive = 6,

    // Member errors
    MemberNotFound = 7,
    MemberAlreadyExists = 8,
    MemberInactive = 9,

    // Validation
    InvalidName = 10,
    InvalidAmount = 11,

    // Upgrade
    InvalidWasmHash = 12,
}
