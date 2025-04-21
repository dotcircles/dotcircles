// app/mockData/roscas.ts
import { Rosca } from '@/app/lib/types'; // Define this type based on schema.txt
import { secondsAgo, secondsFromNow } from './helper';

// More diverse participants
const participantsSet1 = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'You']; // 6 participants
const participantsSet2 = ['Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'You']; // 6 participants
const participantsSet3 = ['Mallory', 'Niaj', 'Olivia', 'Peggy', 'Rupert', 'Sybil', 'You']; // 7 participants
const participantsSet4 = ['Trent', 'Victor', 'Walter', 'Xavier', 'Yara', 'Zoe']; // 6 participants (User 'You' is invited)

export const mockInvitedRoscas: Rosca[] = [
  {
    id: 'rosca-invite-1', // Existing one, updated participant count
    roscaId: 101,
    name: 'Team Lunch Fund',
    creator: 'Alice',
    randomOrder: false,
    totalParticipants: 6, // Updated
    minParticipants: 5,   // Updated
    contributionAmount: BigInt(2000), // $20.00
    contributionFrequency: BigInt(604800), // Weekly
    startTimestamp: secondsFromNow(86400 * 7), // ~1 week from now
    completed: false,
    eligibleParticipants: ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'You'], // Updated
    startedBy: null,
    status: 'Pending',
    rounds: [],
  },
  {
    id: 'rosca-invite-2',
    roscaId: 102,
    name: 'Project Phoenix Hardware',
    creator: 'Walter',
    randomOrder: true,
    totalParticipants: 6,
    minParticipants: 6,
    contributionAmount: BigInt(5000), // $50.00
    contributionFrequency: BigInt(1209600), // Bi-weekly
    startTimestamp: secondsFromNow(86400 * 10),
    completed: false,
    eligibleParticipants: [...participantsSet4, 'You'], // You are invited
    startedBy: null,
    status: 'Pending',
    rounds: [],
  },
];

export const mockJoinedRoscas: Rosca[] = [
  // --- Active ---
  {
    id: 'rosca-active-1', // Existing one, updated participant count
    roscaId: 201,
    name: 'Monthly Savings Pool',
    creator: 'Bob',
    randomOrder: true,
    totalParticipants: 6, // Updated
    minParticipants: 5, // Updated
    contributionAmount: BigInt(10000), // $100.00
    contributionFrequency: BigInt(2592000), // Monthly
    startTimestamp: secondsAgo(86400 * 40), // Started ~40 days ago
    completed: false,
    eligibleParticipants: participantsSet1, // User is part of this set
    startedBy: 'Bob',
    status: 'Active',
    rounds: [], // Fetched in details view
  },
  {
    id: 'rosca-active-2',
    roscaId: 204,
    name: 'Emergency Fund Top-up',
    creator: 'Frank',
    randomOrder: false,
    totalParticipants: 6,
    minParticipants: 6,
    contributionAmount: BigInt(2500), // $25.00
    contributionFrequency: BigInt(604800), // Weekly
    startTimestamp: secondsAgo(86400 * 15), // Started ~15 days ago
    completed: false,
    eligibleParticipants: participantsSet2, // User is part of this set
    startedBy: 'Frank',
    status: 'Active',
    rounds: [],
  },
  // --- Pending ---
  {
    id: 'rosca-pending-1', // Existing one, updated participant count
    roscaId: 202,
    name: 'Gadget Fund',
    creator: 'You',
    randomOrder: false,
    totalParticipants: 7, // Updated
    minParticipants: 5, // Updated
    contributionAmount: BigInt(5000), // $50.00
    contributionFrequency: BigInt(1209600), // Bi-weekly
    startTimestamp: secondsFromNow(86400 * 5), // ~5 days from now
    completed: false,
    eligibleParticipants: participantsSet3, // User is part of this set
    startedBy: null,
    status: 'Pending',
    rounds: [],
  },
   {
    id: 'rosca-pending-2',
    roscaId: 205,
    name: 'Community Garden Supplies',
    creator: 'Grace',
    randomOrder: true,
    totalParticipants: 6,
    minParticipants: 5,
    contributionAmount: BigInt(1500), // $15.00
    contributionFrequency: BigInt(2592000), // Monthly
    startTimestamp: secondsFromNow(86400 * 12), // ~12 days from now
    completed: false,
    eligibleParticipants: participantsSet2, // User is part of this set
    startedBy: null,
    status: 'Pending',
    rounds: [],
  },
  // --- Completed ---
   {
    id: 'rosca-completed-1', // Existing one, updated participant count
    roscaId: 203,
    name: 'Down Payment Booster',
    creator: 'David',
    randomOrder: true,
    totalParticipants: 6, // Updated
    minParticipants: 6, // Updated
    contributionAmount: BigInt(20000), // $200.00
    contributionFrequency: BigInt(2592000), // Monthly
    startTimestamp: secondsAgo(86400 * 200), // Started ~200 days ago
    completed: true,
    eligibleParticipants: participantsSet1, // User is part of this set
    startedBy: 'David',
    status: 'Completed',
    rounds: [], // Fetched in details view
  },
   {
    id: 'rosca-completed-2',
    roscaId: 206,
    name: 'Charity Drive Q1',
    creator: 'Judy',
    randomOrder: false,
    totalParticipants: 6,
    minParticipants: 5,
    contributionAmount: BigInt(5000), // $50.00
    contributionFrequency: BigInt(1209600), // Bi-weekly
    startTimestamp: secondsAgo(86400 * 100), // Started ~100 days ago
    completed: true,
    eligibleParticipants: participantsSet2, // User is part of this set
    startedBy: 'Judy',
    status: 'Completed',
    rounds: [],
  },
];