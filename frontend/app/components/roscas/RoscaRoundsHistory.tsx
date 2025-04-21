// app/components/rosca/RoscaRoundsHistory.tsx
"use client";

import React from 'react';
import { Round } from '@/app/lib/types';
import { Card, CardHeader, CardBody } from '@heroui/card';
import { Tabs, Tab } from '@heroui/tabs';
import RoundTable from './RoundTable'; // Import the separated table

interface RoscaRoundsHistoryProps {
    pastRounds: Round[];
    futureRounds: Round[];
    currentUserAddress: string;
}

export default function RoscaRoundsHistory({ pastRounds, futureRounds, currentUserAddress }: RoscaRoundsHistoryProps) {
    return (
        <Card>
            <CardHeader><h2 className="text-lg font-semibold">Rounds History & Schedule</h2></CardHeader>
            <CardBody>
                <Tabs aria-label="Rounds History Tabs" color="primary" fullWidth>
                    <Tab key="past" title={`Past (${pastRounds.length})`}>
                        <RoundTable rounds={pastRounds} isPast={true} currentUserAddress={currentUserAddress} />
                    </Tab>
                    <Tab key="future" title={`Upcoming (${futureRounds.length})`}>
                        <RoundTable rounds={futureRounds} isPast={false} currentUserAddress={currentUserAddress} />
                    </Tab>
                </Tabs>
            </CardBody>
        </Card>
    );
}