// app/dashboard/rosca/[id]/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';

// --- Component Imports ---
import RoscaDetailHeader from '@/app/components/roscas/RoscaDetailHeader';
import CurrentRoundStatus from '@/app/components/roscas/CurrentRoundStatus';
import RoscaProgressionStepper from '@/app/components/roscas/RoscaProgressionStepper';
import RoscaRoundsHistory from '@/app/components/roscas/RoscaRoundsHistory';
import AddDepositModal from '@/app/components/roscas/AddDepositModal';

// --- HeroUI Imports ---
import { Spinner } from '@heroui/spinner';
import { Spacer } from '@heroui/spacer';
import { useDisclosure } from "@heroui/modal"; // For modal state

// --- Data & Types ---
import { fetchRoscaDetails } from '@/app/lib/data-fetchers';
import { Rosca, Round } from '@/app/lib/types';
import { useSubmitAddToSecurityDeposit } from '@/app/lib/hooks/useSubmitExtrinsic';
import { useWallet } from '@/app/lib/wallet/WalletProvider';
import { addToast } from '@heroui/toast';

// --- Component ---
export default function RoscaDetailsPage() {
    const params = useParams();
    const pathname = usePathname();
    const roscaId = (params?.id as string) ?? pathname.split("/").filter(Boolean).pop() ?? "";

    
    const addToSecurityDeposit = useSubmitAddToSecurityDeposit();

    const [rosca, setRosca] = useState<Rosca | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    // Modal state
    const { isOpen: isDepositModalOpen, onOpen: onDepositModalOpen, onOpenChange: onDepositModalOpenChange, onClose: onDepositModalClose } = useDisclosure();

    const { currentAccount, isWalletLoading } = useWallet()
    const currentUserAddress = currentAccount?.address;

     // Fetching logic
     useEffect(() => {
         if (!roscaId) return;
         if (isWalletLoading) return;
         if (!currentAccount?.address) return;

         async function loadDetails() {
             setIsLoading(true); setError(null);
             try {
                 const details = await fetchRoscaDetails(roscaId);
                 setRosca(details ?? null);
                 if (!details) setError("ROSCA not found.");
             } catch (err) { setError("Could not load ROSCA details."); console.error(err); }
             finally { setIsLoading(false); }
         }
         loadDetails();
     }, [isWalletLoading, roscaId, currentAccount?.address]);

     // Memoized round data
    const { pastRounds, futureRounds, currentRound, participantOrder } = useMemo(() => {
        if (!rosca || !rosca.rounds) return { pastRounds: [], futureRounds: [], currentRound: null, participantOrder: [] };
         const sortedRounds = [...rosca.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
         const isCompleted = (round: Round) => {
            return round.expectedContributors?.length > 0 &&
                   round.contributors?.length === round.expectedContributors.length;
        };
        const past: Round[] = [];
        let current: Round | null = null;
        const future: Round[] = [];
    
        for (const round of sortedRounds) {
            if (isCompleted(round)) {
                past.push(round);
            } else if (!current) {
                current = round;
            } else {
                future.push(round);
            }
        }

         const orderMap = new Map<string, number>();
         sortedRounds.forEach(r => { if (!orderMap.has(r.recipient)) { orderMap.set(r.recipient, r.roundNumber); } });
         const orderedParticipants = Array.from(orderMap.entries()).sort(([, numA], [, numB]) => numA - numB).map(([address]) => address);
         return { pastRounds: past, futureRounds: future, currentRound: current, participantOrder: orderedParticipants };
    }, [rosca]);

    // Generic action handler
    const handleAction = async (actionName: string, actionFn: () => Promise<any>) => {
        setActionLoading(prev => ({ ...prev, [actionName]: true }));
        try {
            const result = await actionFn();
            if (!result.success) {
                addToast({
                    title: "Action failed",
                    description: `${result.error || 'Unknown error'}`,
                    color: 'danger',
                })
                // alert(`Action Failed: ${result.error || 'Unknown error'}`);
            } else {
                addToast({
                    title: `Action "${actionName}" Successful!`,
                    description: `Action "${actionName}" Successful!`,
                    color: 'success',
                })
                // alert(`Action "${actionName}" Successful!`);
                 // Force refresh data after successful action
                 setIsLoading(true); // Show loading indicator during refresh
                 const details = await fetchRoscaDetails(roscaId);
                 setRosca(details ?? null);
                 if (!details) setError("Circle not found after refresh.");
            }
        } catch (err) { console.error(`Error during ${actionName}:`, err); addToast({
            title: "Error",
            description: `An error occurred during ${actionName}.`,
            color: 'danger',
        }); }
        finally { setActionLoading(prev => ({ ...prev, [actionName]: false })); setIsLoading(false); }
    };

    // Specific handler for deposit confirmation
     const handleConfirmDeposit = async (amount: number) => {
        if (rosca) {
            // We wrap the specific submit function call within the generic handler
            // to benefit from the centralized loading/error/refresh logic
             await handleAction('addDeposit', () => addToSecurityDeposit(rosca.roscaId, amount));
             onDepositModalClose(); // Close modal only if action was attempted (handleAction handles success/error alerts)
        }
     };

    // --- Render ---
    if (isLoading) return <div className="flex justify-center items-center h-60"><Spinner label="Loading ROSCA Details..." /></div>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!rosca) return <p className="text-default-500">ROSCA data not available.</p>;
    if (isWalletLoading) return <div className="flex justify-center items-center h-40"><Spinner label="Loading wallet..." color="primary" /></div>;
    if (!currentUserAddress) return <div className="text-center mt-10"><p className="text-lg text-default-700 mb-4">Please connect your wallet to view your Circles.</p></div>;

    return (
        <div className="space-y-6">
            {/* Use the new components, passing necessary props */}
            <RoscaDetailHeader
                rosca={rosca}
                currentUserAddress={currentUserAddress}
                actionLoading={actionLoading}
                onAction={handleAction}
                onOpenDepositModal={onDepositModalOpen} // Pass callback to open modal
            />

            <RoscaProgressionStepper
                 participantOrder={participantOrder}
                 roscaRounds={rosca.rounds}
                 currentRoundNumber={currentRound?.roundNumber}
            />

            <CurrentRoundStatus
                 rosca={rosca}
                 currentRound={currentRound}
                 currentUserAddress={currentUserAddress}
                 actionLoading={actionLoading}
                 onAction={handleAction}
             />


            <RoscaRoundsHistory
                pastRounds={pastRounds}
                futureRounds={futureRounds}
                currentUserAddress={currentUserAddress}
             />

            {/* The Modal is now its own component, rendered here */}
            <AddDepositModal
                 isOpen={isDepositModalOpen}
                 onOpenChange={onDepositModalOpenChange}
                 rosca={rosca}
                 actionLoading={actionLoading['addDeposit'] ?? false} // Pass specific loading state
                 onConfirmDeposit={handleConfirmDeposit} // Pass specific confirm handler
             />

            <Spacer y={8} />
        </div>
    );
}