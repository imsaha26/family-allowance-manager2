// ============================================================
// family_registry — Unit Tests
// ============================================================
#![cfg(test)]

extern crate std;

use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

use crate::types::Role;
use crate::errors::ContractError;
use crate::{FamilyRegistryContract, FamilyRegistryContractClient};

fn create_env() -> (Env, Address, FamilyRegistryContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    
    let contract_id = env.register(FamilyRegistryContract, ());
    let client = FamilyRegistryContractClient::new(&env, &contract_id);
    
    client.initialize(&admin);
    (env, admin, client)
}

#[test]
fn test_initialize_twice_fails() {
    let (_env, _admin, client) = create_env();
    let second_admin = Address::generate(&client.env);
    let res = client.try_initialize(&second_admin);
    assert_eq!(res.unwrap_err().unwrap(), ContractError::AlreadyInitialized.into());
}

#[test]
fn test_create_family() {
    let (_env, _admin, client) = create_env();
    let parent = Address::generate(&client.env);
    let family_name = String::from_str(&client.env, "Smiths");

    let family_id = client.create_family(&parent, &family_name);
    assert_eq!(family_id, 1);

    // Verify creator is registered as Parent
    let member_info = client.get_member_info(&family_id, &parent);
    assert_eq!(member_info.role, Role::Parent);
    assert!(member_info.active);
    assert_eq!(member_info.spending_limit, 0);

    // Verify family details
    let family = client.get_family(&family_id);
    assert_eq!(family.id, 1);
    assert_eq!(family.admin, parent);
    assert!(family.active);

    // Verify members list
    let members = client.get_family_members(&family_id);
    assert_eq!(members.len(), 1);
    assert_eq!(members.get(0).unwrap(), parent);
}

#[test]
fn test_member_rbac_and_adding() {
    let (_env, _admin, client) = create_env();
    let parent = Address::generate(&client.env);
    let family_name = String::from_str(&client.env, "Smiths");
    let family_id = client.create_family(&parent, &family_name);

    let child = Address::generate(&client.env);
    let guardian = Address::generate(&client.env);

    // Add child (Parent caller)
    client.add_member(&parent, &family_id, &child, &Role::Child);
    assert!(client.is_member(&family_id, &child));

    // Verify child info
    let child_info = client.get_member_info(&family_id, &child);
    assert_eq!(child_info.role, Role::Child);
    assert!(child_info.active);

    // Add guardian (Parent caller)
    client.add_member(&parent, &family_id, &guardian, &Role::Guardian);
    assert!(client.is_member(&family_id, &guardian));

    // Non-member cannot add anyone
    let stranger = Address::generate(&client.env);
    let other_child = Address::generate(&client.env);
    let res = client.try_add_member(&stranger, &family_id, &other_child, &Role::Child);
    assert_eq!(res.unwrap_err().unwrap(), ContractError::MemberNotFound.into());

    // Child cannot add anyone (fails with Unauthorized)
    let res2 = client.try_add_member(&child, &family_id, &other_child, &Role::Child);
    assert_eq!(res2.unwrap_err().unwrap(), ContractError::Unauthorized.into());
}

#[test]
fn test_limits_update() {
    let (_env, _admin, client) = create_env();
    let parent = Address::generate(&client.env);
    let family_name = String::from_str(&client.env, "Smiths");
    let family_id = client.create_family(&parent, &family_name);

    let child = Address::generate(&client.env);
    client.add_member(&parent, &family_id, &child, &Role::Child);

    // Update limits (Parent caller)
    client.update_member_limits(&parent, &family_id, &child, &100i128, &500i128);

    let child_info = client.get_member_info(&family_id, &child);
    assert_eq!(child_info.spending_limit, 100i128);
    assert_eq!(child_info.savings_goal, 500i128);

    // Verify negative limit validation fails
    let res = client.try_update_member_limits(&parent, &family_id, &child, &-10i128, &100i128);
    assert_eq!(res.unwrap_err().unwrap(), ContractError::InvalidAmount.into());
}

#[test]
fn test_member_removal() {
    let (_env, _admin, client) = create_env();
    let parent = Address::generate(&client.env);
    let family_name = String::from_str(&client.env, "Smiths");
    let family_id = client.create_family(&parent, &family_name);

    let child = Address::generate(&client.env);
    client.add_member(&parent, &family_id, &child, &Role::Child);

    // Remove child
    client.remove_member(&parent, &family_id, &child);
    assert!(!client.is_member(&family_id, &child));

    // Verify member is deactivated
    let child_info = client.get_member_info(&family_id, &child);
    assert!(!child_info.active);
}
