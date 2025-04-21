// app/components/rosca/RoscaDetailHeader.tsx
"use client";

import React from 'react';
import { Rosca } from '@/app/lib/types';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import { Avatar, AvatarGroup } from '@heroui/avatar'; // Import Avatar components
import { Tooltip } from '@heroui/tooltip'; // Import Tooltip for hover
import { submitLeaveRosca, submitStartRosca } from '@/app/lib/data-fetchers';

// Helper Functions (ensure these are correctly imported or defined in utils)
const formatCurrency = (amount: bigint | undefined, decimals = 2): string => {
    if (typeof amount !== 'bigint') return "$0.00";
    const factor = BigInt(10 ** decimals);
    const integerPart = amount / factor;
    const fractionalPart = amount % factor;
    return `$${integerPart.toString()}.${fractionalPart.toString().padStart(decimals, '0')}`;
};
const formatTimestamp = (timestamp: bigint | undefined): string => {
    if (typeof timestamp !== 'bigint') return 'N/A';
    const date = new Date(Number(timestamp) * 1000);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
const truncateAddress = (address: string | null | undefined, start = 6, end = 4): string => {
     if (!address) return 'N/A';
    if (address.length <= start + end + 3) return address;
    return `${address.substring(0, start)}...${address.substring(address.length - end)}`;
};
const formatFrequency = (freq: bigint | undefined): string => {
    if (typeof freq !== 'bigint') return 'N/A';
    const seconds = Number(freq);
    if (seconds === 604800) return 'Weekly';
    if (seconds === 1209600) return 'Bi-Weekly';
    if (seconds === 2592000) return 'Monthly';
    return `${seconds} seconds`; // Fallback
}

interface RoscaDetailHeaderProps {
    rosca: Rosca;
    currentUserAddress: string;
    actionLoading: Record<string, boolean>;
    onAction: (actionName: string, actionFn: () => Promise<any>) => void;
    onOpenDepositModal: () => void; // Callback to open the modal
}

export default function RoscaDetailHeader({
    rosca,
    currentUserAddress,
    actionLoading,
    onAction,
    onOpenDepositModal
}: RoscaDetailHeaderProps) {

    const isCreator = rosca.creator === currentUserAddress;
    const isParticipant = rosca.eligibleParticipants.includes(currentUserAddress);

    return (
        <Card shadow="sm"> {/* Added shadow prop for consistency */}
            <CardHeader className="flex flex-col items-start gap-1 pb-2">
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-2xl font-bold">{rosca.name}</h1>
                    <Chip size="sm" variant="flat" color={rosca.status === "Active" ? "success" : rosca.status === "Pending" ? "warning" : "default"}>
                        {rosca.status}
                    </Chip>
                </div>
                <p className="text-sm text-default-500">ID: {rosca.roscaId} / Created by: {truncateAddress(rosca.creator)}</p>
            </CardHeader>
            <Divider />
            {/* Updated CardBody layout */}
            <CardBody className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-4 text-sm pt-4">
                {/* Row 1 */}
                <div>
                    <span className="font-medium text-default-600 block mb-1">Contribution</span>
                    {formatCurrency(rosca.contributionAmount)}
                </div>
                <div>
                    <span className="font-medium text-default-600 block mb-1">Frequency</span>
                     {formatFrequency(rosca.contributionFrequency)}
                 </div>
                 {/* Participants Avatar Group - Takes more space */}
                 <div className="col-span-2 md:col-span-1">
                     <span className="font-medium text-default-600 block mb-2">
                        {/* Participants ({rosca.eligibleParticipants.length}/{rosca.totalParticipants}) */}
                        Participants
                    </span>
                    <AvatarGroup isBordered max={10} size="sm">
                         {rosca.eligibleParticipants.map((participant) => (
                             <Tooltip key={participant} content={truncateAddress(participant)} placement="top" delay={0} closeDelay={0}>
                                 <Avatar
                                     name={truncateAddress(participant)}
                                     size="sm"
                                     // You could add profile picture 'src' here if available
                                 />
                             </Tooltip>
                         ))}
                    </AvatarGroup>
                 </div>

                 {/* Row 2 */}
                 <div>
                    <span className="font-medium text-default-600 block mb-1">Start Date</span>
                    {formatTimestamp(rosca.startTimestamp)}
                </div>
                 <div>
                    <span className="font-medium text-default-600 block mb-1">Order</span>
                     {rosca.randomOrder ? 'Random' : 'Set'}
                 </div>
                 <div>
                     <span className="font-medium text-default-600 block mb-1">Min. Start #</span>
                     {rosca.minParticipants}
                 </div>

            </CardBody>
            <Divider />
            <CardFooter className="gap-2 flex-wrap pt-4"> {/* Added padding top */}
                {rosca.status === 'Pending' && isCreator &&
                    <Button size="sm" color="success" variant='flat' onPress={() => onAction('start', () => submitStartRosca(rosca.roscaId))} isLoading={actionLoading['start']}>Start ROSCA</Button>
                }
                {rosca.status !== 'Completed' && isParticipant &&
                    <Button size="sm" variant="bordered" onPress={onOpenDepositModal} isLoading={actionLoading['addDeposit']}>Add Security Deposit</Button>
                }
                {rosca.status === 'Pending' && !isCreator && isParticipant &&
                    <Button size="sm" color="danger" variant='light' onPress={() => onAction('leave', () => submitLeaveRosca(rosca.roscaId))} isLoading={actionLoading['leave']}>Leave ROSCA</Button>
                }
            </CardFooter>
        </Card>
    );
}