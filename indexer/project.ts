import {
  SubstrateDatasourceKind,
  SubstrateHandlerKind,
  SubstrateProject,
} from "@subql/types";

import * as dotenv from 'dotenv';
import path from 'path';

const mode = process.env.NODE_ENV || 'production';

// Load the appropriate .env file
const dotenvPath = path.resolve(__dirname, `.env${mode !== 'production' ? `.${mode}` : ''}`);
dotenv.config({ path: dotenvPath });

// Can expand the Datasource processor types via the genreic param
const project: SubstrateProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "polkadot-starter",
  description:
    "This project can be used as a starting point for developing your SubQuery project",
  runner: {
    node: {
      name: "@subql/node",
      version: ">=3.0.1",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    /* The genesis hash of the network (hash of block 0) */
    chainId: process.env.CHAIN_ID!,
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: process.env.ENDPOINT!?.split(',') as string[] | string,
  },
  dataSources: [
    {
      kind: SubstrateDatasourceKind.Runtime,
      startBlock: 1,
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleRoscaCreated",
            filter: {
              module: "rosca",
              method: "RoscaCreated",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleRoscaStarted",
            filter: {
              module: "rosca",
              method: "RoscaStarted",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleParticipantDefaulted",
            filter: {
              module: "rosca",
              method: "ParticipantDefaulted",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleContributionMade",
            filter: {
              module: "rosca",
              method: "ContributionMade",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleDepositDeducted",
            filter: {
              module: "rosca",
              method: "DepositDeducted",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleJoinedRosca",
            filter: {
              module: "rosca",
              method: "JoinedRosca",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleLeftRosca",
            filter: {
              module: "rosca",
              method: "LeftRosca",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleRoscaComplete",
            filter: {
              module: "rosca",
              method: "RoscaComplete",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleSecurityDepositContribution",
            filter: {
              module: "rosca",
              method: "SecurityDepositContribution",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleSecurityDepositClaimed",
            filter: {
              module: "rosca",
              method: "SecurityDepositClaimed",
            },
          },
          {
            kind: SubstrateHandlerKind.Event,
            handler: "handleNewRoundStarted",
            filter: {
              module: "rosca",
              method: "NewRoundStarted",
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;
