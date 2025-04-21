// app/dashboard/rosca/[id]/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';

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
import { fetchRoscaDetails, submitContribute, submitAddSecurityDeposit, submitStartRosca, submitLeaveRosca } from '@/app/lib/data-fetchers';
import { Rosca, Round } from '@/app/lib/types';

// --- Component ---
export default function RoscaDetailsPage() {
    const params = useParams();
    const roscaId = params.id as string;

    const [rosca, setRosca] = useState<Rosca | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

    // Modal state
    const { isOpen: isDepositModalOpen, onOpen: onDepositModalOpen, onOpenChange: onDepositModalOpenChange, onClose: onDepositModalClose } = useDisclosure();

    const currentUserAddress = "You"; // Replace with actual user logic

     // Fetching logic
     useEffect(() => {
         if (!roscaId) return;
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
     }, [roscaId]);

     // Memoized round data
    const { pastRounds, futureRounds, currentRound, participantOrder } = useMemo(() => {
        if (!rosca || !rosca.rounds) return { pastRounds: [], futureRounds: [], currentRound: null, participantOrder: [] };
         const nowSec = BigInt(Math.floor(Date.now() / 1000));
         const sortedRounds = [...rosca.rounds].sort((a, b) => a.roundNumber - b.roundNumber);
         const past = sortedRounds.filter(r => r.paymentCutoff < nowSec);
         const future = sortedRounds.filter(r => r.paymentCutoff >= nowSec);
         const current = rosca.status === 'Active' ? (future[0] || past[past.length - 1] || null) : null;
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
                alert(`Action Failed: ${result.error || 'Unknown error'}`);
            } else {
                alert(`Action "${actionName}" Successful!`);
                 // Force refresh data after successful action
                 setIsLoading(true); // Show loading indicator during refresh
                 const details = await fetchRoscaDetails(roscaId);
                 setRosca(details ?? null);
                 if (!details) setError("ROSCA not found after refresh.");
            }
        } catch (err) { console.error(`Error during ${actionName}:`, err); alert(`An error occurred during ${actionName}.`); }
        finally { setActionLoading(prev => ({ ...prev, [actionName]: false })); setIsLoading(false); }
    };

    // Specific handler for deposit confirmation
     const handleConfirmDeposit = async (amount: number) => {
        if (rosca) {
            // We wrap the specific submit function call within the generic handler
            // to benefit from the centralized loading/error/refresh logic
             await handleAction('addDeposit', () => submitAddSecurityDeposit(rosca.roscaId, amount));
             onDepositModalClose(); // Close modal only if action was attempted (handleAction handles success/error alerts)
        }
     };

    // --- Render ---
    if (isLoading) return <div className="flex justify-center items-center h-60"><Spinner label="Loading ROSCA Details..." /></div>;
    if (error) return <p className="text-danger">{error}</p>;
    if (!rosca) return <p className="text-default-500">ROSCA data not available.</p>;

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