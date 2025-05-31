import { gql } from "graphql-request";

export const ROSCA_CARD_FIELDS = gql`
  fragment RoscaCardFields on Rosca {
    id
    roscaId
    name
    creator
    paymentAsset
    randomOrder
    totalParticipants
    minParticipants
    contributionAmount
    contributionFrequency
    startedBy
    startTimestamp
    completed
    eligibleParticipants
    activeParticipants
    totalSecurityDeposits
    currentRecipient
    currentRoundNumber
    currentRoundPaymentCutoff
  }
`;

export const ROUND_FIELDS = gql`
  fragment RoundFields on Round {
    id
    chainRoscaId
    parentRosca { id }
    roundNumber
    paymentCutoff
    recipient
    expectedContributors
    actualContributors
    defaulters
  }
`;

export const ROSCA_ELIGIBILITIES = gql`
  fragment RoscaEligibilityFields on RoscaEligibility {
  joinedAt
  account { id }
}
`;

export const GET_ACCOUNT_ROSCAS = gql`
  ${ROSCA_CARD_FIELDS}
  ${ROSCA_ELIGIBILITIES}

  query GetAccountRoscas($accountId: String!) {
    account(id: $accountId) {
      id
      eligibleFor {
        nodes {
          joinedAt
          parentRosca {
            ...RoscaCardFields
            eligibilities {
              nodes { ...RoscaEligibilityFields }
            }
          }
        }
      }
    }
  }
`;

export const GET_ROSCA_DETAIL = gql`
  ${ROSCA_CARD_FIELDS}
  ${ROUND_FIELDS}
  ${ROSCA_ELIGIBILITIES}

  query GetRoscaDetail($roscaId: Int!) {
    roscas(filter: { roscaId: { equalTo: $roscaId } }) {
      nodes {
        ...RoscaCardFields
        eligibilities {
          nodes { ...RoscaEligibilityFields }
        }
        rounds(orderBy: ROUND_NUMBER_ASC) {
          nodes {
            ...RoundFields
          }
        }
        securityDeposits {
          nodes {
            depositorId
            amount
          }
        }
      }
    }
  }
`;
