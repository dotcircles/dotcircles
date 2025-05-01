'use client'

// app/dashboard/create/page.tsx
import React from 'react';
import CreateRoscaForm from '@/app/components/roscas/CreateRoscaForm';
import { useSubmitCreateRosca } from '@/app/lib/hooks/useSubmitExtrinsic';
import { useWallet } from '@/app/lib/wallet/WalletProvider';
import { addToast } from '@heroui/toast';
import { useRouter } from "next/navigation";
import { Spinner } from '@heroui/spinner';

export default function CreateRoscaPage() {
    const router = useRouter();
    const createRosca = useSubmitCreateRosca();
    const { currentAccount, isWalletLoading } = useWallet();

    
    const handleFormSubmit = async (payload: any) => {
        console.log("Submitting ROSCA Creation Payload:", payload);
        const promise = createRosca(payload);

        addToast({
            title: "Creating Circle...",
            promise,
        });

        try {
            await promise;
            addToast({
            title: "Success",
            description: "Your Circle has been created!",
            color: "success",
            });
            router.push('/dashboard');
            
        } catch (err) {
            addToast({
            title: "Failed to Create Circle",
            description: "Please try again.",
            color: "danger",
            });
        }

        return promise
    };

    if (isWalletLoading) {
        return (
          <div className="flex justify-center items-center h-40">
            <Spinner label="Loading wallet..." color="primary" />
          </div>
        );
      }
    
      if (!currentAccount) {
        return (
          <div className="text-center mt-10">
            <p className="text-lg text-default-700 mb-4">
              Please connect your wallet to create a Circle.
            </p>
          </div>
        );
      }

    return (
        <div>
             <h1 className="text-2xl font-semibold mb-6">Create New Circle</h1>
             <CreateRoscaForm
                onSubmitAction={handleFormSubmit}
                currentUserAddress={currentAccount?.address}
             />
        </div>
    );
}