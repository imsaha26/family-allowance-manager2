// ============================================================
// allowance_distributor — Production Contract Implementation
// ============================================================
#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Vec, BytesN};

pub mod types;
pub mod storage;
pub mod events;
pub mod errors;
pub mod registry_interface;

use crate::types::{ScheduleFrequency, PaymentStatus, AllowanceSchedule, PaymentRecord};
use crate::storage::{DataKey, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS, LEDGERS_PER_DAY, LEDGERS_PER_WEEK, LEDGERS_PER_MONTH};
use crate::errors::ContractError;
use crate::registry_interface::{FamilyRegistryClient, Role};

#[contract]
pub struct AllowanceDistributorContract;

#[contractimpl]
impl AllowanceDistributorContract {
    /// Initialize the contract with configuration details.
    pub fn initialize(
        env: Env,
        admin: Address,
        registry_contract: Address,
        token_contract: Address,
    ) -> Result<(), ContractError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(ContractError::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::RegistryContract, &registry_contract);
        env.storage().instance().set(&DataKey::TokenContract, &token_contract);
        env.storage().instance().set(&DataKey::ScheduleCount, &0u32);
        env.storage().instance().set(&DataKey::PaymentCount, &0u32);

        env.storage().instance().extend_ttl(PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);
        Ok(())
    }

    /// Create a new allowance schedule. Only Parents/Guardians in the family group can call this.
    pub fn create_schedule(
        env: Env,
        caller: Address,
        family_id: u32,
        member: Address,
        amount: i128,
        frequency: ScheduleFrequency,
        start_ledger: u32,
    ) -> Result<u32, ContractError> {
        caller.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        // Validate caller holds Parent or Guardian role in the registry contract
        let registry_addr: Address = env.storage().instance().get(&DataKey::RegistryContract)
            .ok_or(ContractError::NotInitialized)?;
        let registry_client = FamilyRegistryClient::new(&env, &registry_addr);

        let caller_info = registry_client.get_member_info(&family_id, &caller);

        if !caller_info.active || (caller_info.role != Role::Parent && caller_info.role != Role::Guardian) {
            return Err(ContractError::Unauthorized);
        }

        // Validate recipient is a member of the family
        let member_info = registry_client.get_member_info(&family_id, &member);
        if !member_info.active {
            return Err(ContractError::MemberInactive);
        }

        // Increment schedule count
        let mut count: u32 = env.storage().instance().get(&DataKey::ScheduleCount).unwrap_or(0);
        count += 1;
        env.storage().instance().set(&DataKey::ScheduleCount, &count);
        env.storage().instance().extend_ttl(PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Save schedule details
        let schedule = AllowanceSchedule {
            id: count,
            family_id,
            member: member.clone(),
            amount,
            frequency: frequency.clone(),
            start_ledger,
            active: true,
            created_by: caller.clone(),
        };

        let schedule_key = DataKey::Schedule(count);
        env.storage().persistent().set(&schedule_key, &schedule);
        env.storage().persistent().extend_ttl(&schedule_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Initialize last distribution to start_ledger - frequency so it can be distributed immediately

        // Update family schedules list
        let fam_schedules_key = DataKey::FamilySchedules(family_id);
        let mut schedules: Vec<u32> = env.storage().persistent().get(&fam_schedules_key).unwrap_or_else(|| Vec::new(&env));
        schedules.push_back(count);
        env.storage().persistent().set(&fam_schedules_key, &schedules);
        env.storage().persistent().extend_ttl(&fam_schedules_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Emit event
        events::allowance_scheduled(&env, count, family_id, member, amount);

        Ok(count)
    }

    /// Update schedule amount and frequency. Parents/Guardians only.
    pub fn update_schedule(
        env: Env,
        caller: Address,
        schedule_id: u32,
        amount: i128,
        frequency: ScheduleFrequency,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let schedule_key = DataKey::Schedule(schedule_id);
        let mut schedule: AllowanceSchedule = env.storage().persistent().get(&schedule_key)
            .ok_or(ContractError::ScheduleNotFound)?;

        // Verify caller permissions
        let registry_addr: Address = env.storage().instance().get(&DataKey::RegistryContract)
            .ok_or(ContractError::NotInitialized)?;
        let registry_client = FamilyRegistryClient::new(&env, &registry_addr);

        let caller_info = registry_client.get_member_info(&schedule.family_id, &caller);

        if !caller_info.active || (caller_info.role != Role::Parent && caller_info.role != Role::Guardian) {
            return Err(ContractError::Unauthorized);
        }

        schedule.amount = amount;
        schedule.frequency = frequency;

        env.storage().persistent().set(&schedule_key, &schedule);
        env.storage().persistent().extend_ttl(&schedule_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        events::schedule_updated(&env, schedule_id);
        Ok(())
    }

    /// Cancel/Deactivate an allowance schedule. Parents only.
    pub fn cancel_schedule(
        env: Env,
        caller: Address,
        schedule_id: u32,
    ) -> Result<(), ContractError> {
        caller.require_auth();

        let schedule_key = DataKey::Schedule(schedule_id);
        let mut schedule: AllowanceSchedule = env.storage().persistent().get(&schedule_key)
            .ok_or(ContractError::ScheduleNotFound)?;

        if !schedule.active {
            return Err(ContractError::ScheduleInactive);
        }

        // Verify caller is a Parent
        let registry_addr: Address = env.storage().instance().get(&DataKey::RegistryContract)
            .ok_or(ContractError::NotInitialized)?;
        let registry_client = FamilyRegistryClient::new(&env, &registry_addr);

        let caller_info = registry_client.get_member_info(&schedule.family_id, &caller);

        if !caller_info.active || caller_info.role != Role::Parent {
            return Err(ContractError::Unauthorized);
        }

        schedule.active = false;
        env.storage().persistent().set(&schedule_key, &schedule);
        env.storage().persistent().extend_ttl(&schedule_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        events::schedule_cancelled(&env, schedule_id);
        Ok(())
    }

    /// Execute the distribution of a single allowance schedule.
    pub fn distribute(
        env: Env,
        caller: Address,
        schedule_id: u32,
    ) -> Result<u32, ContractError> {
        caller.require_auth();

        // Load schedule
        let schedule_key = DataKey::Schedule(schedule_id);
        let schedule: AllowanceSchedule = env.storage().persistent().get(&schedule_key)
            .ok_or(ContractError::ScheduleNotFound)?;

        if !schedule.active {
            return Err(ContractError::ScheduleInactive);
        }

        // Enforce frequency interval check (last distribution vs current ledger)
        let last_dist_key = DataKey::LastDistribution(schedule_id);
        let current_ledger = env.ledger().sequence() as u64;

        let interval = match schedule.frequency {
            ScheduleFrequency::Daily => LEDGERS_PER_DAY as u64,
            ScheduleFrequency::Weekly => LEDGERS_PER_WEEK as u64,
            ScheduleFrequency::Monthly => LEDGERS_PER_MONTH as u64,
        };

        if env.storage().persistent().has(&last_dist_key) {
            let last_dist: u64 = env.storage().persistent().get(&last_dist_key).unwrap_or(0);
            if current_ledger < last_dist + interval {
                return Err(ContractError::DistributionNotDue);
            }
        } else {
            if current_ledger < schedule.start_ledger as u64 {
                return Err(ContractError::DistributionNotDue);
            }
        }

        // Fetch registry details
        let registry_addr: Address = env.storage().instance().get(&DataKey::RegistryContract)
            .ok_or(ContractError::NotInitialized)?;
        let registry_client = FamilyRegistryClient::new(&env, &registry_addr);

        // Validate recipient is still an active child/member and hasn't exceeded spending limits
        let member_info = registry_client.get_member_info(&schedule.family_id, &schedule.member);

        if !member_info.active {
            events::payment_failed(&env, schedule_id, schedule.member);
            return Err(ContractError::MemberInactive);
        }

        if member_info.spending_limit > 0 && schedule.amount > member_info.spending_limit {
            events::payment_failed(&env, schedule_id, schedule.member);
            return Err(ContractError::ExceedsSpendingLimit);
        }

        // Load token contract
        let token_addr: Address = env.storage().instance().get(&DataKey::TokenContract)
            .ok_or(ContractError::NotInitialized)?;
        let token_client = soroban_sdk::token::Client::new(&env, &token_addr);

        let contract_addr = env.current_contract_address();
        let balance = token_client.balance(&contract_addr);
        if balance < schedule.amount {
            events::payment_failed(&env, schedule_id, schedule.member);
            return Err(ContractError::InsufficientContractBalance);
        }

        // Perform cross-contract token transfer from this contract to the child
        token_client.transfer(&contract_addr, &schedule.member, &schedule.amount);

        // Increment payment count
        let mut pay_count: u32 = env.storage().instance().get(&DataKey::PaymentCount).unwrap_or(0);
        pay_count += 1;
        env.storage().instance().set(&DataKey::PaymentCount, &pay_count);
        env.storage().instance().extend_ttl(PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Record the payment on-chain
        let record = PaymentRecord {
            id: pay_count,
            schedule_id,
            family_id: schedule.family_id,
            member: schedule.member.clone(),
            amount: schedule.amount,
            status: PaymentStatus::Confirmed,
            ledger: env.ledger().sequence(),
            timestamp: env.ledger().timestamp(),
        };

        let payment_key = DataKey::Payment(pay_count);
        env.storage().persistent().set(&payment_key, &record);
        env.storage().persistent().extend_ttl(&payment_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Update payment indexes
        let member_pays_key = DataKey::MemberPayments(schedule.family_id, schedule.member.clone());
        let mut member_pays: Vec<u32> = env.storage().persistent().get(&member_pays_key).unwrap_or_else(|| Vec::new(&env));
        member_pays.push_back(pay_count);
        env.storage().persistent().set(&member_pays_key, &member_pays);
        env.storage().persistent().extend_ttl(&member_pays_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        let fam_pays_key = DataKey::FamilyPayments(schedule.family_id);
        let mut fam_pays: Vec<u32> = env.storage().persistent().get(&fam_pays_key).unwrap_or_else(|| Vec::new(&env));
        fam_pays.push_back(pay_count);
        env.storage().persistent().set(&fam_pays_key, &fam_pays);
        env.storage().persistent().extend_ttl(&fam_pays_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Update last distribution ledger
        env.storage().persistent().set(&last_dist_key, &current_ledger);
        env.storage().persistent().extend_ttl(&last_dist_key, PERSISTENT_BUMP_THRESHOLD, PERSISTENT_TTL_LEDGERS);

        // Emit event
        events::allowance_distributed(&env, pay_count, schedule_id, schedule.member, schedule.amount);

        Ok(pay_count)
    }

    /// Distribute all schedules that are currently due in a family group.
    pub fn distribute_all_due(
        env: Env,
        caller: Address,
        family_id: u32,
    ) -> Result<Vec<u32>, ContractError> {
        caller.require_auth();

        let fam_schedules_key = DataKey::FamilySchedules(family_id);
        let schedules: Vec<u32> = env.storage().persistent().get(&fam_schedules_key).unwrap_or_else(|| Vec::new(&env));

        let mut processed_payments = Vec::new(&env);
        for schedule_id in schedules.iter() {
            // Attempt distribution. If it succeeds, capture payment ID. Otherwise, skip gracefully.
            if let Ok(pay_id) = Self::distribute(env.clone(), caller.clone(), schedule_id) {
                processed_payments.push_back(pay_id);
            }
        }

        Ok(processed_payments)
    }

    /// Retrieve details of a schedule.
    pub fn get_schedule(env: Env, schedule_id: u32) -> Result<AllowanceSchedule, ContractError> {
        let schedule_key = DataKey::Schedule(schedule_id);
        env.storage().persistent().get(&schedule_key)
            .ok_or(ContractError::ScheduleNotFound)
    }

    /// Retrieve all schedules for a family.
    pub fn get_family_schedules(env: Env, family_id: u32) -> Result<Vec<AllowanceSchedule>, ContractError> {
        let fam_schedules_key = DataKey::FamilySchedules(family_id);
        let schedule_ids: Vec<u32> = env.storage().persistent().get(&fam_schedules_key).unwrap_or_else(|| Vec::new(&env));

        let mut schedules = Vec::new(&env);
        for id in schedule_ids.iter() {
            if let Ok(schedule) = Self::get_schedule(env.clone(), id) {
                schedules.push_back(schedule);
            }
        }
        Ok(schedules)
    }

    /// Retrieve details of a payment.
    pub fn get_payment(env: Env, payment_id: u32) -> Result<PaymentRecord, ContractError> {
        let payment_key = DataKey::Payment(payment_id);
        env.storage().persistent().get(&payment_key)
            .ok_or(ContractError::ScheduleNotFound)
    }

    /// Retrieve payment history of a family member.
    pub fn get_member_payments(
        env: Env,
        family_id: u32,
        member: Address,
        limit: u32,
    ) -> Result<Vec<PaymentRecord>, ContractError> {
        let member_pays_key = DataKey::MemberPayments(family_id, member);
        let payment_ids: Vec<u32> = env.storage().persistent().get(&member_pays_key).unwrap_or_else(|| Vec::new(&env));

        let mut payments = Vec::new(&env);
        let len = payment_ids.len();
        let start = if len > limit { len - limit } else { 0 };

        for i in start..len {
            if let Some(id) = payment_ids.get(i) {
                if let Ok(record) = Self::get_payment(env.clone(), id) {
                    payments.push_back(record);
                }
            }
        }
        Ok(payments)
    }

    /// Retrieve payment history of a family group.
    pub fn get_family_payments(
        env: Env,
        family_id: u32,
        limit: u32,
    ) -> Result<Vec<PaymentRecord>, ContractError> {
        let fam_pays_key = DataKey::FamilyPayments(family_id);
        let payment_ids: Vec<u32> = env.storage().persistent().get(&fam_pays_key).unwrap_or_else(|| Vec::new(&env));

        let mut payments = Vec::new(&env);
        let len = payment_ids.len();
        let start = if len > limit { len - limit } else { 0 };

        for i in start..len {
            if let Some(id) = payment_ids.get(i) {
                if let Ok(record) = Self::get_payment(env.clone(), id) {
                    payments.push_back(record);
                }
            }
        }
        Ok(payments)
    }

    /// Upgrade the contract WASM. Only the contract administrator can call this.
    pub fn upgrade(env: Env, caller: Address, new_wasm_hash: BytesN<32>) -> Result<(), ContractError> {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&DataKey::Admin)
            .ok_or(ContractError::NotInitialized)?;
        if caller != admin {
            return Err(ContractError::Unauthorized);
        }
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}

#[cfg(test)]
mod test;
