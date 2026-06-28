// ============================================================
// allowance_distributor — Unit Tests
// ============================================================
#![cfg(test)]

extern crate std;

use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, Env, String};

use crate::types::{ScheduleFrequency, PaymentStatus};
use crate::errors::ContractError;
use crate::{AllowanceDistributorContract, AllowanceDistributorContractClient};

// Import family_registry contract client for testing setup
mod registry {
    soroban_sdk::contractimport!(
        file = "../target/wasm32v1-none/release/family_registry.wasm"
    );
}

struct TestFixture {
    env: Env,
    _admin: Address,
    parent: Address,
    child: Address,
    family_id: u32,
    _token_contract: Address,
    token_admin_client: soroban_sdk::token::StellarAssetClient<'static>,
    token_client: soroban_sdk::token::Client<'static>,
    _registry_client: registry::Client<'static>,
    distributor_client: AllowanceDistributorContractClient<'static>,
}

fn setup_test() -> TestFixture {
    let env = Env::default();
    env.mock_all_auths();
    
    let admin = Address::generate(&env);
    let parent = Address::generate(&env);
    let child = Address::generate(&env);

    // 1. Deploy & Initialize family_registry
    let registry_id = env.register_contract_wasm(None, registry::WASM);
    let registry_client = registry::Client::new(&env, &registry_id);
    registry_client.initialize(&admin);

    // Create family and add child
    let family_name = String::from_str(&env, "Smiths");
    let family_id = registry_client.create_family(&parent, &family_name);
    registry_client.add_member(&parent, &family_id, &child, &registry::Role::Child);
    registry_client.update_member_limits(&parent, &family_id, &child, &100i128, &500i128);

    // 2. Deploy Native Stellar Asset Contract (XLM)
    let token_admin = Address::generate(&env);
    let token_contract = env.register_stellar_asset_contract(token_admin.clone());
    let token_admin_client = soroban_sdk::token::StellarAssetClient::new(&env, &token_contract);
    let token_client = soroban_sdk::token::Client::new(&env, &token_contract);

    // 3. Deploy & Initialize allowance_distributor
    let distributor_id = env.register(AllowanceDistributorContract, ());
    let distributor_client = AllowanceDistributorContractClient::new(&env, &distributor_id);
    distributor_client.initialize(&admin, &registry_id, &token_contract);

    TestFixture {
        env,
        _admin: admin,
        parent,
        child,
        family_id,
        _token_contract: token_contract,
        token_admin_client,
        token_client,
        _registry_client: registry_client,
        distributor_client,
    }
}

#[test]
fn test_create_schedule() {
    let fixture = setup_test();
    let current_ledger = fixture.env.ledger().sequence();

    // Create schedule
    let schedule_id = fixture.distributor_client.create_schedule(
        &fixture.parent,
        &fixture.family_id,
        &fixture.child,
        &50i128,
        &ScheduleFrequency::Daily,
        &current_ledger,
    );

    assert_eq!(schedule_id, 1);

    // Verify schedule details
    let schedule = fixture.distributor_client.get_schedule(&schedule_id);
    assert_eq!(schedule.id, 1);
    assert_eq!(schedule.amount, 50i128);
    assert_eq!(schedule.member, fixture.child);
    assert_eq!(schedule.frequency, ScheduleFrequency::Daily);
    assert!(schedule.active);
}

#[test]
fn test_distribute_success() {
    let fixture = setup_test();
    let current_ledger = fixture.env.ledger().sequence();

    let schedule_id = fixture.distributor_client.create_schedule(
        &fixture.parent,
        &fixture.family_id,
        &fixture.child,
        &50i128,
        &ScheduleFrequency::Daily,
        &current_ledger,
    );

    // Fund the distributor contract address
    let contract_address = fixture.distributor_client.address.clone();
    fixture.token_admin_client.mint(&contract_address, &1000i128);
    assert_eq!(fixture.token_client.balance(&contract_address), 1000i128);
    assert_eq!(fixture.token_client.balance(&fixture.child), 0i128);

    // Execute distribution
    let payment_id = fixture.distributor_client.distribute(&fixture.parent, &schedule_id);
    assert_eq!(payment_id, 1);

    // Verify child balance increased
    assert_eq!(fixture.token_client.balance(&fixture.child), 50i128);
    assert_eq!(fixture.token_client.balance(&contract_address), 950i128);

    // Verify payment record
    let payment = fixture.distributor_client.get_payment(&payment_id);
    assert_eq!(payment.id, 1);
    assert_eq!(payment.amount, 50i128);
    assert_eq!(payment.status, PaymentStatus::Confirmed);
    assert_eq!(payment.member, fixture.child);
}

#[test]
fn test_distribute_too_early_fails() {
    let fixture = setup_test();
    let current_ledger = fixture.env.ledger().sequence();

    let schedule_id = fixture.distributor_client.create_schedule(
        &fixture.parent,
        &fixture.family_id,
        &fixture.child,
        &50i128,
        &ScheduleFrequency::Daily,
        &current_ledger,
    );

    let contract_address = fixture.distributor_client.address.clone();
    fixture.token_admin_client.mint(&contract_address, &1000i128);

    // First distribution succeeds
    fixture.distributor_client.distribute(&fixture.parent, &schedule_id);

    // Immediate second distribution fails (DistributionNotDue)
    let res = fixture.distributor_client.try_distribute(&fixture.parent, &schedule_id);
    assert_eq!(res.unwrap_err().unwrap(), ContractError::DistributionNotDue.into());

    // Roll forward ledger by 1 day (17,280 ledgers)
    fixture.env.ledger().with_mut(|li| {
        li.sequence_number = current_ledger + 17280;
    });

    // Second distribution now succeeds
    let payment_id_2 = fixture.distributor_client.distribute(&fixture.parent, &schedule_id);
    assert_eq!(payment_id_2, 2);
    assert_eq!(fixture.token_client.balance(&fixture.child), 100i128);
}

#[test]
fn test_distribute_exceeds_limit_fails() {
    let fixture = setup_test();
    let current_ledger = fixture.env.ledger().sequence();

    // Create schedule with 150 XLM (limit is 100 XLM)
    let schedule_id = fixture.distributor_client.create_schedule(
        &fixture.parent,
        &fixture.family_id,
        &fixture.child,
        &150i128,
        &ScheduleFrequency::Daily,
        &current_ledger,
    );

    let contract_address = fixture.distributor_client.address.clone();
    fixture.token_admin_client.mint(&contract_address, &1000i128);

    // Distribute fails with ExceedsSpendingLimit
    let res = fixture.distributor_client.try_distribute(&fixture.parent, &schedule_id);
    assert_eq!(res.unwrap_err().unwrap(), ContractError::ExceedsSpendingLimit.into());
}

#[test]
fn test_distribute_insufficient_balance_fails() {
    let fixture = setup_test();
    let current_ledger = fixture.env.ledger().sequence();

    let schedule_id = fixture.distributor_client.create_schedule(
        &fixture.parent,
        &fixture.family_id,
        &fixture.child,
        &50i128,
        &ScheduleFrequency::Daily,
        &current_ledger,
    );

    // Do not fund the contract (balance is 0)
    let res = fixture.distributor_client.try_distribute(&fixture.parent, &schedule_id);
    assert_eq!(res.unwrap_err().unwrap(), ContractError::InsufficientContractBalance.into());
}
