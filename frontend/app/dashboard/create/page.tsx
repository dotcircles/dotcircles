'use client'

// app/dashboard/create/page.tsx
import React from 'react';
import CreateRoscaForm from '@/app/components/roscas/CreateRoscaForm';
import { useSubmitCreateRosca } from '@/app/lib/hooks/useSubmitExtrinsic';
import { useWallet } from '@/app/lib/wallet/WalletProvider';
import { addToast } from '@heroui/toast';

export default function CreateRoscaPage() {

    const createRosca = useSubmitCreateRosca();
    const { currentAccount } = useWallet();

    const handleFormSubmit = async (payload: any) => {
        console.log("Submitting ROSCA Creation Payload:", payload);
        addToast({
            title: "Creating ROSCA...",
            promise: createRosca(payload),
        });
    };

    return (
        <div>
             <h1 className="text-2xl font-semibold mb-6">Create New ROSCA</h1>
             <CreateRoscaForm
                onSubmitAction={handleFormSubmit}
                currentUserAddress={currentAccount?.address}
             />
        </div>
    );
}