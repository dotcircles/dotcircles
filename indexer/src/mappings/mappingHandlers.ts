import { SubstrateExtrinsic, SubstrateEvent } from "@subql/types";
import { Rosca, Round, RoscaEligibility, Account, SecurityDeposit } from "../types";
import { u8aToString, hexToString, isHex} from "@polkadot/util";


// function ensureAccount(id: string): Account {
//   let account = Account.load(id);
//   if (!account) {
//     account = new Account(id);
//     account.save(); // Save right after creation
//   }
//   return account;
// }


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
  round_number: number;
  payment_cutoff: string;
  expected_contributors: string[];
  recipient: string;
}

interface RoscaStartedEvent {
  rosca_id: number;
  started_by: string; 
  rounds: RoundInfo[];
  first_eligible_claimant: string;
  payment_cutoff: number;
}

type ContributionMadeEvent = {
  rosca_id: number,
  contributor: string;
  recipient: string;
  amount: number;
}

type DepositDeductedEvent = {
  rosca_id: number,
  contributor: string;
  recipient: string;
  amount: number;
  sufficient: boolean;
}

type JoinedRoscaEvent = {
  rosca_id: number;
  contributor: string;
}

type LeftRoscaEvent = {
  rosca_id: number;
  contributor: string;
}

type RoscaCompleteEvent = {
  rosca_id: number;
}

type SecurityDepositContributionEvent = {
  rosca_id: number;
  depositor: string;
  amount: number;
}
type SecurityDepositClaimedEvent = {
  rosca_id: number;
  depositor: string;
  amount: number;
}

type RoscaManuallyEndedEvent = {
  rosca_id: number;
}

type NewRoundStartedEvent = {
  rosca_id: number;
  new_eligible_recipient: string;
  payment_cutoff: number;
}

export async function handleRoscaCreated(event: SubstrateEvent): Promise<void> {

  const [rosca_id, contribution_amount, payment_asset, contribution_frequency, random_order, name, number_of_participants, minimum_participant_threshold, start_by_timestamp, eligible_participants, creator ] = event.event.data.toJSON() as RoscaCreatedEvent;
  // const mappedParticipants: Account[] = eligible_participants.map(address => ({id: address}));

  const participantEntities: Account[] = [];

  for (const address of eligible_participants) {
    let account = await Account.get(address);

    if (!account) {
      account = Account.create({
        id: address
      });
      await account.save();
    }

    participantEntities.push(account);
  }


  const roscaEntity = Rosca.create({
    id: rosca_id.toString(),
    roscaId : rosca_id,
    name : name,
    creator : creator,
    paymentAsset: payment_asset,
    randomOrder : random_order,
    totalParticipants : number_of_participants,
    minParticipants : minimum_participant_threshold,
    contributionAmount : BigInt(contribution_amount),
    contributionFrequency : BigInt(contribution_frequency),
    startTimestamp : BigInt(start_by_timestamp),
    completed : false,
    eligibleParticipants : eligible_participants,
    activeParticipants: [],
    totalSecurityDeposits: 0,
    currentRoundNumber: 0
  });
  

  await roscaEntity.save();

}

export async function handleRoscaStarted(event: SubstrateEvent): Promise<void> {

  const { rosca_id, started_by, rounds, first_eligible_claimant, payment_cutoff } = event.event.data.toJSON() as unknown as RoscaStartedEvent;

  let roscaEntity = await Rosca.get(rosca_id.toString());
  if (roscaEntity) {
    roscaEntity.startedBy = started_by;
    roscaEntity.currentRecipient = first_eligible_claimant;
    roscaEntity.currentRoundNumber = 1;
    roscaEntity.currentRoundPaymentCutoff = BigInt(payment_cutoff);
    await roscaEntity.save();
  }
  
  for (const round of rounds) {
    const roundNumber = round.round_number;
    const roundId = `${rosca_id}-${roundNumber}`;
  
    const roundEntity = Round.create({
      id: roundId,
      parentRoscaId: rosca_id.toString(),
      chainRoscaId: rosca_id,                       
      roundNumber: roundNumber,
      paymentCutoff: BigInt(round.payment_cutoff),
      expectedContributors: round.expected_contributors,  
      recipient: round.recipient,
      defaulters: [],            
      actualContributors: [],            
    });
  
    await roundEntity.save();
  }
}

export async function handleParticipantDefaulted(event: SubstrateEvent): Promise<void> {

  const [ rosca_id, unpaid_recipient, defaulter ] = event.event.data.toJSON() as ParticipantDefaultedEvent;
  
  const rounds = await Round.getByFields([
    ["parentRoscaId", "=", rosca_id],
    ["recipient", "=", unpaid_recipient],
  ], {limit: 1});
  
  for (const roundEntity of rounds) {
    if (!roundEntity.defaulters.includes(defaulter)) {
      roundEntity.defaulters.push(defaulter);
      await roundEntity.save();
    }
  }
}

export async function handleContributionMade(event: SubstrateEvent): Promise<void> {

  const { rosca_id, contributor, recipient, amount } = event.event.data.toJSON() as ContributionMadeEvent;

  const rounds = await Round.getByFields([
    ["parentRoscaId", "=", rosca_id],
    ["recipient", "=", recipient],
  ], {limit: 1});
  
  for (const roundEntity of rounds) {
    if (!roundEntity.actualContributors.includes(contributor)) {
      roundEntity.actualContributors.push(contributor);
      await roundEntity.save();
    }
  }
}

export async function handleDepositDeducted(event: SubstrateEvent): Promise<void> {

  const { rosca_id, contributor, recipient, amount } = event.event.data.toJSON() as DepositDeductedEvent;

  const rounds = await Round.getByFields([
    ["parentRoscaId", "=", rosca_id],
    ["recipient", "=", recipient],
  ], {limit: 1});
  
  for (const roundEntity of rounds) {
    if (!roundEntity.actualContributors.includes(contributor)) {
      roundEntity.actualContributors.push(contributor);
      await roundEntity.save();
    }
  }
}


export async function handleJoinedRosca(event: SubstrateEvent): Promise<void> {

  const { rosca_id, contributor } = event.event.data.toJSON() as JoinedRoscaEvent;

  const eligibilityId = `${rosca_id}-${contributor}`;
  let eligibility = await RoscaEligibility.get(eligibilityId);

  if (!eligibility) {
    logger.warn(`RoscaEligibility not found for ${eligibilityId}`);
    return;
  }

  if (event.block.timestamp) {
    eligibility.joinedAt = BigInt(event.block.timestamp.getTime());
    await eligibility.save();
  } else {
    logger.warn(`Missing timestamp for block ${event.block.block.header.number}`);
  }

}
export async function handleLeftRosca(event: SubstrateEvent): Promise<void> {

  const { rosca_id, contributor } = event.event.data.toJSON() as LeftRoscaEvent;
  const eligibilityId = `${rosca_id}-${contributor}`;
  let eligibility = await RoscaEligibility.get(eligibilityId);

  if (!eligibility) {
    logger.warn(`RoscaEligibility not found for ${eligibilityId}`);
    return;
  }

  eligibility.joinedAt = undefined;

  await eligibility.save();

}
export async function handleRoscaComplete(event: SubstrateEvent): Promise<void> {
  
  const { rosca_id } = event.event.data.toJSON() as RoscaCompleteEvent;

  let roscaEntity = await Rosca.get(rosca_id.toString());
  if (roscaEntity) {
    roscaEntity.completed = true;
    await roscaEntity.save();
  }

}


export async function handleSecurityDepositContribution(event: SubstrateEvent): Promise<void> {

  const { rosca_id, depositor, amount } = event.event.data.toJSON() as SecurityDepositContributionEvent;

  const depositId = `${rosca_id}-${depositor}`;
  let depositorAccount = await Account.get(depositor);

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

    const rosca = await Rosca.get(rosca_id.toString());
    if (rosca) {
      rosca.totalSecurityDeposits += amount;
      await rosca.save();
    }
    return;
  } 

  securityDeposit.amount += amount;
  await securityDeposit.save();

  const rosca = await Rosca.get(rosca_id.toString());
  if (rosca) {
    rosca.totalSecurityDeposits += amount;
    await rosca.save();
  }

}


export async function handleSecurityDepositClaimed(event: SubstrateEvent): Promise<void> {
  const { rosca_id, depositor, amount } = event.event.data.toJSON() as SecurityDepositClaimedEvent;

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
    }
  
    await store.remove('SecurityDeposit', depositId);
  } catch (err) {
    logger.error(`Error processing deposit claim for ${depositId}: ${err}`);
  }

}
export async function handleNewRoundStarted(event: SubstrateEvent): Promise<void> {
  const { rosca_id, new_eligible_recipient, payment_cutoff } = event.event.data.toJSON() as NewRoundStartedEvent;

  const rosca = await Rosca.get(rosca_id.toString());
  if (!rosca) {
    logger.warn(`Rosca not found for new round: ${rosca_id}`);
    return;
  }

  rosca.currentRecipient = new_eligible_recipient;
  rosca.currentRoundNumber += 1;
  rosca.currentRoundPaymentCutoff! += BigInt(payment_cutoff);

  await rosca.save();
}
