// app/dashboard/invited/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { fetchInvitedRoscas } from '@/app/lib/data-fetchers';
import { Rosca } from '@/app/lib/types';
import RoscaList from '@/app/components/roscas/RoscaList'; // Reuse the list component
import { Spinner } from '@heroui/spinner';

export default function InvitedRoscasPage() {
  const [invitedRoscas, setInvitedRoscas] = useState<Rosca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvited() {
      setIsLoading(true);
      setError(null);
      try {
        // Replace 'currentUser' with actual user identifier
        const invites = await fetchInvitedRoscas('currentUser');
        setInvitedRoscas(invites);
      } catch (err) {
        console.error("Failed to fetch invited ROSCAs:", err);
        setError("Could not load your invitations. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    loadInvited();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Invited ROSCAs</h1>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <Spinner label="Loading Invitations..." color="primary" />
        </div>
      )}

      {error && <p className="text-danger">{error}</p>}

      {!isLoading && !error && invitedRoscas.length > 0 && (
        // Pass isInvited prop to tell RoscaCard to show "Join" button
        <RoscaList roscas={invitedRoscas.map(r => ({ ...r, isInvited: true }))} />
      )}

      {!isLoading && !error && invitedRoscas.length === 0 && (
         <p className="text-default-500 mt-4">You have no pending ROSCA invitations.</p>
      )}
    </div>
  );
}