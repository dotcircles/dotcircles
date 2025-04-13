import { SubstrateExtrinsic, SubstrateEvent } from "@subql/types";
import { Rosca, Round } from "../types";
import { u8aToString, hexToString, isHex} from "@polkadot/util";


type ParticipantDefaultedEvent = [number, string, string]; 

type RoscaCreatedEvent = [
  number,
  number,
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
}

export async function handleRoscaCreated(event: SubstrateEvent): Promise<void> {

  const [rosca_id, contribution_amount, contribution_frequency, random_order, name, number_of_participants, minimum_participant_threshold, start_by_timestamp, eligible_participants, creator ] = event.event.data.toJSON() as RoscaCreatedEvent;
  const roscaEntity = Rosca.create({
    id: rosca_id.toString(),
    roscaId : rosca_id,
    name : name,
    creator : creator,
    randomOrder : random_order,
    totalParticipants : number_of_participants,
    minParticipants : minimum_participant_threshold,
    contributionAmount : BigInt(contribution_amount),
    contributionFrequency : BigInt(contribution_frequency),
    startTimestamp : BigInt(start_by_timestamp),
    completed : false,
    eligibleParticipants : eligible_participants,
  });
  

  await roscaEntity.save();
}

export async function handleRoscaStarted(event: SubstrateEvent): Promise<void> {

  const { rosca_id, started_by, rounds } = event.event.data.toJSON() as unknown as RoscaStartedEvent;

  let roscaEntity = await Rosca.get(rosca_id.toString());
  if (roscaEntity) {
    roscaEntity.startedBy = started_by;
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