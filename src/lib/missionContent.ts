// Hand-crafted interactive content for flagship Avalanche missions.
// Generic timed engine handles everything else.

export type Question =
  | { kind: 'mcq'; prompt: string; options: string[]; answer: number; explain?: string }
  | { kind: 'order'; prompt: string; steps: string[]; explain?: string }
  | { kind: 'pick-many'; prompt: string; options: string[]; correct: number[]; explain?: string };

export interface FlagshipContent {
  intro: string;
  questions: Question[];
  successCopy: string;
}

export const FLAGSHIP_MISSIONS: Record<string, FlagshipContent> = {
  'av-explorer-quiz': {
    intro: 'Speed-quiz on the foundations of Avalanche.',
    successCopy: 'You can hold your own in any Avalanche conversation.',
    questions: [
      {
        kind: 'mcq',
        prompt: 'Which three blockchains make up the Avalanche Primary Network?',
        options: ['X-Chain, C-Chain, P-Chain', 'A-Chain, B-Chain, C-Chain', 'Subnet, Mainnet, Testnet', 'BTC, ETH, AVAX'],
        answer: 0,
        explain: 'Exchange (X), Contract (C), and Platform (P) — each is purpose-built.',
      },
      {
        kind: 'mcq',
        prompt: 'What does AWM stand for in the Avalanche stack?',
        options: ['Avalanche Warp Messaging', 'Asset Wallet Module', 'Adaptive Wallet Manager', 'Avalanche Web Mesh'],
        answer: 0,
        explain: 'AWM is native cross-subnet messaging — no external bridge required.',
      },
      {
        kind: 'mcq',
        prompt: 'A subnet is best described as…',
        options: [
          'A custom blockchain validated by a chosen validator set',
          'A smart contract on the C-Chain',
          'A copy of Ethereum mainnet',
          'A wallet sub-account',
        ],
        answer: 0,
        explain: 'Subnets let teams customize VM, gas token, validators, and rules.',
      },
      {
        kind: 'mcq',
        prompt: 'Which testnet do builders ship to before mainnet?',
        options: ['Goerli', 'Sepolia', 'Fuji', 'Mumbai'],
        answer: 2,
        explain: 'Fuji is the Avalanche testnet, paired with the Fuji faucet.',
      },
      {
        kind: 'mcq',
        prompt: 'What consensus family does Avalanche use?',
        options: ['Proof of Work', 'Snow* protocols (sub-sampled voting)', 'Tendermint BFT', 'Raft'],
        answer: 1,
        explain: 'Snowman/Avalanche reach finality via repeated sub-sampled voting.',
      },
    ],
  },

  'wallet-setup': {
    intro: 'Hands-on: get a working Core wallet, switch to Fuji, send a tx.',
    successCopy: 'You\'re now ready to interact with any Avalanche dApp.',
    questions: [
      {
        kind: 'order',
        prompt: 'Order the steps to set up a Core wallet for the first time.',
        steps: [
          'Install the Core extension',
          'Create or import a wallet',
          'Save the recovery phrase securely',
          'Switch network to Fuji testnet',
          'Request AVAX from the Fuji faucet',
        ],
        explain: 'Always save the recovery phrase before funding the wallet.',
      },
      {
        kind: 'mcq',
        prompt: 'Where do you get free Fuji AVAX for testing?',
        options: ['core.app/swap', 'faucet.avax.network', 'avascan.info/faucet', 'snowtrace.io'],
        answer: 1,
        explain: 'faucet.avax.network drips test AVAX once per address per period.',
      },
      {
        kind: 'pick-many',
        prompt: 'Which actions require gas on the C-Chain? Pick all that apply.',
        options: ['Sending AVAX', 'Approving an ERC-20', 'Switching networks in your wallet', 'Calling a smart contract'],
        correct: [0, 1, 3],
        explain: 'Switching networks is a wallet UI change — not an on-chain action.',
      },
      {
        kind: 'mcq',
        prompt: 'Best practice for storing your recovery phrase?',
        options: ['Cloud notes', 'Screenshot on phone', 'Offline, written down', 'Email to yourself'],
        answer: 2,
        explain: 'Treat it like cash. Offline only.',
      },
    ],
  },

  'smart-contract-sprint': {
    intro: 'Race against the clock to ship a Solidity contract on Fuji.',
    successCopy: 'You shipped a contract under pressure. That\'s the muscle.',
    questions: [
      {
        kind: 'order',
        prompt: 'Order the deploy pipeline.',
        steps: [
          'Write the Solidity contract',
          'Compile (solc / hardhat)',
          'Configure Fuji network in hardhat.config',
          'Deploy with a funded Fuji private key',
          'Verify on Snowtrace',
        ],
      },
      {
        kind: 'mcq',
        prompt: 'Which RPC URL targets Avalanche Fuji C-Chain?',
        options: [
          'https://api.avax-test.network/ext/bc/C/rpc',
          'https://mainnet.infura.io/v3/...',
          'https://rpc.ankr.com/eth',
          'https://goerli.infura.io',
        ],
        answer: 0,
      },
      {
        kind: 'mcq',
        prompt: 'What\'s the chain ID for Fuji C-Chain?',
        options: ['43113', '43114', '1', '11155111'],
        answer: 0,
        explain: '43113 = Fuji, 43114 = mainnet C-Chain.',
      },
      {
        kind: 'pick-many',
        prompt: 'Which checks should pass before deploy? Pick all.',
        options: ['Tests green', 'Slither/lint clean', 'Funded deployer', 'Random gas price guess'],
        correct: [0, 1, 2],
        explain: 'Always estimate gas; never guess.',
      },
      {
        kind: 'mcq',
        prompt: 'Where do you verify the deployed contract source?',
        options: ['Etherscan', 'Snowtrace (testnet.snowtrace.io)', 'BscScan', 'Polygonscan'],
        answer: 1,
      },
    ],
  },
};

export function isFlagship(gameId: string) {
  return gameId in FLAGSHIP_MISSIONS;
}
