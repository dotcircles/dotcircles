// app/mockData/rounds.ts
import { Round } from '@/app/lib/types'; // Define this type based on schema.txt
import { secondsAgo, secondsFromNow, getExpected } from './helper';

// Define participant sets again for clarity in this file
const participantsSet1 = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'You'];
const participantsSet2 = ['Frank', 'Grace', 'Heidi', 'Ivan', 'Judy', 'You'];
// const participantsSet3 = ['Mallory', 'Niaj', 'Olivia', 'Peggy', 'Rupert', 'Sybil', 'You']; // Not active/completed yet
// const participantsSet4 = ['Trent', 'Victor', 'Walter', 'Xavier', 'Yara', 'Zoe']; // Invitation only


export const mockRoundsForRosca: { [key: string]: Round[] } = {
  // --- ROSCA active-1 (ID 201, Set1 Participants) --- Updated
  'rosca-active-1': [
    {
      id: 'round-1-active-1', parentRoscaId: 'rosca-active-1', chainRoscaId: 201, roundNumber: 1,
      paymentCutoff: secondsAgo(86400 * 10), // Assuming monthly frequency, started 40 days ago, first cutoff was 10 days ago
      recipient: 'Bob', // Example recipient
      expectedContributors: getExpected(participantsSet1, 'Bob'),
      defaulters: ['Charlie'], // Example defaulter
      contributors: ['Alice', 'David', 'Eve', 'You'],
      contributionDetails: {
         'Alice': { timestamp: secondsAgo(86400 * 12)},
         'David': { timestamp: secondsAgo(86400 * 11)},
         'Eve': { timestamp: secondsAgo(86400 * 10.5)},
         'You': { timestamp: secondsAgo(86400 * 10.1)},
      },
    },
    {
      id: 'round-2-active-1', parentRoscaId: 'rosca-active-1', chainRoscaId: 201, roundNumber: 2,
      paymentCutoff: secondsFromNow(86400 * 20), // Next cutoff is ~20 days from now
      recipient: 'Alice', // Example recipient
      expectedContributors: getExpected(participantsSet1, 'Alice'),
      defaulters: [],
      contributors: ['Bob', 'You'], // Only Bob and You contributed so far
       contributionDetails: {
         'Bob': { timestamp: secondsAgo(86400 * 2)},
         'You': { timestamp: secondsAgo(86400 * 1)},
      },
    },
    // Future rounds (only show structure)
    { id: 'round-3-active-1', parentRoscaId: 'rosca-active-1', chainRoscaId: 201, roundNumber: 3, paymentCutoff: secondsFromNow(86400*20 + 2592000), recipient: 'David', expectedContributors: getExpected(participantsSet1, 'David'), defaulters: []},
    { id: 'round-4-active-1', parentRoscaId: 'rosca-active-1', chainRoscaId: 201, roundNumber: 4, paymentCutoff: secondsFromNow(86400*20 + 2592000*2), recipient: 'Charlie', expectedContributors: getExpected(participantsSet1, 'Charlie'), defaulters: []},
    { id: 'round-5-active-1', parentRoscaId: 'rosca-active-1', chainRoscaId: 201, roundNumber: 5, paymentCutoff: secondsFromNow(86400*20 + 2592000*3), recipient: 'You', expectedContributors: getExpected(participantsSet1, 'You'), defaulters: []},
    { id: 'round-6-active-1', parentRoscaId: 'rosca-active-1', chainRoscaId: 201, roundNumber: 6, paymentCutoff: secondsFromNow(86400*20 + 2592000*4), recipient: 'Eve', expectedContributors: getExpected(participantsSet1, 'Eve'), defaulters: []},
  ],

  // --- ROSCA active-2 (ID 204, Set2 Participants) --- New
  'rosca-active-2': [
    {
        id: 'round-1-active-2', parentRoscaId: 'rosca-active-2', chainRoscaId: 204, roundNumber: 1,
        paymentCutoff: secondsAgo(86400 * 8), // Weekly, started 15 days ago
        recipient: 'Grace',
        expectedContributors: getExpected(participantsSet2, 'Grace'),
        defaulters: [],
        contributors: ['Frank', 'Heidi', 'Ivan', 'Judy', 'You'],
        contributionDetails: { /* Timestamps */ },
    },
    {
        id: 'round-2-active-2', parentRoscaId: 'rosca-active-2', chainRoscaId: 204, roundNumber: 2,
        paymentCutoff: secondsAgo(86400 * 1), // Cutoff was yesterday
        recipient: 'Heidi',
        expectedContributors: getExpected(participantsSet2, 'Heidi'),
        defaulters: ['Ivan'], // Ivan missed this one
        contributors: ['Frank', 'Grace', 'Judy', 'You'],
        contributionDetails: { /* Timestamps */ },
    },
    {
        id: 'round-3-active-2', parentRoscaId: 'rosca-active-2', chainRoscaId: 204, roundNumber: 3,
        paymentCutoff: secondsFromNow(86400 * 6), // Due in 6 days
        recipient: 'Frank',
        expectedContributors: getExpected(participantsSet2, 'Frank'),
        defaulters: [],
        contributors: [], // None yet for current round
        contributionDetails: {},
    },
    // ... Add future rounds structure
  ],

  // --- ROSCA completed-1 (ID 203, Set1 Participants) --- Updated
   'rosca-completed-1': [
        // Generate 6 completed rounds for participantsSet1
        ...participantsSet1.map((recipient, index) => ({
            id: `round-${index+1}-completed-1`,
            parentRoscaId: 'rosca-completed-1',
            chainRoscaId: 203,
            roundNumber: index + 1,
            paymentCutoff: secondsAgo(86400 * (200 - (index * 30))), // Approximate past cutoffs (monthly)
            recipient: recipient,
            expectedContributors: getExpected(participantsSet1, recipient),
            // Simulate some contribution data - make everyone contribute for simplicity here
            contributors: getExpected(participantsSet1, recipient),
            defaulters: [],
            contributionDetails: Object.fromEntries(getExpected(participantsSet1, recipient).map(p => [p, { timestamp: secondsAgo(86400 * (200 - (index * 30) + 2)) }])), // Simulate contribution time
        }))
   ],

  // --- ROSCA completed-2 (ID 206, Set2 Participants) --- New
   'rosca-completed-2': [
        // Generate 6 completed rounds for participantsSet2
         ...participantsSet2.map((recipient, index) => ({
            id: `round-${index+1}-completed-2`,
            parentRoscaId: 'rosca-completed-2',
            chainRoscaId: 206,
            roundNumber: index + 1,
            paymentCutoff: secondsAgo(86400 * (100 - (index * 14))), // Bi-weekly
            recipient: recipient,
            expectedContributors: getExpected(participantsSet2, recipient),
            contributors: getExpected(participantsSet2, recipient),
            defaulters: [],
            contributionDetails: Object.fromEntries(getExpected(participantsSet2, recipient).map(p => [p, { timestamp: secondsAgo(86400 * (100 - (index * 14) + 1)) }])),
        }))
   ]
};