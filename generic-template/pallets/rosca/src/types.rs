
use crate::*;
use frame_support::BoundedVec;
use frame_support::pallet_prelude::*;
use frame_system::pallet_prelude::*;

#[derive(Encode, Decode, Clone, PartialEq, Eq, TypeInfo, Debug)]
#[scale_info(skip_type_params(T))]
pub struct RoscaDetails<T: Config> {
    pub random_order: bool,
    pub number_of_participants: u32,
    pub minimum_participant_threshold: u32,
    pub contribution_amount: u32,
    pub contribution_frequency: <T as pallet_timestamp::Config>::Moment,
    pub start_by_timestamp: <T as pallet_timestamp::Config>::Moment,
    pub name: BoundedVec<u8, <T as Config>::StringLimit>
}

pub type RoscaId = u32;