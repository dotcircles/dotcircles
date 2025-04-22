// app/dashboard/page.tsx
"use client"; // Needed for useEffect, useState

import React, { useState, useEffect } from 'react';
import { fetchEligibleRoscas } from '@/app/lib/data-fetchers'; // Adjust path
import { Rosca } from '@/app/lib/types';
import RoscaList from '@/app/components/roscas/RoscaList'; // Component to render the list
import { Spinner } from '@heroui/spinner'; // Individual import
import {Tabs, Tab} from "@heroui/tabs"; // Individual import

export default function MyRoscasPage() {
  const [pendingRoscas, setPendingRoscas] = useState<Rosca[]>([]);
  const [activeRoscas, setActiveRoscas] = useState<Rosca[]>([]);
  const [completedRoscas, setCompletedRoscas] = useState<Rosca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoscas() {
      setIsLoading(true);
      setError(null);
      try {
        // Replace 'currentUser' with actual user identifier
        const joined = await fetchEligibleRoscas('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
        setPendingRoscas(joined.filter(r => r.status === 'Pending'));
        setActiveRoscas(joined.filter(r => r.status === 'Active'));
        setCompletedRoscas(joined.filter(r => r.status === 'Completed'));
      } catch (err) {
        console.error("Failed to fetch joined ROSCAs:", err);
        setError("Could not load your ROSCAs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }
    loadRoscas();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">My ROSCAs</h1>

      {isLoading && (
        <div className="flex justify-center items-center h-40">
          <Spinner label="Loading ROSCAs..." color="primary" />
        </div>
      )}

      {error && <p className="text-danger">{error}</p>}

      {!isLoading && !error && (
           <Tabs aria-label="ROSCA Status Tabs" color="primary">
             <Tab key="active" title={`Active (${activeRoscas.length})`}>
                 {activeRoscas.length > 0 ? (
                    <RoscaList roscas={activeRoscas} />
                 ) : (
                    <p className="text-default-500 mt-4">You have no active ROSCAs.</p>
                 )}
             </Tab>
             <Tab key="pending" title={`Pending (${pendingRoscas.length})`}>
                  {pendingRoscas.length > 0 ? (
                    <RoscaList roscas={pendingRoscas} />
                 ) : (
                    <p className="text-default-500 mt-4">You have no pending ROSCAs.</p>
                 )}
             </Tab>
             <Tab key="completed" title={`Completed (${completedRoscas.length})`}>
                  {completedRoscas.length > 0 ? (
                     <RoscaList roscas={completedRoscas} />
                 ) : (
                    <p className="text-default-500 mt-4">You have no completed ROSCAs.</p>
                 )}
             </Tab>
           </Tabs>
      )}
    </div>
  );
}