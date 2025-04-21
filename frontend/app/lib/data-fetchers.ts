// app/lib/data-fetchers.ts
import { mockInvitedRoscas, mockJoinedRoscas } from '@/app/mockData/roscas'; // Adjust path
import { mockRoundsForRosca } from '@/app/mockData/rounds'; // Adjust path
import { Rosca, Round } from '@/app/lib/types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchInvitedRoscas(userId: string): Promise<Rosca[]> {
  console.log(`Fetching invited ROSCAs for user: ${userId}`);
  await delay(500); // Simulate API call
  // In real app, filter based on userId being in eligibleParticipants but not creator/joined
  return mockInvitedRoscas.filter(r => r.eligibleParticipants.includes('You')); // Simple mock filter
}

export async function fetchJoinedRoscas(userId: string): Promise<Rosca[]> {
  console.log(`Fetching joined ROSCAs for user: ${userId}`);
  await delay(700); // Simulate API call
  // In real app, query where userId is a participant (creator or joined)
  return mockJoinedRoscas.filter(r => r.eligibleParticipants.includes('You'));
}

export async function fetchRoscaDetails(roscaId: string): Promise<Rosca | null> {
    console.log(`Fetching details for ROSCA: ${roscaId}`);
    await delay(600);
    const rosca = [...mockInvitedRoscas, ...mockJoinedRoscas].find(r => r.id === roscaId);
    if (rosca) {
        // Fetch related rounds (in real app, this might be part of the initial query or separate)
        rosca.rounds = mockRoundsForRosca[roscaId] || [];
        return rosca;
    }
    return null;
}

// --- Placeholder Blockchain Interaction Functions ---

export async function submitCreateRosca(formData: any): Promise<{ success: boolean, roscaId?: number, error?: string }> {
    console.log("Submitting Create ROSCA:", formData);
    await delay(1500);
    // TODO: Integrate with Polkadot.js API to sign and send extrinsic
    // Example: call api.tx.rosca.createRosca(...)
    alert("Placeholder: Create ROSCA submitted!");
    return { success: true, roscaId: Math.floor(Math.random() * 1000) }; // Simulate success
}

export async function submitJoinRosca(roscaId: number, position?: number): Promise<{ success: boolean, error?: string }> {
    console.log(`Submitting Join ROSCA: ${roscaId}`, `Position: ${position ?? 'any'}`);
    await delay(1000);
    // TODO: Integrate with Polkadot.js API
    alert(`Placeholder: Join ROSCA ${roscaId} submitted!`);
    return { success: true };
}

export async function submitLeaveRosca(roscaId: number): Promise<{ success: boolean, error?: string }> {
    console.log(`Submitting Leave ROSCA: ${roscaId}`);
    await delay(1000);
    // TODO: Integrate with Polkadot.js API
    alert(`Placeholder: Leave ROSCA ${roscaId} submitted!`);
    return { success: true };
}

export async function submitStartRosca(roscaId: number): Promise<{ success: boolean, error?: string }> {
    console.log(`Submitting Start ROSCA: ${roscaId}`);
    await delay(1200);
    // TODO: Integrate with Polkadot.js API
    alert(`Placeholder: Start ROSCA ${roscaId} submitted!`);
    return { success: true };
}

export async function submitContribute(roscaId: number): Promise<{ success: boolean, error?: string }> {
    console.log(`Submitting Contribution for ROSCA: ${roscaId}`);
    await delay(1000);
    // TODO: Integrate with Polkadot.js API
    alert(`Placeholder: Contribution for ROSCA ${roscaId} submitted!`);
    return { success: true };
}

export async function submitAddSecurityDeposit(roscaId: number, amount: number): Promise<{ success: boolean, error?: string }> {
    console.log(`Submitting Add Security Deposit for ROSCA: ${roscaId}, Amount: ${amount}`);
    await delay(1000);
     // TODO: Integrate with Polkadot.js API
    alert(`Placeholder: Deposit added for ROSCA ${roscaId}!`);
    return { success: true };
}

// ... add placeholders for other extrinsics like claim_security_deposit, manually_end_rosca