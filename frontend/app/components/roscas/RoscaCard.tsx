// app/components/rosca/RoscaCard.tsx
"use client"; // May need client directives for buttons/actions

import React from 'react';
import NextLink from 'next/link';
import { Rosca } from '@/app/lib/types';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link'; // HeroUI Link

// Helper to format bigint currency (assuming 2 decimals)
const formatCurrency = (amount: bigint, decimals = 2): string => {
    const factor = BigInt(10 ** decimals);
    const integerPart = amount / factor;
    const fractionalPart = amount % factor;
    return `$${integerPart.toString()}.${fractionalPart.toString().padStart(decimals, '0')}`;
}

interface RoscaCardProps {
  rosca: Rosca;
  isInvited?: boolean; // Flag to show "Join" instead of "View"
}

export default function RoscaCard({ rosca, isInvited = false }: RoscaCardProps) {

  const handleJoin = async () => {
      alert(`Placeholder: Joining ROSCA ${rosca.roscaId}`);
      // const result = await submitJoinRosca(rosca.roscaId);
      // Handle result (show success/error message, refresh list)
  }

  return (
    <Card shadow="sm">
      <CardHeader className="flex gap-3 justify-between items-start">
        <div className="flex flex-col">
          <p className="text-md font-semibold">{rosca.name}</p>
          <p className="text-small text-default-500">ID: {rosca.roscaId}</p>
        </div>
         <Chip
            size="sm"
            variant="flat"
            color={
              rosca.status === "Active" ? "success" :
              rosca.status === "Pending" ? "warning" :
              "default"
            }
          >
            {isInvited ? 'Invited' : rosca.status}
          </Chip>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="flex justify-between text-sm mb-1">
            <span className="text-default-600">Contribution:</span>
            <span className="font-medium">{formatCurrency(rosca.contributionAmount)}</span>
        </div>
         <div className="flex justify-between text-sm mb-1">
            <span className="text-default-600">Participants:</span>
            <span className="font-medium">{rosca.eligibleParticipants.length} / {rosca.totalParticipants}</span>
        </div>
         <div className="flex justify-between text-sm">
            <span className="text-default-600">Creator:</span>
            <span className="font-medium truncate max-w-[100px]">{rosca.creator}</span> {/* Simple truncate */}
        </div>
        {/* Add more relevant info like frequency or next due date if available */}
      </CardBody>
      <Divider />
      <CardFooter>
        {isInvited ? (
           <Button size="sm" color="primary" onPress={handleJoin}>Join</Button>
        ) : (
            <Button
                size="sm"
                variant="flat"
                color="primary"
                href={`/dashboard/rosca/${rosca.id}`} // Link to details page
                as={NextLink} // Use Next.js Link
            >
                View Details
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}