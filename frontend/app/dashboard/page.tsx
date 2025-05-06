// app/dashboard/page.tsx
"use client"; // Needed for useEffect, useState

import React, { useState, useEffect } from 'react';
import { fetchEligibleRoscas } from '@/app/lib/data-fetchers'; // Adjust path
import { Rosca } from '@/app/lib/types';
import RoscaList from '@/app/components/roscas/RoscaList'; // Component to render the list
import { Spinner } from '@heroui/spinner'; // Individual import
import {Tabs, Tab} from "@heroui/tabs"; // Individual import
import { useWallet } from '../lib/wallet/WalletProvider';

export default function MyRoscasPage() {
  const { currentAccount, isWalletLoading } = useWallet();
  const [pendingRoscas, setPendingRoscas] = useState<Rosca[]>([]);
  const [activeRoscas, setActiveRoscas] = useState<Rosca[]>([]);
  const [missedRoscas, setMissedRoscas] = useState<Rosca[]>([]);
  const [completedRoscas, setCompletedRoscas] = useState<Rosca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {

    if (isWalletLoading) return;
    if (!currentAccount?.address) return;

    const accountId = currentAccount.address;
    
    async function loadRoscas() {
      setIsLoading(true);
      setError(null);
      try {
        const eligibleFor = await fetchEligibleRoscas(accountId);
        setPendingRoscas(eligibleFor.filter(r => r.status === 'Pending'));
        setActiveRoscas(eligibleFor.filter(r => r.status === 'Active' && r.activeParticipants.includes(accountId)));
        setMissedRoscas(eligibleFor.filter(r => r.status === 'Active' && !r.activeParticipants.includes(accountId)));
        setCompletedRoscas(eligibleFor.filter(r => r.status === 'Completed'));
      } catch (err) {
        console.error("Failed to fetch eligible ROSCAs:", err);
        setError("Could not load your ROSCAs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRoscas();
  }, [isWalletLoading, currentAccount?.address]);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My ROSCAs</h1>


      { isWalletLoading && (
        <div className="flex justify-center items-center h-40">
          <Spinner label="Loading wallet..." color="primary" />
        </div>
      )}

      {!currentAccount && (
      <div className="text-center mt-10">
        <p className="text-lg text-default-700 mb-4">Please connect your wallet to view your Circles.</p>
      </div>
      )}

      {isLoading && !isWalletLoading && currentAccount && (
        <div className="flex justify-center items-center h-40">
          <Spinner label="Loading ROSCAs..." color="primary" />
        </div>
      )}

      {error && <p className="text-danger">{error}</p>}

      {!isLoading && !error && currentAccount && (
           <Tabs aria-label="Circles Status Tabs" color="primary">
             <Tab key="active" title={`Active (${activeRoscas.length})`}>
                 {activeRoscas.length > 0 ? (
                    <RoscaList roscas={activeRoscas} />
                 ) : (
                    <p className="text-default-500 mt-4">You have no active Circles.</p>
                 )}
             </Tab>
             <Tab key="pending" title={`Pending (${pendingRoscas.length})`}>
                  {pendingRoscas.length > 0 ? (
                    <RoscaList roscas={pendingRoscas} />
                 ) : (
                    <p className="text-default-500 mt-4">You have no pending Circles.</p>
                 )}
             </Tab>
             <Tab key="completed" title={`Completed (${completedRoscas.length})`}>
                  {completedRoscas.length > 0 ? (
                     <RoscaList roscas={completedRoscas} />
                 ) : (
                    <p className="text-default-500 mt-4">You have no completed Circles.</p>
                 )}
             </Tab>
             <Tab key="missed" title={`Missed (${missedRoscas.length})`}>
                  {missedRoscas.length > 0 ? (
                     <RoscaList roscas={missedRoscas} />
                 ) : (
                    <p className="text-default-500 mt-4">You have no missed Circles.</p>
                 )}
             </Tab>
           </Tabs>
      )}
    </div>
  );
}