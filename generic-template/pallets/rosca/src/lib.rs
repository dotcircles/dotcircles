#![cfg_attr(not(feature = "std"), no_std)]

#![allow(warnings)]

/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// <https://docs.substrate.io/reference/frame-pallets/>
pub use pallet::*;

pub mod types;

#[cfg(test)]
mod mock;

#[cfg(test)]
mod tests;


use frame_support::pallet_prelude::DispatchResult;
use scale_info::prelude::vec::Vec;

use sp_runtime::traits::{SaturatedConversion, AccountIdConversion, CheckedAdd, CheckedMul};
use frame_support::traits::{Currency, ReservableCurrency, WithdrawReasons, ExistenceRequirement, fungible, fungibles};
use frame_support::traits::fungible::Mutate;
use frame_support::traits::fungibles::Mutate as FungibleMutate;
use frame_support::PalletId;
use frame_support::traits::tokens::Preservation::Expendable;
use frame_support::ensure;

use sp_core::blake2_128;

use frame_support::traits::Randomness;

pub use types::*;

type AccountIdOf<T> = <T as frame_system::Config>::AccountId;

pub type Balance = u128;

use frame_support::traits::Get;

use frame_support::BoundedVec;

use frame_support::pallet_prelude::*;
use frame_system::pallet_prelude::*;



#[frame_support::pallet(dev_mode)]
pub mod pallet {
	use super::*;
	use frame_support::pallet_prelude::*;
	use frame_system::pallet_prelude::*;

	#[pallet::pallet]
	pub struct Pallet<T>(_);

	/// Configure the pallet by specifying the parameters and types on which it depends.
	#[pallet::config]
	pub trait Config: frame_system::Config + pallet_timestamp::Config
	{
		/// Because this pallet emits events, it depends on the runtime's definition of an event.
		type RuntimeEvent: From<Event<Self>> + IsType<<Self as frame_system::Config>::RuntimeEvent>;

		type ForeignCurrency: fungibles::InspectEnumerable<AccountIdOf<Self>, Balance = Balance, AssetId = u32>
			+ fungibles::metadata::Inspect<AccountIdOf<Self>, AssetId = u32>
			+ fungibles::metadata::Mutate<AccountIdOf<Self>, AssetId = u32>
			+ fungibles::Mutate<AccountIdOf<Self>, Balance = Balance>
			+ fungibles::Inspect<AccountIdOf<Self>, Balance = Balance>;

		/// Maximum number of participants in a single ROSCA
		#[pallet::constant]
		type MaxParticipants: Get<u32>;

		#[pallet::constant]
		type MaxInvitedParticipants: Get<u32>;

		#[pallet::constant]
		type PalletId: Get<PalletId>;

		#[pallet::constant]
		type StringLimit: Get<u32>;
	}

	/// The next Rosca id
	#[pallet::storage]
	#[pallet::getter(fn next_rosca_id)]
	pub(super) type NextRoscaId<T> = StorageValue<_, RoscaId, ValueQuery>;

	/// Currently active Rosca.
	#[pallet::storage]
	#[pallet::getter(fn active_roscas)]
	pub(super) type ActiveRoscas<T> = StorageMap<_, Blake2_128Concat, RoscaId, RoscaDetails<T>, OptionQuery>;

	/// Completed Rosca
	#[pallet::storage]
	#[pallet::getter(fn completed_roscas)]
	pub(super) type CompletedRoscas<T> = StorageMap<_, Blake2_128Concat, RoscaId, (), OptionQuery>;


	// Mapping of Rosca Id and AccountId returning their prestart position index. This index could become inaccurate once the Rosca starts if 
	// the Rosca starts with less than the max of participants. Once the Rosca is active this Map should be used for membership checks only.
	#[pallet::storage]
	#[pallet::getter(fn participants)]
	pub(super) type RoscaParticipants<T> = StorageDoubleMap<_, Blake2_128Concat, RoscaId, Blake2_128Concat, AccountIdOf<T>, u32, OptionQuery>;

	// Invited participants. Includes the rosca creator
	#[pallet::storage]
	#[pallet::getter(fn invited_preverified_participants)]
	pub(super) type RoscaInvitedPreverifiedParticipants<T> = StorageDoubleMap<_, Blake2_128Concat, RoscaId, Blake2_128Concat, AccountIdOf<T>, (), OptionQuery>;

	// Number of participants in the Rosca
	#[pallet::storage]
	#[pallet::getter(fn participants_count)]
	pub(super) type RoscaParticipantsCount<T> = StorageMap<_, Blake2_128Concat, RoscaId, u32, OptionQuery>;


	// Mapping of RoscaId and AccountID to the total security deposit one has in the Rosca fund.
	#[pallet::storage]
	#[pallet::getter(fn security_deposit)]
	pub(super) type RoscaSecurityDeposits<T> = StorageDoubleMap<_, Blake2_128Concat, RoscaId, Blake2_128Concat, AccountIdOf<T>, u32, OptionQuery>;

	// The claim order of participants for an unstarted Rosca.
	#[pallet::storage]
	#[pallet::getter(fn pending_rosca_participants_order)]
	pub(super) type PendingRoscaParticipantsOrder<T> = StorageMap<_, Blake2_128Concat, RoscaId, BoundedVec<Option<AccountIdOf<T>>, <T as pallet::Config>::MaxParticipants>, OptionQuery>;

	// The claim order of participants for a started Rosca.
	#[pallet::storage]
	#[pallet::getter(fn active_rosca_participants_order)]
	pub(super) type ActiveRoscaParticipantsOrder<T> = StorageMap<_, Blake2_128Concat, RoscaId, BoundedVec<AccountIdOf<T>, <T as pallet::Config>::MaxParticipants>, OptionQuery>;

	// Rosca that have been proposed but not yet started
	#[pallet::storage]
	#[pallet::getter(fn rosca_details)]
	pub(super) type PendingRoscaDetails<T> = StorageMap<_, Blake2_128Concat, RoscaId, RoscaDetails<T>, OptionQuery>;


	#[pallet::storage]
	#[pallet::getter(fn next_pay_by_timestamp)]
	pub(super) type NextPayByTimestamp<T> = StorageMap<_, Blake2_128Concat, RoscaId, <T as pallet_timestamp::Config>::Moment, OptionQuery>;

	// The cut off timestamp for the last cycle of the Rosca
	#[pallet::storage]
	#[pallet::getter(fn final_pay_by_timestamp)]
	pub(super) type FinalPayByTimestamp<T> = StorageMap<_, Blake2_128Concat, RoscaId, <T as pallet_timestamp::Config>::Moment, OptionQuery>;


	// The account of the currently eligible recipient of the pot
	#[pallet::storage]
	#[pallet::getter(fn eligible_claimant)]
	pub(super) type EligibleClaimant<T> = StorageMap<_, Blake2_128Concat, RoscaId, AccountIdOf<T>, OptionQuery>;

	// The account address for a given Rosca.
	#[pallet::storage]
	#[pallet::getter(fn rosca_account)]
	pub type RoscaAccounts<T: Config> = StorageMap<_, Blake2_128Concat, RoscaId, T::AccountId, OptionQuery>;

	// Double Map of rosca_id, participant => true/false for current Rosca cycle. 
	#[pallet::storage]
	#[pallet::getter(fn current_contributors)]
	pub type CurrentContributors<T: Config> = StorageDoubleMap<_, Blake2_128Concat, RoscaId, Blake2_128Concat, AccountIdOf<T>, (), OptionQuery>;

	// Current number of contributions for this round for a given rosca id
	#[pallet::storage]
	#[pallet::getter(fn current_contribution_count)]
	pub type CurrentContributionCount<T: Config> = StorageMap<_, Blake2_128Concat, RoscaId, u32, ValueQuery>;

	// Counter for number of defaults by a participant
	#[pallet::storage]
	#[pallet::getter(fn default_count)]
	pub type DefaultCount<T: Config> = StorageDoubleMap<_, Blake2_128Concat, RoscaId, Blake2_128Concat, AccountIdOf<T>, u32, ValueQuery>;


	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		/// A Rosca Created
		RoscaCreated { 
			rosca_id: RoscaId, 
			contribution_amount: Balance, 
			contribution_frequency: <T as pallet_timestamp::Config>::Moment, 
			random_order: bool, 
			name: BoundedVec<u8, <T as Config>::StringLimit>, 
			number_of_participants: u32, 
			minimum_participant_threshold: u32, 
			start_by_timestamp: <T as pallet_timestamp::Config>::Moment, 
			eligible_participants: BoundedVec<AccountIdOf<T>, T::MaxParticipants>, 
			creator: AccountIdOf<T> 
		},
		/// Participant missed a payment
		ParticipantDefaulted {
			rosca_id: RoscaId,
			participant: AccountIdOf<T>,
		},
		/// Participant made a contribution
		ContributionMade {
			rosca_id: RoscaId,
			contributor: AccountIdOf<T>,
			recipient: AccountIdOf<T>,
			amount: Balance,
		},
		/// A Rosca deposit was deducted from
		DepositDeducted {
			rosca_id: RoscaId,
			contributor: AccountIdOf<T>,
			recipient: AccountIdOf<T>,
			amount: Balance,
			sufficient: bool
		},
		/// Participant joined the Rosca
		JoinedRosca {
			rosca_id: RoscaId,
			contributor: AccountIdOf<T>,
		},
		/// Participant left the Rosca
		LeftRosca {
			rosca_id: RoscaId,
			contributor: AccountIdOf<T>,
		},
		/// A Rosca was started
		RoscaStarted {
			rosca_id: RoscaId,
			started_by: AccountIdOf<T>,
			rounds: RoscaRounds<T>
		},
		/// A Rosca was completed
		RoscaComplete {
			rosca_id: RoscaId,
		},
		/// A Security Deposit was added to
		SecurityDepositContribution {
			rosca_id: RoscaId,
			depositor: AccountIdOf<T>,
		},
		/// A Security Deposit was claimed back
		SecurityDepositClaimed {
			rosca_id: RoscaId,
			depositor: AccountIdOf<T>,
		},
		/// A Rosca was manually ended
		RoscaManuallyEnded {
			rosca_id: RoscaId,
		},
		/// A new round started
		NewRoundStarted {
			rosca_id: RoscaId,
			new_eligible_recipient: AccountIdOf<T>
		}
	}
	// Errors inform users that something went wrong.
	#[pallet::error]
	pub enum Error<T> {
		ConversionError,
		ArithmeticOverflow,
		ArithmeticUnderflow,
		MultiplyError,
		DivisionError,
		ArithmeticError,
		ContributionAmountMustBePositive,
		FrequencyMustBePositive,
		/// Rosca start by timestamp must be in the future
		StartByTimestampMustBeFuture,
		/// Too many proposed participants
		TooManyProposedParticipants,
		/// Rosca position not valid
		PositionTooLarge,
		/// Rosca with given id not found
		RoscaNotFound,
		/// Rosca position already filled
		PositionAlreadyFilled,
		/// Participant already joined this Rosca
		AlreadyJoined,
		/// Rosca already active
		RoscaAlreadyActive,
		/// Rosca security deposit not found
		SecurityDepositNotFound,
		/// Security Deposit Zero
		SecurityDepositIsZero,
		/// All Rosca positions filled
		AllPositionsFilled,
		/// Rosca participant not found
		RoscaParticipantsNotFound,
		/// Not a participant in this Rosca
		NotAParticipant,
		/// Participant threshold not met
		ParticipantThresholdNotMet,
		/// Participant count for Rosca not found
		RoscaParticipantCountNotFound,
		/// Rosca not active
		RoscaNotActive,
		/// Can't contribute when contributor is the recipient
		CantContributeToSelf,
		/// No eligible participant found
		NoEligbleClaimant,
		/// Participant already contributed this round
		AlreadyContributed,
		/// No next pay by timestamp
		NoNextPayByTimestamp,
		/// No final pay by timestamp
		FinalPayByTimestampNotFound,
		/// Final pay by timestamp must be past
		FinalPayByTimestampMustBePast,
		/// Rosca not completed
		RoscaNotCompleted,
		/// Can't contribute beyond final pay by block
		CantContributeBeyondFinalPayBy,
		/// Rosca already completed
		RoscaAlreadyCompleted,
		/// Not invited to this Rosca
		NotInvited,
		/// Can't invite to self
		CantInviteSelf,
		/// Min participant threshold not met
		ThresholdTooHigh,
		/// Rosca still active - can't claim security deposit
		RoscaStillActive,
		/// Too many Rosca Rounds
		TooManyRounds
	}


	#[pallet::call]
	impl<T: Config> Pallet<T> {
		#[pallet::call_index(0)]
		pub fn create_rosca(origin: OriginFor<T>, random_order: bool, invited_pre_verified_participants: BoundedVec<AccountIdOf<T>, T::MaxInvitedParticipants>, minimum_participant_threshold: u32, contribution_amount: u32, payment_asset: PaymentAssets, contribution_frequency: <T as pallet_timestamp::Config>::Moment, start_by_timestamp: <T as pallet_timestamp::Config>::Moment, position: Option<u32>, name: BoundedVec<u8, <T as Config>::StringLimit>) -> DispatchResult {
			let signer = ensure_signed(origin)?;
			ensure!(contribution_amount > 0, Error::<T>::ContributionAmountMustBePositive);
			ensure!(contribution_frequency > T::Moment::from(0u32), Error::<T>::FrequencyMustBePositive);
			ensure!(T::MaxInvitedParticipants::get() < T::MaxParticipants::get(), Error::<T>::ArithmeticError);
			ensure!(!invited_pre_verified_participants.contains(&signer), Error::<T>::CantInviteSelf);
			let mut invited_pre_verified_participants = invited_pre_verified_participants.into_inner();
			invited_pre_verified_participants.sort();
			invited_pre_verified_participants.dedup();


			let current_timestamp = <pallet_timestamp::Pallet<T>>::get();
			let position = position.unwrap_or(0);
			let number_of_participants = invited_pre_verified_participants.len().checked_add(1).ok_or(Error::<T>::ArithmeticOverflow)? as u32;
			ensure!(minimum_participant_threshold <= number_of_participants, Error::<T>::ThresholdTooHigh);
			ensure!(position < T::MaxParticipants::get(), Error::<T>::PositionTooLarge);

			ensure!(current_timestamp < start_by_timestamp, Error::<T>::StartByTimestampMustBeFuture);
			

			let new_rosca_id = Self::next_rosca_id();
			let new_rosca_account_id = Self::rosca_account_id(new_rosca_id);


			let mut rosca_participants: Vec<Option<AccountIdOf<T>>> = Vec::new();
			rosca_participants.resize(number_of_participants as usize, None);
			rosca_participants[position as usize] = Some(signer.clone());

			let mut rosca_invited_participants_including_creator: BoundedVec<AccountIdOf<T>, T::MaxParticipants> = BoundedVec::new();
			RoscaInvitedPreverifiedParticipants::<T>::insert(new_rosca_id, &signer, ());
			rosca_invited_participants_including_creator.try_push(signer.clone());
			for invited_participant in invited_pre_verified_participants.iter() {
				RoscaInvitedPreverifiedParticipants::<T>::insert(new_rosca_id, invited_participant, ());
				rosca_invited_participants_including_creator.try_push(invited_participant.clone());
			}

			let rosca_participants: BoundedVec<Option<AccountIdOf<T>>, T::MaxParticipants> = BoundedVec::try_from(rosca_participants).map_err(|_| Error::<T>::TooManyProposedParticipants)?;
			
			PendingRoscaParticipantsOrder::<T>::insert(new_rosca_id, rosca_participants);
			RoscaParticipants::<T>::insert(new_rosca_id, &signer, position);
			RoscaParticipantsCount::<T>::insert(new_rosca_id, 1);

			PendingRoscaDetails::<T>::insert(new_rosca_id, RoscaDetails {
				random_order,
				number_of_participants,
				minimum_participant_threshold,
				contribution_amount: contribution_amount.into(),
				payment_asset,
				contribution_frequency,
				start_by_timestamp,
				name: name.clone()
			});

			<NextRoscaId<T>>::put(new_rosca_id + 1);

			Self::deposit_event(Event::<T>::RoscaCreated {
				rosca_id: new_rosca_id,
				random_order,
				number_of_participants,
				minimum_participant_threshold,
				eligible_participants: rosca_invited_participants_including_creator,
				contribution_amount: contribution_amount.into(),
				contribution_frequency,
				start_by_timestamp,
				name,
				creator: signer
			});

			Ok(())

		}

		#[pallet::call_index(1)]
		pub fn join_rosca(origin: OriginFor<T>, rosca_id: RoscaId, position: Option<u32>) -> DispatchResult {

			let signer = ensure_signed(origin)?;
			ensure!(Self::active_roscas(rosca_id).is_none(), Error::<T>::RoscaAlreadyActive);
			ensure!(Self::participants(rosca_id, &signer).is_none(), Error::<T>::AlreadyJoined);
			ensure!(Self::invited_preverified_participants(rosca_id, &signer).is_some(), Error::<T>::NotInvited);
			let pending_rosca = Self::rosca_details(rosca_id).ok_or(Error::<T>::RoscaNotFound)?;

			let current_timestamp = <pallet_timestamp::Pallet<T>>::get();
			ensure!(current_timestamp < pending_rosca.start_by_timestamp, Error::<T>::StartByTimestampMustBeFuture);
			
			let mut pending_rosca_order = Self::pending_rosca_participants_order(rosca_id).ok_or(Error::<T>::RoscaNotFound)?;
			
			let mut participant_position: u32;

			if let Some(position_index) = position {
				let current_position: &mut Option<AccountIdOf<T>> = pending_rosca_order.get_mut(position_index as usize).ok_or(Error::<T>::PositionTooLarge)?;
				ensure!(current_position.is_none(), Error::<T>::PositionAlreadyFilled);
				*current_position = Some(signer.clone());
				participant_position = position_index as u32;
			} else {

				let position_index = pending_rosca_order.iter().position(|participant| participant.is_none()).ok_or(Error::<T>::AllPositionsFilled)?;
				pending_rosca_order[position_index] = Some(signer.clone());
				participant_position = position_index as u32;

			}

			let rosca_account_id = Self::rosca_account_id(rosca_id);

			PendingRoscaParticipantsOrder::<T>::insert(rosca_id, pending_rosca_order);
			RoscaParticipants::<T>::insert(rosca_id, &signer, participant_position);

			let mut current_participant_count = Self::participants_count(rosca_id).ok_or(Error::<T>::RoscaParticipantCountNotFound)?;
			current_participant_count = current_participant_count.checked_add(1).ok_or(Error::<T>::ArithmeticOverflow)?;

			RoscaParticipantsCount::<T>::insert(rosca_id, current_participant_count);

			Self::deposit_event(Event::<T>::JoinedRosca {
				rosca_id,
				contributor: signer
			});

			Ok(())
		}

		#[pallet::call_index(2)]
		pub fn leave_rosca(origin: OriginFor<T>, rosca_id: RoscaId) -> DispatchResult {

			let signer = ensure_signed(origin)?;
			ensure!(Self::active_roscas(rosca_id).is_none(), Error::<T>::RoscaAlreadyActive);
			let participant_index = Self::participants(rosca_id, &signer).ok_or(Error::<T>::NotAParticipant)?;
			let pending_rosca = Self::rosca_details(rosca_id).ok_or(Error::<T>::RoscaNotFound)?;

			let current_timestamp = <pallet_timestamp::Pallet<T>>::get();

			let rosca_account_id = Self::rosca_account_id(rosca_id);

			let mut participants_order = Self::pending_rosca_participants_order(rosca_id).ok_or(Error::<T>::RoscaParticipantsNotFound)?;
			participants_order[participant_index as usize] = None;

			RoscaParticipants::<T>::remove(rosca_id, &signer);
			PendingRoscaParticipantsOrder::<T>::insert(rosca_id, participants_order);
			let mut current_participant_count = Self::participants_count(rosca_id).ok_or(Error::<T>::RoscaParticipantCountNotFound)?;
			current_participant_count = current_participant_count.checked_sub(1).ok_or(Error::<T>::ArithmeticUnderflow)?;

			RoscaParticipantsCount::<T>::insert(rosca_id, current_participant_count);

			let mut participant_deposit = Self::security_deposit(rosca_id, &signer).unwrap_or(0);
			if participant_deposit > 0 {
				let rosca_account_id = Self::rosca_account_id(rosca_id);
				T::ForeignCurrency::transfer(
					pending_rosca.payment_asset.id(), 
					&rosca_account_id, 
					&signer, 
					participant_deposit.into(),
					Expendable
				)?;
				RoscaSecurityDeposits::<T>::remove(rosca_id, &signer);
				Self::deposit_event(Event::<T>::SecurityDepositClaimed {
					rosca_id,
					depositor: signer.clone()
				});
			}

			Self::deposit_event(Event::<T>::LeftRosca {
				rosca_id,
				contributor: signer
			});

			Ok(())
		}

		#[pallet::call_index(3)]
		pub fn start_rosca(origin: OriginFor<T>, rosca_id: RoscaId) -> DispatchResult {

			let signer = ensure_signed(origin)?;
			ensure!(Self::active_roscas(rosca_id).is_none(), Error::<T>::RoscaAlreadyActive);
			let participant_index = Self::participants(rosca_id, &signer).ok_or(Error::<T>::NotAParticipant)?;
			let pending_rosca = Self::rosca_details(rosca_id).ok_or(Error::<T>::RoscaNotFound)?;
			let mut pending_rosca_order = Self::pending_rosca_participants_order(rosca_id).ok_or(Error::<T>::RoscaParticipantsNotFound)?;
			let current_timestamp = <pallet_timestamp::Pallet<T>>::get();
			ensure!(current_timestamp < pending_rosca.start_by_timestamp, Error::<T>::StartByTimestampMustBeFuture);
			let current_pending_participant_count = Self::participants_count(rosca_id).ok_or(Error::<T>::RoscaParticipantCountNotFound)?;
			ensure!(current_pending_participant_count >= pending_rosca.minimum_participant_threshold, Error::<T>::ParticipantThresholdNotMet);


			let mut order = pending_rosca_order.clone().into_inner();
			order.reverse();
			
			let filtered_order: Vec<AccountIdOf<T>> = order.into_iter().filter_map(|p| p).collect(); 
			let mut active_rosca_order: BoundedVec<AccountIdOf<T>, T::MaxParticipants> = BoundedVec::try_from(filtered_order).map_err(|_| Error::<T>::TooManyProposedParticipants)?;

			if pending_rosca.random_order {
				Self::shuffle_participants(&mut active_rosca_order);		
			}

			let rosca_rounds = Self::generate_rounds(active_rosca_order.clone(), current_timestamp, pending_rosca.contribution_frequency)?;

			let first_eligible_claimant = &active_rosca_order[active_rosca_order.len() - 1];
			EligibleClaimant::<T>::insert(rosca_id, first_eligible_claimant);

			active_rosca_order.try_rotate_right(1).map_err(|_| Error::<T>::ArithmeticError)?;

			ActiveRoscaParticipantsOrder::<T>::insert(rosca_id, active_rosca_order);


			let next_pay_by_timestamp = current_timestamp.checked_add(&pending_rosca.contribution_frequency).ok_or(Error::<T>::ArithmeticOverflow)?;
			let mut final_pay_by_timestamp: <T as pallet_timestamp::Config>::Moment = next_pay_by_timestamp;
			for _ in 1..current_pending_participant_count {
				final_pay_by_timestamp = final_pay_by_timestamp.checked_add(&pending_rosca.contribution_frequency).ok_or(Error::<T>::ArithmeticOverflow)?;
			}

			NextPayByTimestamp::<T>::insert(rosca_id, next_pay_by_timestamp);
			FinalPayByTimestamp::<T>::insert(rosca_id, final_pay_by_timestamp);

			ActiveRoscas::<T>::insert(rosca_id, pending_rosca);	
			PendingRoscaDetails::<T>::remove(rosca_id);

			
			Self::deposit_event(Event::<T>::RoscaStarted {
				rosca_id,
				started_by: signer,
				rounds: rosca_rounds
			});

			Ok(())

		}

		#[pallet::call_index(4)]
		pub fn contribute_to_rosca(origin: OriginFor<T>, rosca_id: RoscaId) -> DispatchResult {

			let signer = ensure_signed(origin)?;
			ensure!(Self::participants(rosca_id, &signer).is_some(), Error::<T>::NotAParticipant);
			ensure!(Self::completed_roscas(rosca_id).is_none(), Error::<T>::RoscaAlreadyCompleted);
			let rosca = Self::active_roscas(rosca_id).ok_or(Error::<T>::RoscaNotActive)?;
			let mut eligible_claimant = Self::eligible_claimant(rosca_id).ok_or(Error::<T>::NoEligbleClaimant)?;
			
			ensure!(eligible_claimant != signer, Error::<T>::CantContributeToSelf);
			ensure!(Self::current_contributors(rosca_id, &signer).is_none(), Error::<T>::AlreadyContributed);

			let current_timestamp = <pallet_timestamp::Pallet<T>>::get();
			let final_pay_by_timestamp = Self::final_pay_by_timestamp(rosca_id).ok_or(Error::<T>::FinalPayByTimestampNotFound)?;
			let mut next_pay_by_timestamp = Self::next_pay_by_timestamp(rosca_id).ok_or(Error::<T>::NoNextPayByTimestamp)?;

			let mut active_rosca_participants_order = Self::active_rosca_participants_order(rosca_id).ok_or(Error::<T>::RoscaParticipantsNotFound)?;

			let rosca_account_id = Self::rosca_account_id(rosca_id);


			while current_timestamp >= next_pay_by_timestamp {
				// Process any missed contributions for the current round.
				Self::process_defaulters(rosca_id)?;
				// Advance the round: update timing, rotate the order, and clear contributions.
				Self::advance_rosca_round(rosca_id)?;
				// Check if, after advancing, the ROSCA should be marked complete.
				Self::check_and_complete_rosca(rosca_id)?;
				// Update local variable for the loop condition.
				next_pay_by_timestamp = Self::next_pay_by_timestamp(rosca_id)
					.ok_or(Error::<T>::NoNextPayByTimestamp)?;
				active_rosca_participants_order = Self::active_rosca_participants_order(rosca_id)
					.ok_or(Error::<T>::RoscaParticipantsNotFound)?;
				eligible_claimant = Self::eligible_claimant(rosca_id)
					.ok_or(Error::<T>::NoEligbleClaimant)?;
			}

			// If we are here we must have caught up to the current round
			
			T::ForeignCurrency::transfer(rosca.payment_asset.id(), &signer, &eligible_claimant, rosca.contribution_amount.into(), Expendable)?;
			CurrentContributors::<T>::insert(rosca_id, &signer, ());
			let current_contribution_count = Self::current_contribution_count(rosca_id).checked_add(1).ok_or(Error::<T>::ArithmeticOverflow)?;
			CurrentContributionCount::<T>::insert(rosca_id, current_contribution_count);

			Self::deposit_event(Event::<T>::ContributionMade {
				rosca_id,
				contributor: signer.clone(),
				recipient: eligible_claimant.clone(),
				amount: rosca.contribution_amount.into(),
			});


			if current_contribution_count == (active_rosca_participants_order.len() - 1) as u32 {
				// This means it's the final contribution for the round so we can progress

				next_pay_by_timestamp = next_pay_by_timestamp.checked_add(&rosca.contribution_frequency).ok_or(Error::<T>::ArithmeticOverflow)?;

				if next_pay_by_timestamp > final_pay_by_timestamp {
					// Means it was the final contribution of the final round
					CompletedRoscas::<T>::insert(rosca_id, ());
					ActiveRoscas::<T>::remove(rosca_id);
					Self::deposit_event(Event::<T>::RoscaComplete {
						rosca_id,
					});
					return Ok(());
				}

				NextPayByTimestamp::<T>::insert(rosca_id, next_pay_by_timestamp);

				eligible_claimant = active_rosca_participants_order[active_rosca_participants_order.len() - 1 as usize].clone();
				EligibleClaimant::<T>::insert(rosca_id, &eligible_claimant);
				active_rosca_participants_order.try_rotate_right(1).map_err(|_| Error::<T>::ArithmeticError)?;
				ActiveRoscaParticipantsOrder::<T>::insert(rosca_id, active_rosca_participants_order.clone());
				CurrentContributors::<T>::clear_prefix(rosca_id, (active_rosca_participants_order.len() - 1) as u32, None);
				CurrentContributionCount::<T>::insert(rosca_id, 0);

				Self::deposit_event(Event::<T>::NewRoundStarted {
					rosca_id,
					new_eligible_recipient: eligible_claimant.clone(),
				});
			}

			
			Ok(())
		}

		#[pallet::call_index(5)]
		pub fn manually_end_rosca(origin: OriginFor<T>, rosca_id: RoscaId) -> DispatchResult {
			let _signer = ensure_signed(origin)?;
			let rosca = Self::active_roscas(rosca_id).ok_or(Error::<T>::RoscaNotActive)?;
			let current_timestamp = <pallet_timestamp::Pallet<T>>::get();
			let final_pay_by_timestamp = Self::final_pay_by_timestamp(rosca_id)
				.ok_or(Error::<T>::FinalPayByTimestampNotFound)?;
			
			// Ensure the final pay-by timestamp is in the past.
			ensure!(current_timestamp > final_pay_by_timestamp, Error::<T>::FinalPayByTimestampMustBePast);

			// Process rounds until the next payment timestamp exceeds the final pay-by timestamp.
			while let Some(next_pay_by) = Self::next_pay_by_timestamp(rosca_id) {
				if next_pay_by <= final_pay_by_timestamp {
					// Process missed contributions and update round state.
					Self::process_defaulters(rosca_id)?;
					Self::advance_rosca_round(rosca_id)?;
				} else {
					break;
				}
			}

			// Check that we've processed the final round:
			let next_pay_by = Self::next_pay_by_timestamp(rosca_id)
				.ok_or(Error::<T>::NoNextPayByTimestamp)?;
			ensure!(
				next_pay_by == final_pay_by_timestamp.checked_add(&rosca.contribution_frequency)
					.ok_or(Error::<T>::ArithmeticOverflow)?,
				Error::<T>::ArithmeticError
			);

			// Mark the ROSCA as complete.
			CompletedRoscas::<T>::insert(rosca_id, ());
			ActiveRoscas::<T>::remove(rosca_id);
			Self::deposit_event(Event::<T>::RoscaComplete { rosca_id });
			Ok(())
		}


		#[pallet::call_index(6)]
		pub fn claim_security_deposit(origin: OriginFor<T>, rosca_id: RoscaId, asset: PaymentAssets) -> DispatchResult {
			let signer = ensure_signed(origin)?;	
			let current_timestamp = <pallet_timestamp::Pallet<T>>::get();
			let final_pay_by_timestamp = Self::final_pay_by_timestamp(rosca_id).ok_or(Error::<T>::FinalPayByTimestampNotFound)?;
			
			ensure!(current_timestamp > final_pay_by_timestamp, Error::<T>::FinalPayByTimestampMustBePast);
			ensure!(Self::rosca_details(rosca_id).is_some() || Self::completed_roscas(rosca_id).is_some(), Error::<T>::RoscaStillActive);
			let mut participant_deposit = Self::security_deposit(rosca_id, &signer).ok_or(Error::<T>::SecurityDepositNotFound)?;
			ensure!(participant_deposit > 0, Error::<T>::SecurityDepositIsZero);
			let rosca_account_id = Self::rosca_account_id(rosca_id);

			T::ForeignCurrency::transfer(
				asset.id(), 
				&rosca_account_id, 
				&signer, 
				participant_deposit.into(),
				Expendable
			)?;
			RoscaSecurityDeposits::<T>::remove(rosca_id, &signer);
			Self::deposit_event(Event::<T>::SecurityDepositClaimed {
				rosca_id,
				depositor: signer
			});

			Ok(())
		}

		#[pallet::call_index(7)]
		pub fn add_to_security_deposit(origin: OriginFor<T>, rosca_id: RoscaId, amount: u32) -> DispatchResult {
			let signer = ensure_signed(origin)?;
			ensure!(Self::participants(rosca_id, &signer).is_some(), Error::<T>::NotAParticipant);
			ensure!(Self::completed_roscas(rosca_id).is_none(), Error::<T>::RoscaAlreadyCompleted);
			let rosca_account_id = Self::rosca_account_id(rosca_id);
			let rosca = Self::active_roscas(rosca_id)
				.or_else(|| Self::rosca_details(rosca_id))
				.ok_or_else(|| Error::<T>::RoscaNotFound)?;
			T::ForeignCurrency::transfer(
					rosca.payment_asset.id(), 
					&signer, 
					&rosca_account_id, 
					amount.into(), 
					Expendable
				)?;
			let mut participant_deposit = Self::security_deposit(rosca_id, &signer).unwrap_or(0);
			let new_deposit_balance = participant_deposit.checked_add(amount).ok_or(Error::<T>::ArithmeticOverflow)?;
			RoscaSecurityDeposits::<T>::insert(rosca_id, &signer, new_deposit_balance);
			Self::deposit_event(Event::<T>::SecurityDepositContribution {
				rosca_id,
				depositor: signer
			});
			Ok(())
		}
	}
}

impl<T: Config> Pallet<T> {
	pub fn rosca_account_id(rosca_id: RoscaId) -> T::AccountId {
		T::PalletId::get().into_sub_account_truncating(rosca_id)
	}

	pub fn shuffle_participants(participants: &mut BoundedVec<AccountIdOf<T>, T::MaxParticipants>) {
		// Fisher-Yates Shuffle
		let current_block = <frame_system::Pallet<T>>::block_number();
		let block_hash = <frame_system::Pallet<T>>::block_hash(current_block);
		let truncated_seed = blake2_128(block_hash.as_ref()); // Truncate to 16 bytes for the shuffle
		
		let mut rng_seed = truncated_seed;

		let mut available_indices: Vec<usize> = (0..participants.len()).collect(); 
		let mut shuffled_indices = Vec::with_capacity(participants.len());

		while !available_indices.is_empty() {

			let mut rng_seed = &blake2_128(&rng_seed[..]);


			let random_index = (rng_seed[0] as usize) % available_indices.len();
			let selected_index = available_indices[random_index];


			shuffled_indices.push(selected_index);
			available_indices.remove(random_index);
		}

		let mut shuffled_participants = participants.clone();
		for (i, &new_idx) in shuffled_indices.iter().enumerate() { 
			shuffled_participants[i] = participants[new_idx].clone();
		}

		*participants = shuffled_participants;
	}

	
}

impl<T: Config> Pallet<T> {
    /// Processes missed contributions for the current round.
    /// For each participant (other than the eligible claimant) who has not contributed,
    /// check their security deposit and, if insufficient, mark them as defaulters.
    fn process_defaulters(rosca_id: RoscaId) -> DispatchResult {
        // Retrieve required state items.
        let rosca = Self::active_roscas(rosca_id).ok_or(Error::<T>::RoscaNotActive)?;
        let eligible_claimant = Self::eligible_claimant(rosca_id).ok_or(Error::<T>::NoEligbleClaimant)?;
        let active_order = Self::active_rosca_participants_order(rosca_id)
            .ok_or(Error::<T>::RoscaParticipantsNotFound)?;
        let rosca_account_id = Self::rosca_account_id(rosca_id);

        // Iterate through each participant.
        for participant in active_order.iter() {
            if *participant == eligible_claimant {
                continue; // Skip the eligible claimant.
            }
            if Self::current_contributors(rosca_id, participant).is_none() {
                // Participant has not contributed in the current round.
                let mut participant_deposit = Self::security_deposit(rosca_id, participant).unwrap_or(0);
                let mut defaulter = false;

                if participant_deposit < rosca.contribution_amount {
                    // Insufficient deposit: mark as defaulter.
                    defaulter = true;
                    if participant_deposit > 0 {
                        // Transfer whatever deposit is available.
						T::ForeignCurrency::transfer(
							rosca.payment_asset.id(), 
							&rosca_account_id, 
							&eligible_claimant, 
							participant_deposit.into(), 
							Expendable
						)?;
                        RoscaSecurityDeposits::<T>::insert(rosca_id, participant, 0);
                        Self::deposit_event(Event::<T>::DepositDeducted {
                            rosca_id,
                            contributor: participant.clone(),
                            recipient: eligible_claimant.clone(),
                            amount: participant_deposit.into(),
                            sufficient: false,
                        });
                    }
                } else {
                    // Sufficient deposit: deduct the fixed contribution amount.
					T::ForeignCurrency::transfer(
						rosca.payment_asset.id(), 
						&rosca_account_id, 
						&eligible_claimant, 
						rosca.contribution_amount.into(),
						Expendable
					)?;
                    let remaining = participant_deposit
                        .checked_sub(rosca.contribution_amount)
                        .unwrap_or(0);
                    RoscaSecurityDeposits::<T>::insert(rosca_id, participant, remaining);
                    Self::deposit_event(Event::<T>::DepositDeducted {
                        rosca_id,
                        contributor: participant.clone(),
                        recipient: eligible_claimant.clone(),
                        amount: rosca.contribution_amount.into(),
                        sufficient: true,
                    });
                }

                if defaulter {
                    DefaultCount::<T>::mutate(rosca_id, participant, |count| {
                        *count = count.saturating_add(1)
                    });
                    Self::deposit_event(Event::<T>::ParticipantDefaulted {
                        rosca_id,
                        participant: participant.clone(),
                    });
                }
            }
        }
        Ok(())
    }

    /// Advances the ROSCA round.
    /// This updates the next payment timestamp, rotates the order of participants,
    /// updates the eligible claimant, and clears the current round’s contributions.
    fn advance_rosca_round(rosca_id: RoscaId) -> DispatchResult {
        let rosca = Self::active_roscas(rosca_id).ok_or(Error::<T>::RoscaNotActive)?;
        let mut next_pay_by_timestamp = Self::next_pay_by_timestamp(rosca_id)
            .ok_or(Error::<T>::NoNextPayByTimestamp)?;

        // Advance to the next round by adding the contribution frequency.
        next_pay_by_timestamp = next_pay_by_timestamp
            .checked_add(&rosca.contribution_frequency)
            .ok_or(Error::<T>::ArithmeticOverflow)?;
        NextPayByTimestamp::<T>::insert(rosca_id, next_pay_by_timestamp);

        // Rotate the active participants order and update the eligible claimant.
		let mut active_order = Self::active_rosca_participants_order(rosca_id)
            .ok_or(Error::<T>::RoscaParticipantsNotFound)?;

		let new_eligible = active_order[active_order.len() - 1].clone();
        EligibleClaimant::<T>::insert(rosca_id, new_eligible.clone());

        active_order
            .try_rotate_right(1)
            .map_err(|_| Error::<T>::ArithmeticError)?;
        ActiveRoscaParticipantsOrder::<T>::insert(rosca_id, active_order.clone());
        

        // Clear the contributions and reset the contribution count.
        let count_to_clear = (active_order.len() - 1) as u32;
        CurrentContributors::<T>::clear_prefix(rosca_id, count_to_clear, None);
        CurrentContributionCount::<T>::insert(rosca_id, 0);

        // Emit an event to signal the start of a new round.
        Self::deposit_event(Event::<T>::NewRoundStarted {
            rosca_id,
            new_eligible_recipient: new_eligible,
        });
        Ok(())
    }

    /// Checks if the ROSCA should be completed and, if so, finalizes it.
    fn check_and_complete_rosca(rosca_id: RoscaId) -> DispatchResult {
        let rosca = Self::active_roscas(rosca_id).ok_or(Error::<T>::RoscaNotActive)?;
        let final_pay_by_timestamp = Self::final_pay_by_timestamp(rosca_id)
            .ok_or(Error::<T>::FinalPayByTimestampNotFound)?;
        let next_pay_by_timestamp = Self::next_pay_by_timestamp(rosca_id)
            .ok_or(Error::<T>::NoNextPayByTimestamp)?;

        if next_pay_by_timestamp > final_pay_by_timestamp {
            // If the next payment time is past the final deadline, complete the ROSCA.
            CompletedRoscas::<T>::insert(rosca_id, ());
            ActiveRoscas::<T>::remove(rosca_id);
            Self::deposit_event(Event::<T>::RoscaComplete { rosca_id });
        }
        Ok(())
    }

	/// Generate the future round data
	pub fn generate_rounds(
		participants: BoundedVec<AccountIdOf<T>, T::MaxParticipants>,
		current_time: T::Moment,
		frequency: T::Moment,
	) -> Result<RoscaRounds<T>, Error<T>> {

		let mut rounds: RoscaRounds<T> = BoundedVec::new();
	
		let mut payment_cutoff = current_time;
	
		for (i, recipient) in participants.iter().rev().enumerate() {
			// Get everyone except the recipient
			let others: Vec<_> = participants
				.iter()
				.filter(|x| *x != recipient)
				.cloned()
				.collect();
	
			// Convert to BoundedVec
			let expected_contributors: BoundedVec<AccountIdOf<T>, T::MaxInvitedParticipants> =
				BoundedVec::try_from(others)
					.map_err(|_| Error::<T>::TooManyProposedParticipants)?;
	
			let round = RoundInfo::<T> {
				round_number: (i + 1) as u32,
				payment_cutoff,
				expected_contributors,
				recipient: recipient.clone(),
			};
	
			rounds.try_push(round).map_err(|_| Error::<T>::TooManyRounds)?;
			payment_cutoff = payment_cutoff.checked_add(&frequency).ok_or(Error::<T>::ArithmeticOverflow)?;;
		}
	
		Ok(rounds)
	}
}

