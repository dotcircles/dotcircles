use crate as pallet_rosca;
use frame_support::{
	derive_impl, weights::constants::RocksDbWeight, parameter_types,
	traits::AsEnsureOriginWithArg,
};
use frame_system::{mocking::MockBlock, GenesisConfig, EnsureSigned, EnsureRoot};
use sp_runtime::{
	traits::{ConstU64, ConstU32, ConstU128, IdentifyAccount, Verify, BlakeTwo256}, 
	BuildStorage, MultiSignature,
};
use sp_runtime::traits::IdentityLookup;

type Balance = u128;
// pub type BlockNumber = u32;
use frame_support::PalletId;

pub type AccountId = <<Signature as Verify>::Signer as IdentifyAccount>::AccountId;
pub type Signature = MultiSignature;
pub type AccountPublic = <Signature as Verify>::Signer;

type Block = frame_system::mocking::MockBlock<Test>;

frame_support::construct_runtime!(
	pub enum Test
	{
		System: frame_system,
		Balances: pallet_balances,
		RoscaPallet: pallet_rosca,
		Timestamp: pallet_timestamp,
		Assets: pallet_assets,
	}
);

#[derive_impl(frame_system::config_preludes::ParaChainDefaultConfig as frame_system::DefaultConfig)]
impl frame_system::Config for Test {
	type RuntimeCall = RuntimeCall;
	type Nonce = u32;
	type Block = Block;
	type Hash = sp_core::H256;
	type Hashing = BlakeTwo256;
	type AccountId = u64;
	type Lookup = IdentityLookup<Self::AccountId>;
	type RuntimeEvent = RuntimeEvent;
	type RuntimeOrigin = RuntimeOrigin;
	type BlockHashCount = ConstU64<250>;
	type Version = ();
	type PalletInfo = PalletInfo;
	type AccountData = pallet_balances::AccountData<u128>;
	type OnNewAccount = ();
	type OnKilledAccount = ();
	type DbWeight = ();
	type BaseCallFilter = frame_support::traits::Everything;
	type SystemWeightInfo = ();
	type BlockWeights = ();
	type BlockLength = ();
	type SS58Prefix = ();
	type OnSetCode = ();
	type MaxConsumers = frame_support::traits::ConstU32<16>;
	type RuntimeTask = ();
}

impl pallet_balances::Config for Test {
	type Balance = u128;
	type DustRemoval = ();
	type RuntimeEvent = RuntimeEvent;
	type ExistentialDeposit = ConstU128<10>;
	type AccountStore = System;
	type MaxLocks = ();
	type MaxReserves = ();
	type ReserveIdentifier = [u8; 8];
	type WeightInfo = ();
	type RuntimeHoldReason = RuntimeHoldReason;
	type RuntimeFreezeReason = RuntimeFreezeReason;
	type FreezeIdentifier = ();
	type MaxFreezes = ();
}

parameter_types! {
    pub const AssetDeposit: Balance = 10;
    pub const ApprovalDeposit: Balance = 0;
    pub const StringLimit: u32 = 50;
    pub const RemoveItemsLimit: u32 = 1000;
}

impl pallet_assets::Config for Test {
    type ApprovalDeposit = ApprovalDeposit;
    type AssetAccountDeposit = ConstU128<1>;
    type AssetDeposit = AssetDeposit;
    type AssetId = u32;
    type AssetIdParameter = parity_scale_codec::Compact<u32>;
    type Balance = Balance;
    #[cfg(feature = "runtime-benchmarks")]
    type BenchmarkHelper = ();
    type CallbackHandle = ();
    type CreateOrigin = AsEnsureOriginWithArg<EnsureSigned<u64>>;
    type Currency = Balances;
    type Extra = ();
    type ForceOrigin = EnsureRoot<u64>;
    type Freezer = ();
    type MetadataDepositBase = ConstU128<1>;
    type MetadataDepositPerByte = ConstU128<1>;
    type RemoveItemsLimit = RemoveItemsLimit;
    type RuntimeEvent = RuntimeEvent;
    type StringLimit = StringLimit;
    /// Rerun benchmarks if you are making changes to runtime configuration.
    type WeightInfo = ();
}

parameter_types! {
	pub const RoscaPalletId: PalletId = PalletId(*b"py/rosca");
}

impl crate::Config for Test {
	type RuntimeEvent = RuntimeEvent;
	type ForeignCurrency = Assets;
	type MaxParticipants = ConstU32<150>;
	type MaxInvitedParticipants = ConstU32<149>;
	type PalletId = RoscaPalletId;
	type StringLimit = ConstU32<50>;
}

parameter_types! {
    pub const MinimumPeriod: u64 = 5; // Example: 5ms (adjust as needed for tests)
}

// Implement pallet_timestamp for Test.
impl pallet_timestamp::Config for Test {
    // For testing, a simple u64 is sufficient.
    type Moment = u64;
    // We don't need any on-set logic here.
    type OnTimestampSet = ();
    // The minimum period between timestamps.
    type MinimumPeriod = MinimumPeriod;
    // No weight info is needed for testing.
    type WeightInfo = ();
}


// Build genesis storage according to the mock runtime.
pub fn new_test_ext() -> sp_io::TestExternalities {
	let mut test = GenesisConfig::<Test>::default().build_storage().unwrap();

	pallet_assets::GenesisConfig::<Test> {
		assets: vec![(1984, 0, true, 1)],
		metadata: vec![(1984, "Usdt".into(), "Usdt".into(), 0)],
		accounts: vec![
			(1984, 0, 10_000),
			(1984, 1, 10_000),
			(1984, 2, 10_000),
			(1984, 3, 10_000),
			(1984, 4, 50),
		],
	}
	.assimilate_storage(&mut test)
	.unwrap();

	pallet_assets::GenesisConfig::<Test> {
		assets: vec![(1337, 0, true, 1)],
		metadata: vec![(1337, "Usdc".into(), "Usdc".into(), 0)],
		accounts: vec![
			(1337, 0, 10_000),
			(1337, 1, 10_000),
			(1337, 2, 10_000),
			(1337, 3, 10_000),
			(1337, 4, 50),
		],
	}
	.assimilate_storage(&mut test)
	.unwrap();

	test.into()
}

