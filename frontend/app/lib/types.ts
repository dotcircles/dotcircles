/* -------------------------------------------------------------------------- */
/*  Shared domain models for the frontend                                     */
/* -------------------------------------------------------------------------- */
// NOTE: These interfaces mirror the SubQuery schema one‑to‑one **plus**
// a few client‑only conveniences (e.g. `status`, `contributors`). Keep them
// in sync with the GraphQL fragments you request.

export type RoscaStatus = "Pending" | "Active" | "Completed";

export interface RoscaEligibility {
  accountId: string;   // the wallet that joined
  joinedAt: bigint;    // 0 = not joined yet
}

/**
 * One round (cycle) inside a ROSCA.
 */
export interface Round {
  /** SubQuery entity id (string UUID) */
  id: string;
  /** `parentRosca.id` so we don’t have to nest back‑references */
  parentRoscaId: string;
  /** Chain (smart‑contract) ROSCA id repeated on every round */
  chainRoscaId: number;
  /** Sequential (1‑based) round number */
  roundNumber: number;
  /** UNIX timestamp (seconds) when contributions are due */
  paymentCutoff: bigint;
  /** Wallets expected to pay this round */
  expectedContributors: string[];
  /** Wallets that actually paid – we alias `actualContributors` to this */
  contributors: string[];
  /** Wallets that defaulted in this round */
  defaulters: string[];
  /** Wallet receiving the pot this round */
  recipient: string;
}

/**
 * Top‑level ROSCA entity aggregated with rounds + derived helpers.
 */
export interface Rosca {
  /* ---------- on‑chain / SubQuery fields ---------- */
  id: string;
  roscaId: number;
  name: string;
  creator: string;
  paymentAsset: string;
  randomOrder: boolean;
  totalParticipants: number;
  minParticipants: number;
  contributionAmount: bigint;
  contributionFrequency: bigint;
  startedBy: string | null;
  startTimestamp: bigint;
  completed: boolean;
  eligibleParticipants: string[];
  activeParticipants: string[];
  totalSecurityDeposits: number;
  currentRecipient: string | null;
  currentRoundNumber: number | null;
  currentRoundPaymentCutoff: bigint | null;
  eligibilities: RoscaEligibility[];

  /* ---------- relations ---------- */
  rounds: Round[]; // All historical + future rounds (sorted client‑side)

  /* ---------- client‑derived helpers ---------- */
  /**
   * Convenience status derived from `completed` and `startTimestamp` so UIs
   * don’t repeat the same logic.
   */
  status: RoscaStatus;
}
