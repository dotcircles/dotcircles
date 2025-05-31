// app/components/rosca/RoscaDetailHeader.tsx
"use client";

import React, { useMemo } from 'react';
import { Rosca } from '@/app/lib/types';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Link } from '@heroui/link';
import { Avatar, AvatarGroup } from '@heroui/avatar';
import { Tooltip } from '@heroui/tooltip';
import { formatCurrency, formatFrequency, formatTimestamp, truncateAddress } from '@/app/lib/utils';
import { useSubmitJoinRosca, useSubmitLeaveRosca, useSubmitStartRosca  } from '@/app/lib/hooks/useSubmitExtrinsic';
import { useWallet } from '@/app/lib/wallet/WalletProvider';


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

    const joinRosca = useSubmitJoinRosca();
    const leaveRosca = useSubmitLeaveRosca();
    const startRosca = useSubmitStartRosca();

    const joinedAccounts = useMemo(
        () =>
          new Set(
            rosca.eligibilities
              .filter((e) => e.joinedAt > 0)
              .map((e) => e.accountId)
          ),
        [rosca.eligibilities]
      );

    const { currentAccount,  } = useWallet();

    if (!currentAccount) {
      return (
        <Card>
          <CardBody>
            <p className="text-sm text-default-500">Please connect your wallet to view or join this circle.</p>
          </CardBody>
        </Card>
      );
    }
    
    const hasMetThreshold = joinedAccounts.size >= rosca.minParticipants;
    const hasJoined = joinedAccounts.has(currentAccount?.address);
    const isParticipant = rosca.eligibleParticipants.includes(currentAccount?.address);

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
                        Participants ({joinedAccounts.size}/{rosca.totalParticipants})
                    </span>

                    <AvatarGroup isBordered max={10} size="sm">
                        {rosca.eligibleParticipants.map((addr) => {
                        const joined = joinedAccounts.has(addr);
                        return (
                            <Tooltip key={addr} content={truncateAddress(addr)} placement="top">
                            <Avatar
                                name={truncateAddress(addr)}
                                size="sm"
                                color={joined ? 'success' : 'default'}
                            />
                            </Tooltip>
                        );
                        })}
                    </AvatarGroup>
                </div>

                 {/* Row 2 */}
                 <div>
                    <span className="font-medium text-default-600 block mb-1">Start By Date</span>
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
            <CardFooter className="gap-2 flex-wrap pt-4">
                {rosca.status === 'Pending' && !hasJoined && isParticipant && (
                    <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    onPress={() => onAction('join', () => joinRosca(rosca.roscaId))}
                    isLoading={actionLoading['join']}
                    >
                    Join Circle
                    </Button>
                )}

        {rosca.status === 'Pending' && hasJoined && hasMetThreshold && (
          <Button
            size="sm"
            color="success"
            variant="flat"
            onPress={() => onAction('start', () => startRosca(rosca.roscaId))}
            isLoading={actionLoading['start']}
          >
            Start Circle
          </Button>
        )}

        {rosca.status !== 'Completed' && hasJoined && (
          <Button
            size="sm"
            variant="bordered"
            onPress={onOpenDepositModal}
            isLoading={actionLoading['addDeposit']}
          >
            Add Security Deposit
          </Button>
        )}

        {rosca.status === 'Pending' && hasJoined && isParticipant && (
          <Button
            size="sm"
            color="danger"
            variant="light"
            onPress={() => onAction('leave', () => leaveRosca(rosca.roscaId))}
            isLoading={actionLoading['leave']}
          >
            Leave ROSCA
          </Button>
        )}
      </CardFooter>
        </Card>
    );
}