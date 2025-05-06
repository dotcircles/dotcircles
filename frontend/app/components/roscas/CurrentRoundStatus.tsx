// app/components/rosca/CurrentRoundStatus.tsx
"use client";

import React from 'react';
import { Rosca, Round } from '@/app/lib/types';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Avatar } from '@heroui/avatar';
import { Tooltip } from '@heroui/tooltip';
import { Divider } from '@heroui/divider';
import { formatCurrency, formatTimestamp, truncateAddress } from '@/app/lib/utils';
import { useSubmitJoinRosca, useSubmitContributeToRosca } from '@/app/lib/hooks/useSubmitExtrinsic';

const CheckIcon = () => <svg className="text-success" fill="currentColor" height="1em" viewBox="0 0 16 16" width="1em"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"></path></svg>;
const ClockIcon = () => <svg className="text-warning" fill="currentColor" height="1em" viewBox="0 0 16 16" width="1em"><path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/></svg>;

interface CurrentRoundStatusProps {
    rosca: Rosca;
    currentRound: Round | null;
    currentUserAddress: string;
    actionLoading: Record<string, boolean>;
    onAction: (actionName: string, actionFn: () => Promise<any>) => void;
}

export default function CurrentRoundStatus({
    rosca,
    currentRound,
    currentUserAddress,
    actionLoading,
    onAction
}: CurrentRoundStatusProps) {

    const contributeToRosca = useSubmitContributeToRosca();

    if (rosca.status !== 'Active' || !currentRound) {
        return null; // Don't render if not active or no current round
    }

    const isCurrentUserRecipient = currentRound.recipient === currentUserAddress;
    const isExpectedContributor = currentRound.expectedContributors.includes(currentUserAddress);
    const hasContributed = currentRound.contributors?.includes(currentUserAddress);
    const isContributionDue = !isCurrentUserRecipient && !hasContributed && isExpectedContributor && BigInt(Math.floor(Date.now()/1000)) < currentRound.paymentCutoff;

    return (
        <Card>
            <CardHeader className="justify-between">
                <h2 className="text-lg font-semibold">
                    Current Round {currentRound.roundNumber}: <span className="font-normal">Recipient - {truncateAddress(currentRound.recipient)}</span>
                </h2>
                <p className="text-sm text-default-500">Due: {formatTimestamp(currentRound.paymentCutoff)}</p>
            </CardHeader>
            <Divider />
            <CardBody>
                <h3 className="text-sm font-medium mb-2 text-default-700">Payment Status:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {currentRound.expectedContributors.map(participant => {
                        const paid = currentRound.contributors?.includes(participant);
                        const isSelf = participant === currentUserAddress;
                        return (
                            <div key={participant} className="flex items-center gap-2 p-2 border border-divider rounded-md bg-content2">
                                <Tooltip content={truncateAddress(participant)}>
                                    <Avatar name={truncateAddress(participant)} size="sm" />
                                </Tooltip>
                                <span className={`text-xs font-medium truncate ${isSelf ? 'text-primary': ''}`}>
                                    {isSelf ? 'You' : truncateAddress(participant)}
                                </span>
                                <div className="ml-auto">
                                    {paid ? <CheckIcon /> : <ClockIcon />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardBody>
            {isContributionDue && (
                <>
                    <Divider />
                    <CardFooter className="justify-center">
                        <Button
                            color="primary"
                            onPress={() => onAction('contribute', () => contributeToRosca(rosca.roscaId))}
                            isLoading={actionLoading['contribute']}
                        >
                            Contribute {formatCurrency(rosca.contributionAmount)} Now
                        </Button>
                    </CardFooter>
                </>
            )}
        </Card>
    );
}