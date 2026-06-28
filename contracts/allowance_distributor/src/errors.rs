// errors.rs — ContractError enum for allowance_distributor
#![allow(dead_code)]
use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    // Initialization
    AlreadyInitialized = 1,
    NotInitialized = 2,

    // Authorization
    Unauthorized = 3,

    // Schedule errors
    ScheduleNotFound = 4,
    ScheduleInactive = 5,
    ScheduleAlreadyExists = 6,

    // Distribution errors
    DistributionNotDue = 7,
    ExceedsSpendingLimit = 8,
    InsufficientContractBalance = 9,
    TransferFailed = 10,

    // Member / registry errors
    MemberNotFound = 11,
    MemberInactive = 12,
    InvalidRole = 13,

    // Validation
    InvalidAmount = 14,
    InvalidFrequency = 15,

    // Cross-contract call errors
    RegistryCallFailed = 16,

    // Upgrade
    InvalidWasmHash = 17,
}
