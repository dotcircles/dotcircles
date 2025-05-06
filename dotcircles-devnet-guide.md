
## 0. Prepare Zombienet Binaries

Before starting the network:

1. Create a folder inside `generic-template` called `bin-stable-2409`.

```bash
cd generic-template
mkdir bin-stable-2409
```

2. Download the following binaries from the [Polkadot SDK stable2409-2 release](https://github.com/paritytech/polkadot-sdk/releases/tag/polkadot-stable2409-2) and place them into the `bin-stable-2409` folder:

- `polkadot-execute-worker`
- `polkadot-prepare-worker`
- `polkadot`
- `polkadot-parachain`

Make sure the binaries are executable:

```bash
chmod +x bin-stable-2409/*
```

---

# DotCircles Local Devnet Setup & Testing Guide


## 1. Spin Up the Network

### Step 1: Download and Set Up Zombienet Binary

1. Download the Zombienet binary for your OS from the latest release:  
   [https://github.com/paritytech/zombienet/releases](https://github.com/paritytech/zombienet/releases)

2. Move the binary into the `generic-template` folder of the DotCircles repo.

3. Make the binary executable:

```bash
chmod +x zombienet-*
```

---

### Step 2: Enter the Project Directory

```bash
cd generic-template
```

### Step 3: Start Zombienet

```bash
./zombienet-binary -p native spawn ./zombienet-config/devnet.toml
```

This command will spin up:

- Rococo
- Asset Hub
- DotCircles

---


```bash
cd generic-template
```

### Step 2: Start Zombienet

```bash
./zombienet-linux-x64 -p native spawn ./zombienet-config/devnet.toml
```

This command will spin up:

- Rococo
- Asset Hub
- DotCircles

---

## 2. Fund the Parachain Account

Make a transfer to the parachain account `2000 - 5Ec4AhPUwPeyTFyuhGuBbD224mY85LKLMSqSSo33JYWCazU4`.

---

## 3. Open HRMP Channel Between DotCircles and Asset Hub

Use the **Alice account** to submit the following HRMP channel creation extrinsic:

```text
0x0f001f000301000314000400000000070010a5d4e81300000000070010a5d4e80006000300c16678419c183c0ae8030000140d0100000100411f
```

---

## 4. Transfer USDT from Asset Hub to DotCircles (Optional Test)

Use the **Alice account** to call limited reserve transfer:

```text
0x1f0803010100411f0300010100d43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d0304000002043205011f0002286bee0000000000
```

Repeat this process for **Bob** and **Charlie** to ensure all accounts have enough stablecoins.

---

## 5. Transfer USDT Back from DotCircles to Asset Hub (Optional Test)

(Requires that the token was previously received from Asset Hub)

```text
0x1f0803010100a10f03000101008eaf04151687736326c9fea17e25fc5287613693c912909cb226aa4794f26a48030400010300a10f043205011f000284d7170000000000
```

---

## 6. Start the SubQuery Indexer

### Step 1: Navigate to the Indexer

```bash
cd /indexer
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure `.env`

Set:

- `WS_ENDPOINT`: your local chain WebSocket endpoint
- `CHAIN_ID`: hash of the parachain genesis block (findable via Polkadot JS or Zombienet logs)

### Step 4: Start the Indexer

```bash
npm run-script dev
```

> Docker must be installed for this step.

The SubQuery playground will be available at `http://localhost:3000`.

---

## 7. Start the Frontend

### Step 1: Navigate to Frontend Directory

```bash
cd /frontend
```

### Step 2: Install Dependencies

```bash
pnpm install
```

### Step 3: Start Development Server

```bash
pnpm run dev
```

> This will deploy the app to `http://localhost:9000`.

---

## 8. Interact With the App

- Import **Alice**, **Bob**, and **Charlie** accounts.
- Switch between accounts to simulate interactions.

---

## 9. Create a Circle

1. Use Alice to fill out the create circle form.
2. Set the minimum participant threshold to **three**.
3. Sign the transaction.

---

## 10. Join the Circle

- Switch to **Bob** or **Charlie**.
- You should see the circle under *Invited Circles* and *Pending* tabs.
- View details for more information.
- Click **Join Circle** with both accounts.

---

## 11. Start the Circle

Once all three have joined:

- All accounts will see the **Start Circle** button.
- Call the extrinsic to begin.

---

## 12. Participate in Rounds

- After starting, the UI shows:
  - Future contributors and recipients
  - Cutoff dates for each round

### Round Flow:

- **Alice** is the first recipient.
- **Bob** and **Charlie** contribute.
- Once both have paid, the round auto-progresses.
- Early contributions are allowed but do not affect round schedule.
- Round history updates, showing contributors and defaulters.

---

## 13. Complete the Circle

- Continue contributing until all rounds are done.
- The circle will then appear in the **Completed** tab of *My Circles*.
