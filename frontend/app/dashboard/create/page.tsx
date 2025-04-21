'use client'

// app/dashboard/create/page.tsx
import React from 'react';
import CreateRoscaForm from '@/app/components/roscas/CreateRoscaForm';
import { submitCreateRosca } from '@/app/lib/data-fetchers'; // Import the actual submission function

export default function CreateRoscaPage() {
    // Assume we get the current user's address somehow (e.g., context, session)
    const currentUserAddress = "You"; // Replace with actual logic

    const handleFormSubmit = async (payload: any) => {
        // This function is passed to the form component
        console.log("Submitting ROSCA Creation Payload:", payload);
        // Call the actual data fetcher/blockchain interaction function
        const result = await submitCreateRosca(payload);
        // The form component itself will handle alerts/redirects based on the result
        return result;
    };

    return (
        <div>
             <h1 className="text-2xl font-semibold mb-6">Create New ROSCA</h1>
             <CreateRoscaForm
                onSubmitAction={handleFormSubmit}
                currentUserAddress={currentUserAddress}
             />
        </div>
    );
}