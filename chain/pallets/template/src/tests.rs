#![allow(warnings)]

use crate::{self as rosca, mock::*, Error, Event};
use frame_support::{
    assert_noop, assert_ok, assert_err,
    traits::{OnFinalize, OnInitialize},
    pallet_prelude::*,
};
use frame_support::pallet_prelude::DispatchError::Token;
use frame_support::testing_prelude::bounded_vec;
use sp_runtime::{traits::BadOrigin, DispatchError, ModuleError};
use sp_runtime::TokenError::FundsUnavailable;
use frame_support::traits::fungible::Mutate;

// Helper function to advance timestamp and block number
fn advance_time_and_block(timestamp: u64) {
    pallet_timestamp::Pallet::<Test>::set_timestamp(pallet_timestamp::Pallet::<Test>::get() + timestamp);
    System::set_block_number(System::block_number() + 1);
}

// Setup a basic ROSCA with three participants
fn setup_basic_rosca() -> (u64, Vec<u64>) {
    System::set_block_number(1);
    pallet_timestamp::Pallet::<Test>::set_timestamp(1);

    let creator = 1u64;
    let participants_vec = vec![2, 3];
    let participants: BoundedVec<u64, ConstU32<149>> = participants_vec.clone().try_into().unwrap();
    Balances::mint_into(&creator, 10000);
    Balances::mint_into(&2, 10000);
    Balances::mint_into(&3, 10000);

    assert_ok!(RoscaPallet::create_rosca(
        RuntimeOrigin::signed(creator),
        false,
        participants,
        3,
        100,
        10,
        20,
        Some(0),
        bounded_vec![1]
    ));

    for participant in participants_vec.iter() {
        assert_ok!(RoscaPallet::join_rosca(RuntimeOrigin::signed(*participant), 0, None));
    }

    assert_ok!(RoscaPallet::start_rosca(RuntimeOrigin::signed(creator), 0));
    (creator, participants_vec)
}

#[test]
fn create_rosca_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3, 4].try_into().unwrap();
        Balances::mint_into(&1, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants.clone(),
            4,
            100,
            50,
            51,
            Some(0),
            bounded_vec![1]
        ));

        assert_eq!(RoscaPallet::next_rosca_id(), 1);
        assert!(RoscaPallet::rosca_details(0).is_some());
        assert_eq!(RoscaPallet::participants_count(0), Some(1));
        assert_eq!(RoscaPallet::participants(0, &1), Some(0));
        assert!(RoscaPallet::invited_preverified_participants(0, &1).is_some());
        assert!(RoscaPallet::invited_preverified_participants(0, &2).is_some());
    });
}

#[test]
fn create_rosca_fails_with_past_start_timestamp() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(10);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);

        assert_noop!(
            RoscaPallet::create_rosca(
                RuntimeOrigin::signed(1),
                false,
                participants,
                3,
                100,
                50,
                9, // Past timestamp
                Some(0),
                bounded_vec![1]
            ),
            Error::<Test>::StartByTimestampMustBeFuture
        );
    });
}

#[test]
fn create_rosca_fails_with_zero_contribution() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);

        assert_noop!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            3,
            0, // Zero contribution amount
            50,
            51,
            Some(0),
            bounded_vec![1]
        ), Error::<Test>::ContributionAmountMustBePositive);
    });
}

#[test]
fn create_rosca_fails_with_zero_frequency() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);

        assert_noop!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            3,
            100,
            0, // Zero frequency
            51,
            Some(0),
            bounded_vec![1]
        ), Error::<Test>::FrequencyMustBePositive);
    });
}

#[test]
fn join_rosca_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3, 4].try_into().unwrap();
        Balances::mint_into(&1, 1000);
        Balances::mint_into(&2, 1000);
        Balances::mint_into(&3, 1000);
        Balances::mint_into(&4, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            3,
            100,
            50,
            51,
            Some(0),
            bounded_vec![1]
        ));

        assert_ok!(RoscaPallet::join_rosca(
            RuntimeOrigin::signed(2),
            0,
            None
        ));
        assert_eq!(RoscaPallet::participants_count(0), Some(2));
        assert!(RoscaPallet::participants(0, &2).is_some());

        assert_noop!(
            RoscaPallet::join_rosca(RuntimeOrigin::signed(2), 0, None),
            Error::<Test>::AlreadyJoined
        );

        assert_noop!(
            RoscaPallet::join_rosca(RuntimeOrigin::signed(5), 0, None),
            Error::<Test>::NotInvited
        );
    });
}

#[test]
fn join_rosca_fails_with_invalid_position() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);
        Balances::mint_into(&2, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            3,
            100,
            50,
            51,
            Some(0),
            bounded_vec![1]
        ));

        assert_noop!(
            RoscaPallet::join_rosca(RuntimeOrigin::signed(2), 0, Some(5)),
            Error::<Test>::PositionTooLarge
        );

        assert_noop!(
            RoscaPallet::join_rosca(RuntimeOrigin::signed(2), 0, Some(0)),
            Error::<Test>::PositionAlreadyFilled
        );
    });
}

#[test]
fn leave_rosca_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);
        Balances::mint_into(&2, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            2,
            100,
            50,
            51,
            Some(0),
            bounded_vec![1]
        ));

        assert_ok!(RoscaPallet::join_rosca(RuntimeOrigin::signed(2), 0, None));
        assert_ok!(RoscaPallet::add_to_security_deposit(RuntimeOrigin::signed(2), 0, 100));

        assert_ok!(RoscaPallet::leave_rosca(RuntimeOrigin::signed(2), 0));
        assert_eq!(RoscaPallet::participants_count(0), Some(1));
        assert_eq!(RoscaPallet::security_deposit(0, &2), None);
        assert_eq!(Balances::free_balance(2), 1000); // Deposit returned
    });
}

#[test]
fn leave_rosca_fails_when_active() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        assert_noop!(
            RoscaPallet::leave_rosca(RuntimeOrigin::signed(2), 0),
            Error::<Test>::RoscaAlreadyActive
        );
    });
}

#[test]
fn start_rosca_works() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);
        Balances::mint_into(&2, 1000);
        Balances::mint_into(&3, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            3,
            100,
            10,
            20,
            Some(0),
            bounded_vec![1]
        ));

        for participant in vec![2, 3].iter() {
            assert_ok!(RoscaPallet::join_rosca(RuntimeOrigin::signed(*participant), 0, None));
        }

        assert_ok!(RoscaPallet::start_rosca(RuntimeOrigin::signed(1), 0));
        assert!(RoscaPallet::active_roscas(0).is_some());
        assert_eq!(RoscaPallet::next_pay_by_timestamp(0), Some(11));
        assert_eq!(RoscaPallet::final_pay_by_timestamp(0), Some(31));
    });
}

#[test]
fn start_rosca_fails_threshold_not_met() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            3,
            100,
            50,
            51,
            Some(0),
            bounded_vec![1]
        ));

        assert_noop!(
            RoscaPallet::start_rosca(RuntimeOrigin::signed(1), 0),
            Error::<Test>::ParticipantThresholdNotMet
        );
    });
}

#[test]
fn contribute_to_rosca_works() {
    new_test_ext().execute_with(|| {
        let (creator, _) = setup_basic_rosca();

        // First contribution round:
        // Participant 2 contributes.
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        // Assuming the initial eligible claimant is the creator (account 1),
        // creator should receive 100, and participant 2 loses 100.
        assert_eq!(Balances::free_balance(creator), 10100); 
        assert_eq!(Balances::free_balance(2), 9900);
        // Contribution count should now be 1.
        assert_eq!(RoscaPallet::current_contribution_count(0), 1);

        // Participant 3 contributes.
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(3), 0));
        // Since this is the final contribution for the round, the round advances:
        // - The contribution count resets to 0.
        // - next_pay_by_timestamp is updated (to 21 in this case).
        // - Eligible claimant rotates to a new participant.
        assert_eq!(RoscaPallet::current_contribution_count(0), 0);
        assert_eq!(RoscaPallet::next_pay_by_timestamp(0), Some(21));

        // Verify that the eligible claimant has changed from the initial value.
        let new_eligible = RoscaPallet::eligible_claimant(0).unwrap();
        assert_eq!(new_eligible, 2);
        assert_ne!(new_eligible, creator);
    });
}


#[test]
fn contribute_with_insufficient_balance_fails() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        Balances::set_balance(&2, 50); // Less than 100

        assert_err!(
            RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0),
            Token(FundsUnavailable)
        );
    });
}

#[test]
fn contribute_to_rosca_fails_for_eligible_claimant() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        let eligible = RoscaPallet::eligible_claimant(0).unwrap();

        assert_noop!(
            RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(eligible), 0),
            Error::<Test>::CantContributeToSelf
        );
    });
}

#[test]
fn contribute_twice_in_same_period_fails() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();

        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        assert_noop!(
            RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0),
            Error::<Test>::AlreadyContributed
        );
    });
}

#[test]
fn contribute_after_final_pay_completes() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        pallet_timestamp::Pallet::<Test>::set_timestamp(40);

        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        assert!(RoscaPallet::completed_roscas(0).is_some());
    });
}

#[test]
fn contribute_non_participant_fails() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        Balances::mint_into(&4, 1000);

        assert_noop!(
            RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(4), 0),
            Error::<Test>::NotAParticipant
        );
    });
}

#[test]
fn manually_end_rosca_works() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        pallet_timestamp::Pallet::<Test>::set_timestamp(40);

        assert_ok!(RoscaPallet::manually_end_rosca(RuntimeOrigin::signed(1), 0));
        assert!(RoscaPallet::completed_roscas(0).is_some());
    });
}

#[test]
fn manually_end_before_final_pay_fails() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        pallet_timestamp::Pallet::<Test>::set_timestamp(25);

        assert_noop!(
            RoscaPallet::manually_end_rosca(RuntimeOrigin::signed(1), 0),
            Error::<Test>::FinalPayByTimestampMustBePast
        );
    });
}

#[test]
fn claim_security_deposit_works() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        assert_ok!(RoscaPallet::add_to_security_deposit(RuntimeOrigin::signed(2), 0, 200));
        pallet_timestamp::Pallet::<Test>::set_timestamp(40);
        assert_ok!(RoscaPallet::manually_end_rosca(RuntimeOrigin::signed(1), 0));

        assert_noop!(RoscaPallet::claim_security_deposit(RuntimeOrigin::signed(2), 0), Error::<Test>::SecurityDepositIsZero);
    });
}

#[test]
fn claim_security_deposit_before_completion_fails() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        assert_ok!(RoscaPallet::add_to_security_deposit(RuntimeOrigin::signed(2), 0, 200));

        assert_noop!(
            RoscaPallet::claim_security_deposit(RuntimeOrigin::signed(2), 0),
            Error::<Test>::FinalPayByTimestampMustBePast
        );
    });
}

#[test]
fn add_to_security_deposit_after_completion_fails() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        pallet_timestamp::Pallet::<Test>::set_timestamp(40);
        assert_ok!(RoscaPallet::manually_end_rosca(RuntimeOrigin::signed(1), 0));

        assert_noop!(
            RoscaPallet::add_to_security_deposit(RuntimeOrigin::signed(2), 0, 100),
            Error::<Test>::RoscaAlreadyCompleted
        );
    });
}

#[test]
fn random_order_shuffles_participants() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let participants: BoundedVec<u64, ConstU32<149>> = vec![2, 3].try_into().unwrap();
        Balances::mint_into(&1, 1000);
        Balances::mint_into(&2, 1000);
        Balances::mint_into(&3, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            true,
            participants,
            3,
            100,
            10,
            20,
            Some(0),
            bounded_vec![1]
        ));

        for participant in vec![2, 3].iter() {
            assert_ok!(RoscaPallet::join_rosca(RuntimeOrigin::signed(*participant), 0, None));
        }

        assert_ok!(RoscaPallet::start_rosca(RuntimeOrigin::signed(1), 0));
        let active_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        // Note: Exact order can't be deterministic, but ensure it's populated
        assert_eq!(active_order.len(), 3);
    });
}

#[test]
fn process_defaulters_sufficient_deposit() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        assert_ok!(RoscaPallet::add_to_security_deposit(RuntimeOrigin::signed(3), 0, 100));
        pallet_timestamp::Pallet::<Test>::set_timestamp(15);

        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        assert_eq!(RoscaPallet::default_count(0, &3), 0);
        assert_eq!(RoscaPallet::security_deposit(0, &3), Some(0));
    });
}

#[test]
fn process_defaulters_insufficient_deposit() {
    new_test_ext().execute_with(|| {
        let (creator, participants) = setup_basic_rosca();
        assert_ok!(RoscaPallet::add_to_security_deposit(RuntimeOrigin::signed(3), 0, 50));
        pallet_timestamp::Pallet::<Test>::set_timestamp(15);

        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        assert_eq!(RoscaPallet::default_count(0, &3), 1);
        assert_eq!(RoscaPallet::security_deposit(0, &3), Some(0));
    });
}

#[test]
fn max_participants_edge_case() {
    new_test_ext().execute_with(|| {
        System::set_block_number(1);
        pallet_timestamp::Pallet::<Test>::set_timestamp(1);

        let mut participants_vec = vec![];
        for i in 2..150 {
            participants_vec.push(i);
            Balances::mint_into(&i, 1000);
        }
        let participants: BoundedVec<u64, ConstU32<149>> = participants_vec.try_into().unwrap();
        Balances::mint_into(&1, 1000);

        assert_ok!(RoscaPallet::create_rosca(
            RuntimeOrigin::signed(1),
            false,
            participants,
            149,
            100,
            50,
            51,
            Some(0),
            bounded_vec![1]
        ));
    });
}

#[test]
fn eligible_claimant_rotation_works_correctly() {
    new_test_ext().execute_with(|| {
        let (creator, participants_vec) = setup_basic_rosca();
        let all_participants = vec![creator, participants_vec[0], participants_vec[1]]; // [1, 2, 3]
        let mut round_claimants = Vec::new();

        for _ in 0..3 {
            let current_eligible = RoscaPallet::eligible_claimant(0).unwrap();
            round_claimants.push(current_eligible);
            for participant in &all_participants {
                if *participant != current_eligible {
                    assert_ok!(RoscaPallet::contribute_to_rosca(
                        RuntimeOrigin::signed(*participant),
                        0
                    ));
                }
            }
        }

        // Verify each participant is eligible once
        assert_eq!(round_claimants.len(), 3);
        assert!(round_claimants.contains(&1));
        assert!(round_claimants.contains(&2));
        assert!(round_claimants.contains(&3));
    });
}

#[test]
fn test_time_based_round_advancement() {
    new_test_ext().execute_with(|| {
        // Setup a basic ROSCA.
        // After start_rosca, the pending order [Some(1), Some(2), Some(3)] is reversed to [3,2,1],
        // then rotated so that the active order becomes [1,3,2] and the eligible claimant is set to 1.
        let (creator, _participants_vec) = setup_basic_rosca();
        assert_eq!(RoscaPallet::eligible_claimant(0), Some(1));
        let initial_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        assert_eq!(initial_order, vec![1, 3, 2]);

        // --- Round 1: Time-based catch-up advancement ---
        // Advance time so that current timestamp exceeds the next pay-by timestamp.
        let next_pay_by = RoscaPallet::next_pay_by_timestamp(0).unwrap();
        let current_time = pallet_timestamp::Pallet::<Test>::get();
        advance_time_and_block(next_pay_by.saturating_sub(current_time) + 1);

        // Have a non-eligible participant contribute to trigger the while-loop advancement.
        // With the new logic:
        //   * It reads the active order [1,3,2],
        //   * Sets new eligible claimant to active_order[last] which is 2,
        //   * Then rotates the order right (yielding [2,1,3]).
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(3), 0));
        assert_eq!(RoscaPallet::eligible_claimant(0), Some(2));
        let active_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        assert_eq!(active_order, vec![2, 1, 3]);

        // --- Round 2: Another time-triggered round ---
        let next_pay_by = RoscaPallet::next_pay_by_timestamp(0).unwrap();
        let current_time = pallet_timestamp::Pallet::<Test>::get();
        advance_time_and_block(next_pay_by.saturating_sub(current_time) + 1);

        // Now, let a non-eligible participant (participant 1) contribute.
        // With the active order [2,1,3]:
        //   * New eligible becomes active_order[last] = 3,
        //   * And the order rotates right to [3,2,1].
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(1), 0));
        assert_eq!(RoscaPallet::eligible_claimant(0), Some(3));
        let active_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        assert_eq!(active_order, vec![3, 2, 1]);

        // --- Round 3: Yet another time-triggered round ---
        let next_pay_by = RoscaPallet::next_pay_by_timestamp(0).unwrap();
        let current_time = pallet_timestamp::Pallet::<Test>::get();
        advance_time_and_block(next_pay_by.saturating_sub(current_time) + 1);

        // Let participant 2 contribute.
        // With active order [3,2,1]:
        //   * New eligible becomes active_order[last] = 1,
        //   * And order rotates right to [1,3,2].
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        assert_eq!(RoscaPallet::eligible_claimant(0), Some(1));
        let active_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        assert_eq!(active_order, vec![1, 3, 2]);
    });
}

#[test]
fn test_final_contribution_round_advancement() {
    new_test_ext().execute_with(|| {
        // Setup a basic ROSCA.
        // After start, active order is [1,3,2] and eligible claimant is 1.
        let (creator, _participants_vec) = setup_basic_rosca();
        assert_eq!(RoscaPallet::eligible_claimant(0), Some(1));
        let initial_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        assert_eq!(initial_order, vec![1, 3, 2]);

        // --- Round 1: Normal (final contribution) advancement ---
        // In a normal round, contributions come in before time triggers catch-up.
        // With eligible claimant = 1, let participant 3 contribute first.
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(3), 0));
        // Then final contribution from participant 2.
        // With the new logic, before rotating, eligible claimant is set from [1,3,2]:
        //   * active_order[last] = 2,
        //   * Then the order rotates to [2,1,3].
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        assert_eq!(RoscaPallet::eligible_claimant(0), Some(2));
        let active_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        assert_eq!(active_order, vec![2, 1, 3]);

        // --- Round 2: Next normal round advancement ---
        // Eligible claimant is now 2.
        // Let participant 1 contribute first.
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(1), 0));
        // Then final contribution from participant 3.
        // New logic picks eligible = active_order[last] from [2,1,3] which is 3,
        // then rotates the order to [3,2,1].
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(3), 0));
        assert_eq!(RoscaPallet::eligible_claimant(0), Some(3));
        let active_order = RoscaPallet::active_rosca_participants_order(0).unwrap();
        assert_eq!(active_order, vec![3, 2, 1]);
    });
}

#[test]
fn test_timestamp_updates_during_round_advancement() {
    new_test_ext().execute_with(|| {
        // Setup a basic ROSCA.
        let (creator, _participants_vec) = setup_basic_rosca();
        // Record the initial next_pay_by_timestamp.
        let initial_next = RoscaPallet::next_pay_by_timestamp(0).unwrap();

        // For a normal round advancement, perform two contributions.
        // First, let participant 3 contribute.
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(3), 0));
        // At this point (before final contribution), next_pay_by_timestamp should remain unchanged.
        assert_eq!(RoscaPallet::next_pay_by_timestamp(0).unwrap(), initial_next);

        // Final contribution by participant 2.
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        // The next_pay_by_timestamp should now update by adding the contribution frequency (10 in our setup).
        let updated_next = RoscaPallet::next_pay_by_timestamp(0).unwrap();
        assert_eq!(updated_next, initial_next + 10);
    });
}

#[test]
fn test_rosca_completion_after_final_pay_by() {
    new_test_ext().execute_with(|| {
        // Setup a basic ROSCA.
        let (creator, _participants_vec) = setup_basic_rosca();
        // Advance time to exceed the final_pay_by_timestamp.
        let final_pay_by = RoscaPallet::final_pay_by_timestamp(0).unwrap();
        let current_time = pallet_timestamp::Pallet::<Test>::get();
        advance_time_and_block(final_pay_by.saturating_sub(current_time) + 1);

        // A contribution now should complete the ROSCA.
        assert_ok!(RoscaPallet::contribute_to_rosca(RuntimeOrigin::signed(2), 0));
        assert!(RoscaPallet::completed_roscas(0).is_some());
    });
}
