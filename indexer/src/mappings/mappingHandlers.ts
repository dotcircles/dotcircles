import { SubstrateExtrinsic, SubstrateEvent } from "@subql/types";
import { Rosca, Round, RoscaEligibility, Account, SecurityDeposit } from "../types";
import { u8aToString, hexToString, isHex } from "@polkadot/util";

type ParticipantDefaultedEvent = [number, string, string];

type RoscaCreatedEvent = [
  number,
  number,
  string,
  number,
  boolean,
  string,
  number,
  number,
  number,
  string[],
  string
];

interface RoundInfo {
  roundNumber: number;
  paymentCutoff: number;
  expectedContributors: string[];
  recipient: string;
}

type RoscaStartedEvent = [
  number,          // rosca_id
  string,          // started_by
  RoundInfo[],     // rounds
  string,          // first_eligible_claimant
  number           // payment_cutoff
];

type ContributionMadeEvent = [number, string, string, number];

type DepositDeductedEvent = [number, string, string, number, boolean];

type JoinedRoscaEvent = [number, string];

type LeftRoscaEvent = [number, string];

type RoscaCompleteEvent = [number];

type SecurityDepositContributionEvent = [number, string, number];

type SecurityDepositClaimedEvent = [number, string, number];

type RoscaManuallyEndedEvent = [number];

type NewRoundStartedEvent = [number, string, number];

export async function handleRoscaCreated(event: SubstrateEvent): Promise<void> {
  const [rosca_id, contribution_amount, payment_asset, contribution_frequency, random_order, name, number_of_participants, minimum_participant_threshold, start_by_timestamp, eligible_participants, creator] =
    event.event.data.toJSON() as RoscaCreatedEvent;
  logger.info(`RoscaCreatedEvent received: rosca_id=${rosca_id}, creator=${creator}`);

  const roscaEntity = Rosca.create({
    id: rosca_id.toString(),
    roscaId: rosca_id,
    name,
    creator,
    paymentAsset: payment_asset,
    randomOrder: random_order,
    totalParticipants: number_of_participants,
    minParticipants: minimum_participant_threshold,
    contributionAmount: BigInt(contribution_amount),
    contributionFrequency: BigInt(contribution_frequency),
    startTimestamp: BigInt(start_by_timestamp),
    completed: false,
    eligibleParticipants: eligible_participants,
    activeParticipants: [],
    totalSecurityDeposits: 0,
    currentRoundNumber: 0
  });

  await roscaEntity.save();
  logger.info(`Saved Rosca entity ${rosca_id}`);

  for (const address of eligible_participants) {
    let account = await Account.get(address);

    if (!account) {
      logger.info(`Account not found, creating new account for ${address}`);
      account = Account.create({ id: address });
      await account.save();
      logger.info(`Created Account ${address}`);
    }

    const eligibilityId = `${rosca_id}-${address}`;
    const eligibility = RoscaEligibility.create({
      id: eligibilityId,
      parentRoscaId: rosca_id.toString(),
      accountId: address,
      joinedAt: undefined
    });
    await eligibility.save();
    logger.info(`Created RoscaEligibility ${eligibilityId}`);
  }
}

export async function handleRoscaStarted(event: SubstrateEvent): Promise<void> {

  const [rosca_id, started_by, rounds, first_eligible_claimant, payment_cutoff] =
    event.event.data.toJSON() as RoscaStartedEvent;

  logger.info(`RoscaStartedEvent received: rosca_id=${rosca_id}, started_by=${started_by}, rounds=${rounds}, first_eligible_claimant=${first_eligible_claimant}, payment_cutoff=${payment_cutoff}`);
  const raw = event.event.data.toJSON() as any[];
  logger.info(`\t➤ rawRounds = ${JSON.stringify(raw[2])}`);

  const roscaEntity = await Rosca.get(rosca_id.toString());
  if (roscaEntity) {
    roscaEntity.startedBy = started_by;
    roscaEntity.currentRecipient = first_eligible_claimant;
    roscaEntity.currentRoundNumber = 1;
    roscaEntity.currentRoundPaymentCutoff = BigInt(payment_cutoff);
    await roscaEntity.save();
    logger.info(`Updated Rosca ${rosca_id} with start info`);
  }

  for (const round of rounds) {
    const { roundNumber, paymentCutoff: cutoff, expectedContributors, recipient } = round;
    logger.info(`RoscaRound: rosca_id=${rosca_id}, roundNumber=${roundNumber}, paymentCutoff=${cutoff}, expectedContributors=${expectedContributors}, recipient=${recipient}`);
    const roundId = `${rosca_id}-${roundNumber}`;

    const roundEntity = Round.create({
      id: roundId,
      parentRoscaId: rosca_id.toString(),
      chainRoscaId: rosca_id,
      roundNumber: roundNumber,
      paymentCutoff: BigInt(cutoff),
      expectedContributors: expectedContributors,
      recipient,
      defaulters: [],
      actualContributors: []
    });

    await roundEntity.save();
    logger.info(`Created Round entity ${roundId}`);
  }
}

export async function handleParticipantDefaulted(event: SubstrateEvent): Promise<void> {
  const [rosca_id, unpaid_recipient, defaulter] = event.event.data.toJSON() as ParticipantDefaultedEvent;
  logger.info(`ParticipantDefaultedEvent: rosca_id=${rosca_id}, recipient=${unpaid_recipient}, defaulter=${defaulter}`);

  const rounds = await Round.getByFields([
    ["parentRoscaId", "=", rosca_id],
    ["recipient", "=", unpaid_recipient]
  ], { limit: 1 });

  for (const roundEntity of rounds) {
    if (!roundEntity.defaulters.includes(defaulter)) {
      roundEntity.defaulters.push(defaulter);
      await roundEntity.save();
      logger.info(`Added defaulter ${defaulter} to round ${roundEntity.id}`);
    }
  }
}

export async function handleContributionMade(event: SubstrateEvent): Promise<void> {
  const [rosca_id, contributor, recipient, amount] = event.event.data.toJSON() as ContributionMadeEvent;
  logger.info(`ContributionMadeEvent: rosca_id=${rosca_id}, contributor=${contributor}, amount=${amount}`);

  const rounds = await Round.getByFields([
    ["parentRoscaId", "=", rosca_id],
    ["recipient", "=", recipient]
  ], { limit: 1 });

  for (const roundEntity of rounds) {
    if (!roundEntity.actualContributors.includes(contributor)) {
      roundEntity.actualContributors.push(contributor);
      await roundEntity.save();
      logger.info(`Recorded contribution from ${contributor} for round ${roundEntity.id}`);
    }
  }
}

export async function handleDepositDeducted(event: SubstrateEvent): Promise<void> {
  const [rosca_id, contributor, recipient, amount] = event.event.data.toJSON() as DepositDeductedEvent;
  logger.info(`DepositDeductedEvent: rosca_id=${rosca_id}, contributor=${contributor}, amount=${amount}`);

  const rounds = await Round.getByFields([
    ["parentRoscaId", "=", rosca_id],
    ["recipient", "=", recipient]
  ], { limit: 1 });

  for (const roundEntity of rounds) {
    if (!roundEntity.actualContributors.includes(contributor)) {
      roundEntity.actualContributors.push(contributor);
      await roundEntity.save();
      logger.info(`Recorded deposit deduction from ${contributor} for round ${roundEntity.id}`);
    }
  }
}

export async function handleJoinedRosca(event: SubstrateEvent): Promise<void> {
  const [rosca_id, contributor] = event.event.data.toJSON() as JoinedRoscaEvent;
  logger.info(`JoinedRoscaEvent: rosca_id=${rosca_id}, contributor=${contributor}`);

  const eligibilityId = `${rosca_id}-${contributor}`;
  const eligibility = await RoscaEligibility.get(eligibilityId);

  if (!eligibility) {
    logger.warn(`RoscaEligibility not found for ${eligibilityId}`);
    return;
  }

  if (event.block.timestamp) {
    eligibility.joinedAt = BigInt(event.block.timestamp.getTime());
    await eligibility.save();
    logger.info(`Set joinedAt for eligibility ${eligibilityId}`);
  } else {
    logger.warn(`Missing timestamp for block ${event.block.block.header.number}`);
  }
}

export async function handleLeftRosca(event: SubstrateEvent): Promise<void> {
  const [rosca_id, contributor] = event.event.data.toJSON() as LeftRoscaEvent;
  logger.info(`LeftRoscaEvent: rosca_id=${rosca_id}, contributor=${contributor}`);

  const eligibilityId = `${rosca_id}-${contributor}`;
  const eligibility = await RoscaEligibility.get(eligibilityId);

  if (!eligibility) {
    logger.warn(`RoscaEligibility not found for ${eligibilityId}`);
    return;
  }

  eligibility.joinedAt = undefined;
  await eligibility.save();
  logger.info(`Cleared joinedAt for eligibility ${eligibilityId}`);
}

export async function handleRoscaComplete(event: SubstrateEvent): Promise<void> {
  const [rosca_id] = event.event.data.toJSON() as RoscaCompleteEvent;
  logger.info(`RoscaCompleteEvent: rosca_id=${rosca_id}`);

  const roscaEntity = await Rosca.get(rosca_id.toString());
  if (roscaEntity) {
    roscaEntity.completed = true;
    await roscaEntity.save();
    logger.info(`Marked Rosca ${rosca_id} as completed`);
  }
}

export async function handleSecurityDepositContribution(event: SubstrateEvent): Promise<void> {
  const [rosca_id, depositor, amount] = event.event.data.toJSON() as SecurityDepositContributionEvent;
  logger.info(`SecurityDepositContributionEvent: rosca_id=${rosca_id}, depositor=${depositor}, amount=${amount}`);

  const depositId = `${rosca_id}-${depositor}`;
  const depositorAccount = await Account.get(depositor);

  if (!depositorAccount) {
    logger.warn(`depositorAccount not found for ${depositId}`);
    return;
  }

  let securityDeposit = await SecurityDeposit.get(depositId);

  if (!securityDeposit) {
    const newDeposit = SecurityDeposit.create({
      id: depositId,
      depositorId: depositor,
      parentRoscaId: rosca_id.toString(),
      amount
    });
    await newDeposit.save();
    logger.info(`Created SecurityDeposit ${depositId} with amount ${amount}`);

    const rosca = await Rosca.get(rosca_id.toString());
    if (rosca) {
      rosca.totalSecurityDeposits += amount;
      await rosca.save();
      logger.info(`Updated Rosca ${rosca_id} totalSecurityDeposits to ${rosca.totalSecurityDeposits}`);
    }
    return;
  }

  securityDeposit.amount += amount;
  await securityDeposit.save();
  logger.info(`Incremented SecurityDeposit ${depositId} by ${amount}`);

  const rosca = await Rosca.get(rosca_id.toString());
  if (rosca) {
    rosca.totalSecurityDeposits += amount;
    await rosca.save();
    logger.info(`Updated Rosca ${rosca_id} totalSecurityDeposits to ${rosca.totalSecurityDeposits}`);
  }
}

export async function handleSecurityDepositClaimed(event: SubstrateEvent): Promise<void> {
  const [rosca_id, depositor, amount] = event.event.data.toJSON() as SecurityDepositClaimedEvent;
  logger.info(`SecurityDepositClaimedEvent: rosca_id=${rosca_id}, depositor=${depositor}, amount=${amount}`);

  const depositId = `${rosca_id}-${depositor}`;
  const deposit = await SecurityDeposit.get(depositId);

  if (!deposit) {
    logger.warn(`SecurityDeposit not found for claim: ${depositId}`);
    return;
  }

  if (deposit.amount !== amount) {
    logger.error(`Mismatch in claimed amount for deposit ${depositId}: expected ${deposit.amount}, got ${amount}`);
    return;
  }
  const rosca = await Rosca.get(rosca_id.toString());
  try {
    if (rosca) {
      rosca.totalSecurityDeposits -= amount;
      await rosca.save();
      logger.info(`Decremented Rosca ${rosca_id} totalSecurityDeposits by ${amount}`);
    }

    await store.remove('SecurityDeposit', depositId);
    logger.info(`Removed SecurityDeposit ${depositId}`);
  } catch (err) {
    logger.error(`Error processing deposit claim for ${depositId}: ${err}`);
  }
}

export async function handleNewRoundStarted(event: SubstrateEvent): Promise<void> {
  const [rosca_id, new_eligible_recipient, payment_cutoff] = event.event.data.toJSON() as NewRoundStartedEvent;
  logger.info(`NewRoundStartedEvent: rosca_id=${rosca_id}, new recipient=${new_eligible_recipient}`);

  const rosca = await Rosca.get(rosca_id.toString());
  if (!rosca) {
    logger.warn(`Rosca not found for new round: ${rosca_id}`);
    return;
  }

  rosca.currentRecipient = new_eligible_recipient;
  rosca.currentRoundNumber += 1;
  rosca.currentRoundPaymentCutoff! += BigInt(payment_cutoff);

  await rosca.save();
  logger.info(`Started new round ${rosca.currentRoundNumber} for Rosca ${rosca_id}`);
}
