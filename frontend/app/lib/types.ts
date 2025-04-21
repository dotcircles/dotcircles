// Basic types mirroring schema.txt - expand as needed

export interface Rosca {
  id: string; // Use the GraphQL ID (string) for client-side keying
  roscaId: number;
  name: string;
  creator: string;
  randomOrder: boolean;
  totalParticipants: number;
  minParticipants: number;
  contributionAmount: bigint;
  contributionFrequency: bigint;
  startTimestamp: bigint;
  completed: boolean;
  eligibleParticipants: string[];
  startedBy: string | null;
  status: 'Pending' | 'Active' | 'Completed'; // Added status
  rounds: Round[]; // Often fetched on demand
  currentRoundNumber?: number; // Optional UI helper
  nextPaymentDue?: bigint; // Optional UI helper
}

export interface Round {
  id: string;
  parentRoscaId: string; // Reference back to the Rosca's client-side ID
  chainRoscaId: number;
  roundNumber: number;
  paymentCutoff: bigint;
  expectedContributors: string[];
  recipient: string;
  defaulters: string[];
  contributors?: string[]; // Added for UI
  contributionDetails?: { [contributor: string]: { timestamp: bigint } }; // Added for UI
}