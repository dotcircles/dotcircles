"use client";

import React from 'react';
import NextLink from 'next/link';
import { Rosca } from '@/app/lib/types';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import { formatCurrency } from '@/app/lib/utils';
import { useSubmitJoinRosca } from '@/app/lib/hooks/useSubmitExtrinsic';

interface RoscaCardProps {
  rosca: Rosca;
  isInvited?: boolean;
}

export default function RoscaCard({ rosca, isInvited = false }: RoscaCardProps) {

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
            <span className="text-default-600">Participant Threshold:</span>
            <span className="font-medium">{rosca.minParticipants} / {rosca.totalParticipants}</span>
        </div>
         <div className="flex justify-between text-sm">
            <span className="text-default-600">Creator:</span>
            <span className="font-medium truncate max-w-[100px]">{rosca.creator}</span>
        </div>
      </CardBody>
      <Divider />
      <CardFooter>
          <Button
              size="sm"
              variant="flat"
              color="primary"
              href={`/dashboard/rosca/${rosca.id}`} 
              as={NextLink}
          >
              View Details
          </Button>
      </CardFooter>
    </Card>
  );
}