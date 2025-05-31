use frame_support::{
    parameter_types,
    traits::{ConstU32, Contains, Everything, Nothing, PalletInfoAccess, ContainsPair, ProcessMessageError},
    weights::Weight, ensure,
};
use frame_system::EnsureRoot;
use pallet_xcm::XcmPassthrough;
use polkadot_parachain_primitives::primitives::Sibling;
use polkadot_runtime_common::impls::ToAuthor;
use xcm::latest::prelude::*;
use xcm_builder::{
    AccountId32Aliases, AllowUnpaidExecutionFrom, AllowTopLevelPaidExecutionFrom,
    DenyReserveTransferToRelayChain, DenyThenTry, EnsureXcmOrigin, FixedWeightBounds,
    FrameTransactionalProcessor, FungibleAdapter, FungiblesAdapter, CreateMatcher,
    IsConcrete, NativeAsset, NoChecking, ParentIsPreset, RelayChainAsNative,
    SiblingParachainAsNative, SiblingParachainConvertsVia, SignedAccountId32AsNative,
    SignedToAccountId32, SovereignSignedViaLocation, TakeWeightCredit, TrailingSetTopicAsId,
    UsingComponents, WithComputedOrigin, WithUniqueTopic, FixedRateOfFungible,
    MatchedConvertedConcreteId, AllowKnownQueryResponses, AllowSubscriptionsFrom,
    MatchXcm,
};
use xcm_executor::{
    traits::{JustTry, ShouldExecute, Properties},
    XcmExecutor,
};
use sp_runtime::traits::MaybeEquivalence;
use sp_std::vec::Vec;

use crate::{
    configs::{
        Balances, ParachainSystem, Runtime, RuntimeCall, RuntimeEvent, RuntimeOrigin,
        WeightToFee, XcmpQueue,
    },
    types::{AccountId, Balance},
    AllPalletsWithSystem, Assets, ParachainInfo, PolkadotXcm,
};

// Asset Hub USDC
pub const USDC_PATH: &[Junction] = &[Parachain(1000), PalletInstance(50), GeneralIndex(1337)];

// Asset Hub USDT
pub const USDT_PATH: &[Junction] = &[Parachain(1000), PalletInstance(50), GeneralIndex(1984)];

parameter_types! {
    pub const RelayLocation: Location = Location::parent();
    pub const RelayNetwork: Option<NetworkId> = None;
    pub PlaceholderAccount: AccountId = PolkadotXcm::check_account();
    pub AssetsPalletLocation: Location =
        PalletInstance(<Assets as PalletInfoAccess>::index() as u8).into();
    pub RelayChainOrigin: RuntimeOrigin = cumulus_pallet_xcm::Origin::Relay.into();
    pub CheckAccount: AccountId = PolkadotXcm::check_account();
    pub UniversalLocation: InteriorLocation = Parachain(ParachainInfo::parachain_id().into()).into();
    pub UsdtLocation: Location = Location::new(1, [Parachain(1000), PalletInstance(50), GeneralIndex(1984)]);
    pub UsdtPerSecond: (AssetId, u128, u128) = (UsdtLocation::get().into(), 1_000, 1_000);
    pub UsdcLocation: Location = Location::new(1, [Parachain(1000), PalletInstance(50), GeneralIndex(1337)]);
    pub UsdcPerSecond: (AssetId, u128, u128) = (UsdcLocation::get().into(), 1_000, 1_000);
}

/// `AssetId/Balancer` converter for `TrustBackedAssets`
pub type TrustBackedAssetsConvertedConcreteId =
    assets_common::TrustBackedAssetsConvertedConcreteId<AssetsPalletLocation, Balance>;

type AssetIdPalletAssets = u32;

/// Type for specifying how a `Location` can be converted into an
/// `AccountId`. This is used when determining ownership of accounts for asset
/// transacting and when attempting to use XCM `Transact` in order to determine
/// the dispatch Origin.
pub type LocationToAccountId = (
    // The parent (Relay-chain) origin converts to the parent `AccountId`.
    ParentIsPreset<AccountId>,
    // Sibling parachain origins convert to AccountId via the `ParaId::into`.
    SiblingParachainConvertsVia<Sibling, AccountId>,
    // Straight up local `AccountId32` origins just alias directly to `AccountId`.
    AccountId32Aliases<RelayNetwork, AccountId>,
);

/// Means for transacting assets on this chain.
pub type LocalAssetTransactor = FungibleAdapter<
    // Use this currency:
    Balances,
    // Use this currency when it is a fungible asset matching the given location or name:
    IsConcrete<RelayLocation>,
    // Do a simple punn to convert an AccountId32 Location into a native chain account ID:
    LocationToAccountId,
    // Our chain's account ID type (we can't get away without mentioning it explicitly):
    AccountId,
    // We don't track any teleports.
    (),
>;

pub struct SupportedAssets;
impl frame_support::traits::Contains<Location> for SupportedAssets {
	fn contains(location: &Location) -> bool {
		matches!(location.unpack(), (1, USDC_PATH) | (1, USDT_PATH) )
	}
}

impl MaybeEquivalence<Location, AssetIdPalletAssets> for SupportedAssets {
	fn convert(location: &Location) -> Option<AssetIdPalletAssets> {
		match location.unpack() {
            (1, USDC_PATH) => Some(1337),
			(1, USDT_PATH) => Some(1984),
			_ => None,
		}
	}

	fn convert_back(asset_id: &AssetIdPalletAssets) -> Option<Location> {
		match asset_id {
            1337 => Some(UsdcLocation::get()),
			1984 => Some(UsdtLocation::get()),
			_ => None,
		}
	}
}

/// Means for transacting assets besides the native currency on this chain.
pub type FungiblesTransactor = FungiblesAdapter<
    // Use this fungibles implementation:
    Assets,
    // Use this currency when it is a fungible asset matching the given location or name:
    MatchedConvertedConcreteId<AssetIdPalletAssets, Balance, SupportedAssets, SupportedAssets, JustTry>,
    // Convert an XCM MultiLocation into a local account id:
    LocationToAccountId,
    // Our chain's account ID type (we can't get away without mentioning it explicitly):
    AccountId,
    // We don't track any teleports of `Assets`.
    NoChecking,
    // We don't track any teleports of `Assets`, but a placeholder account is provided due to trait
    // bounds.
    CheckAccount,
>;

pub struct AssetHubAssets;
impl ContainsPair<Asset, Location> for AssetHubAssets {
	fn contains(asset: &Asset, source: &Location) -> bool {
		// Ensure source is Polkadot Asset Hub.
		let asset_hub: Location = (Parent, Parachain(1000)).into();
		if &asset_hub != source {
			return false;
		}
		SupportedAssets::contains(&asset.id.0)
	}
}
impl Contains<(Location, Vec<Asset>)> for AssetHubAssets {
	fn contains(item: &(Location, Vec<Asset>)) -> bool {
		// Allow any origin to return reserve assets if they match supported assets.
		let (_, assets) = item;
		assets.iter().all(|asset| SupportedAssets::contains(&asset.id.0))
	}
}

/// Means for transacting assets on this chain.
pub type AssetTransactors = (LocalAssetTransactor, FungiblesTransactor);

/// This is the type we use to convert an (incoming) XCM origin into a local
/// `Origin` instance, ready for dispatching a transaction with Xcm's
/// `Transact`. There is an `OriginKind` which can biases the kind of local
/// `Origin` it will become.
pub type XcmOriginToTransactDispatchOrigin = (
    // Sovereign account converter; this attempts to derive an `AccountId` from the origin location
    // using `LocationToAccountId` and then turn that into the usual `Signed` origin. Useful for
    // foreign chains who want to have a local sovereign account on this chain which they control.
    SovereignSignedViaLocation<LocationToAccountId, RuntimeOrigin>,
    // Native converter for Relay-chain (Parent) location; will convert to a `Relay` origin when
    // recognized.
    RelayChainAsNative<RelayChainOrigin, RuntimeOrigin>,
    // Native converter for sibling Parachains; will convert to a `SiblingPara` origin when
    // recognized.
    SiblingParachainAsNative<cumulus_pallet_xcm::Origin, RuntimeOrigin>,
    // Native signed account converter; this just converts an `AccountId32` origin into a normal
    // `RuntimeOrigin::Signed` origin of the same 32-byte value.
    SignedAccountId32AsNative<RelayNetwork, RuntimeOrigin>,
    // Xcm origins can be represented natively under the Xcm pallet's Xcm origin.
    XcmPassthrough<RuntimeOrigin>,
);

parameter_types! {
    // One XCM operation is 1_000_000_000 weight - almost certainly a conservative estimate.
    pub const UnitWeightCost: Weight = Weight::from_parts(1_000_000_000, 64 * 1024);
    pub const MaxInstructions: u32 = 100;
    pub const MaxAssetsIntoHolding: u32 = 64;
}

pub struct ParentOrParentsExecutivePlurality;
impl Contains<Location> for ParentOrParentsExecutivePlurality {
    fn contains(location: &Location) -> bool {
        matches!(location.unpack(), (1, []) | (1, [Plurality { id: BodyId::Executive, .. }]))
    }
}

pub struct AssetHubParachain;
impl Contains<Location> for AssetHubParachain {
	fn contains(location: &Location) -> bool {
		matches!(location.unpack(), (1, [Parachain(1000)]))
	}
}

pub struct ParentOrSiblings;
impl Contains<Location> for ParentOrSiblings {
	fn contains(location: &Location) -> bool {
		matches!(location.unpack(), (1, []) | (1, [Parachain(_)]))
	}
}

pub type Barrier = TrailingSetTopicAsId<
    DenyThenTry<
        DenyReserveTransferToRelayChain,
        (
			TakeWeightCredit,
			// Expected responses are OK.
			AllowKnownQueryResponses<PolkadotXcm>,
			// Allow XCMs with some computed origins to pass through.
			WithComputedOrigin<
                (
                    // HRMP notifications from relay get free pass
					AllowHrmpNotificationsFromRelayChain,
					// If the message is one that immediately attemps to pay for execution, then
					// allow it.
					AllowTopLevelPaidExecutionFrom<Everything>,
					// Parent, its pluralities (i.e. governance bodies), and the Fellows plurality
					// get free execution.
					AllowUnpaidExecutionFrom<(AssetHubParachain, ParentOrParentsExecutivePlurality)>,
					// Subscriptions for version tracking are OK.
					AllowSubscriptionsFrom<ParentOrSiblings>,
                ),
                UniversalLocation,
                ConstU32<8>,
            >,
        ),
    >,
>;

pub type Reserves = (NativeAsset, AssetHubAssets);

pub struct XcmConfig;
impl xcm_executor::Config for XcmConfig {
    type Aliasers = Nothing;
    type AssetClaims = PolkadotXcm;
    type AssetExchanger = ();
    type AssetLocker = ();
    // How to withdraw and deposit an asset.
    type AssetTransactor = AssetTransactors;
    type AssetTrap = PolkadotXcm;
    type Barrier = Barrier;
    type CallDispatcher = RuntimeCall;
    /// When changing this config, keep in mind, that you should collect fees.
    type FeeManager = ();
    type HrmpChannelAcceptedHandler = ();
    type HrmpChannelClosingHandler = ();
    type HrmpNewChannelOpenRequestHandler = ();
    /// Please, keep these two configs (`IsReserve` and `IsTeleporter`) mutually exclusive
    type IsReserve = Reserves;
    type IsTeleporter = ();
    type MaxAssetsIntoHolding = MaxAssetsIntoHolding;
    type MessageExporter = ();
    type OriginConverter = XcmOriginToTransactDispatchOrigin;
    type PalletInstancesInfo = AllPalletsWithSystem;
    type ResponseHandler = PolkadotXcm;
    type RuntimeCall = RuntimeCall;
    type SafeCallFilter = Nothing;
    type SubscriptionService = PolkadotXcm;
    type Trader = (
        UsingComponents<WeightToFee, RelayLocation, AccountId, Balances, ToAuthor<Runtime>>,
        FixedRateOfFungible<UsdcPerSecond, ()>,
        FixedRateOfFungible<UsdtPerSecond, ()>,
    );
    type TransactionalProcessor = FrameTransactionalProcessor;
    type UniversalAliases = Nothing;
    // Teleporting is disabled.
    type UniversalLocation = UniversalLocation;
    type Weigher = FixedWeightBounds<UnitWeightCost, RuntimeCall, MaxInstructions>;
    type XcmSender = XcmRouter;
}

/// No local origins on this chain are allowed to dispatch XCM sends/executions.
pub type LocalOriginToLocation = SignedToAccountId32<RuntimeOrigin, AccountId, RelayNetwork>;

/// The means for routing XCM messages which are not for local execution into
/// the right message queues.
pub type XcmRouter = WithUniqueTopic<(
    // Two routers - use UMP to communicate with the relay chain:
    cumulus_primitives_utility::ParentAsUmp<ParachainSystem, (), ()>,
    // ..and XCMP to communicate with the sibling chains.
    XcmpQueue,
)>;

parameter_types! {
    pub const MaxLockers: u32 = 8;
    pub const MaxRemoteLockConsumers: u32 = 0;
}

impl pallet_xcm::Config for Runtime {
    type AdminOrigin = EnsureRoot<AccountId>;
    // ^ Override for AdvertisedXcmVersion default
    type AdvertisedXcmVersion = pallet_xcm::CurrentXcmVersion;
    type Currency = Balances;
    type CurrencyMatcher = ();
    type ExecuteXcmOrigin = EnsureXcmOrigin<RuntimeOrigin, LocalOriginToLocation>;
    type MaxLockers = MaxLockers;
    type MaxRemoteLockConsumers = MaxRemoteLockConsumers;
    type RemoteLockConsumerIdentifier = ();
    type RuntimeCall = RuntimeCall;
    type RuntimeEvent = RuntimeEvent;
    type RuntimeOrigin = RuntimeOrigin;
    type SendXcmOrigin = EnsureXcmOrigin<RuntimeOrigin, LocalOriginToLocation>;
    type SovereignAccountOf = LocationToAccountId;
    type TrustedLockers = ();
    type UniversalLocation = UniversalLocation;
    type Weigher = FixedWeightBounds<UnitWeightCost, RuntimeCall, MaxInstructions>;
    /// Rerun benchmarks if you are making changes to runtime configuration.
    type WeightInfo = pallet_xcm::TestWeightInfo;
    type XcmExecuteFilter = Nothing;
    // ^ Disable dispatchable execute on the XCM pallet.
    // Needs to be `Everything` for local testing.
    type XcmExecutor = XcmExecutor<XcmConfig>;
    type XcmReserveTransferFilter = AssetHubAssets;
    type XcmRouter = XcmRouter;
    type XcmTeleportFilter = Nothing;

    const VERSION_DISCOVERY_QUEUE_SIZE: u32 = 100;
}

impl cumulus_pallet_xcm::Config for Runtime {
    type RuntimeEvent = RuntimeEvent;
    type XcmExecutor = XcmExecutor<XcmConfig>;
}

pub struct AllowHrmpNotificationsFromRelayChain;
impl ShouldExecute for AllowHrmpNotificationsFromRelayChain {
	fn should_execute<RuntimeCall>(
		origin: &Location,
		instructions: &mut [Instruction<RuntimeCall>],
		_max_weight: Weight,
		_properties: &mut Properties,
	) -> Result<(), ProcessMessageError> {
		log::trace!(
			target: "xcm::barriers",
			"AllowHrmpNotificationsFromRelayChain origin: {:?}, instructions: {:?}, max_weight: {:?}, properties: {:?}",
			origin, instructions, _max_weight, _properties,
		);
		// accept only the Relay Chain
		ensure!(matches!(origin.unpack(), (1, [])), ProcessMessageError::Unsupported);
		// accept only HRMP notifications and nothing else
		instructions
			.matcher()
			.assert_remaining_insts(1)?
			.match_next_inst(|inst| match inst {
				HrmpNewChannelOpenRequest { .. } |
				HrmpChannelAccepted { .. } |
				HrmpChannelClosing { .. } => Ok(()),
				_ => Err(ProcessMessageError::BadFormat),
			})?;
		Ok(())
	}
}
