export const chainIds = {
    polkadot: 'polkadot:91b171bb158e2d3848fa23a9f1c25182',
    circles: 'polkadot:e7e5ce39afbcf540e245297f88056947',
  } as const;

  
  
export const walletConnectConfig = {
    requiredNamespaces: {
      polkadot: {
        methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
        events: ['chainChanged', 'accountsChanged'],
        chains: [chainIds.polkadot],
      },
    },
    optionalNamespaces: {
      polkadot: {
        methods: ['polkadot_signTransaction', 'polkadot_signMessage'],
        events: ['chainChanged', 'accountsChanged'],
        chains: [
          chainIds.circles,
        ],
      },
    },
  };
  