import { GraphQLClient } from 'graphql-request';
import {
    GET_ACCOUNT_ROSCAS,
    GET_ROSCA_DETAIL,
} from './roscaQueries';
import { Rosca, Round } from '@/app/lib/types';
import { hexToUtf8 } from '@/app/lib/utils';

const client = new GraphQLClient(
    process.env.NEXT_PUBLIC_SUBQUERY_ENDPOINT as string,
    { headers: { 'Content-Type': 'application/json' } }
);

/* ---------- helpers ---------- */

function toBigInt(value: unknown): bigint {
    return typeof value === 'string' || typeof value === 'number'
        ? BigInt(value)
        : BigInt(0);
}

function mapRound(raw: any): Round {
    return {
        id: raw.id,
        parentRoscaId: raw.parentRosca?.id ?? '',
        chainRoscaId: raw.chainRoscaId ?? 0,
        roundNumber: raw.roundNumber ?? 0,
        paymentCutoff: toBigInt(raw.paymentCutoff),
        recipient: raw.recipient,
        expectedContributors: raw.expectedContributors ?? [],
        contributors: raw.actualContributors ?? [],
        defaulters: raw.defaulters ?? [],
    };
}

function deriveStatus(raw: any): 'Pending' | 'Active' | 'Completed' {
    if (raw.completed) return 'Completed';
    if (raw.startedBy) return 'Active';
    return 'Pending';
}

function mapRosca(raw: any): Rosca {
    console.log('Rosca', raw);
    const roundArray: any[] = Array.isArray(raw.rounds)
        ? raw.rounds
        : raw.rounds?.nodes ?? [];

    const rounds: Round[] = roundArray.map(mapRound);

    const eligibilities = (raw.eligibilities?.nodes ?? []).map((e: any) => ({
        accountId: e.account?.id ?? '',
        joinedAt: BigInt(e.joinedAt ?? 0),
    }));

    return {
        id: raw.id,
        roscaId: raw.roscaId,
        name: hexToUtf8(raw.name),
        creator: raw.creator,
        paymentAsset: raw.paymentAsset,
        randomOrder: raw.randomOrder,
        totalParticipants: raw.totalParticipants,
        minParticipants: raw.minParticipants,
        contributionAmount: toBigInt(raw.contributionAmount),
        contributionFrequency: toBigInt(raw.contributionFrequency),
        startedBy: raw.startedBy ?? null,
        startTimestamp: toBigInt(raw.startTimestamp),
        completed: raw.completed ?? false,
        eligibleParticipants: raw.eligibleParticipants ?? [],
        activeParticipants: raw.activeParticipants ?? [],
        totalSecurityDeposits: raw.totalSecurityDeposits ?? 0,
        currentRecipient: raw.currentRecipient ?? null,
        currentRoundNumber: raw.currentRoundNumber ?? null,
        currentRoundPaymentCutoff: raw.currentRoundPaymentCutoff
            ? toBigInt(raw.currentRoundPaymentCutoff)
            : null,
        rounds,
        status: deriveStatus(raw),
        eligibilities
    };
}

/* ---------- public API ---------- */

export async function fetchEligibleRoscas(accountId: string): Promise<Rosca[]> {
    const { account } = await client.request<
        { account: { eligibleFor: { nodes: { parentRosca: any }[] } } }
    >(GET_ACCOUNT_ROSCAS, { accountId });

    if (!account || !account.eligibleFor) {
        return [];
    }

    return account.eligibleFor.nodes.map(({ parentRosca }) =>
        mapRosca(parentRosca)
    );
}
export async function fetchRoscaDetails(roscaId: string | number): Promise<Rosca | null> {
    const { roscas } = await client.request<
        { roscas: { nodes: any[] } }
    >(GET_ROSCA_DETAIL, {
        roscaId: Number(roscaId)
    });

    return roscas.nodes[0] ? mapRosca(roscas.nodes[0]) : null;
}