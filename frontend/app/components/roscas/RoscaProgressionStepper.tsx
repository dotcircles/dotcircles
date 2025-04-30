// app/components/rosca/RoscaProgressionStepper.tsx
"use client";

import React from 'react';
import { Rosca, Round } from '@/app/lib/types';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Avatar } from '@heroui/avatar';
import { Tooltip } from '@heroui/tooltip';
import { Divider } from '@heroui/divider';
import { formatCurrency, formatTimestamp, truncateAddress } from '@/app/lib/utils';


const CheckIcon = () => <svg className="text-success" fill="currentColor" height="1em" viewBox="0 0 16 16" width="1em"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"></path></svg>;

interface RoscaProgressionStepperProps {
    participantOrder: string[]; // Ordered list of recipients by round
    roscaRounds: Round[]; // All rounds to check status
    currentRoundNumber: number | null | undefined; // To highlight current recipient
}

export default function RoscaProgressionStepper({ participantOrder, roscaRounds, currentRoundNumber }: RoscaProgressionStepperProps) {
    if (!participantOrder || participantOrder.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader><h2 className="text-lg font-semibold">Payout Order & Status</h2></CardHeader>
            <CardBody>
                <div className="flex justify-center space-x-1 overflow-x-auto p-2 relative">
                     {/* Optional: Background line */}
                    {/* <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-divider -translate-y-1/2 z-0"></div> */}
                    {participantOrder.map((participant, index) => {
                        const roundNum = index + 1;
                        const receivedRound = roscaRounds.find(r => r.roundNumber === roundNum && r.recipient === participant);

                        const hasReceived = receivedRound &&
                            receivedRound.expectedContributors.length > 0 &&
                            receivedRound.contributors.length === receivedRound.expectedContributors.length;

                        const isCurrentRecipient = currentRoundNumber === roundNum;

                        const statusColor = hasReceived ? "success" : isCurrentRecipient ? "primary" : "default";
                        const opacityClass = hasReceived || isCurrentRecipient ? "opacity-100" : "opacity-60";

                        return (
                            <React.Fragment key={participant}>
                                {index > 0 && <Divider orientation="vertical" className="h-6 mx-1 self-center" />}
                                <div className={`flex flex-col items-center text-center min-w-[75px] md:min-w-[85px] z-10 transition-opacity ${opacityClass}`}>
                                    <Tooltip content={truncateAddress(participant)} placement="top" delay={0} closeDelay={0}>
                                        <Avatar
                                            name={truncateAddress(participant)}
                                            size="md"
                                            isBordered={isCurrentRecipient}
                                            color={statusColor}
                                            className="mb-1"
                                        />
                                    </Tooltip>
                                    <span className={`text-xs font-medium ${isCurrentRecipient ? 'text-primary font-semibold' : 'text-default-600'}`}>
                                        Round {roundNum}
                                    </span>
                                    {hasReceived && <span className="text-xs text-success flex items-center gap-1">Received <CheckIcon /></span>}
                                    {isCurrentRecipient && <span className="text-xs text-primary">Current</span>}
                                </div>
                            </React.Fragment>
                        );
                    })}
                </div>
            </CardBody>
        </Card>
    );
}