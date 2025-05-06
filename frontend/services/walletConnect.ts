import UniversalProvider, { UniversalProviderOpts } from '@walletconnect/universal-provider';
import type { SessionTypes } from '@walletconnect/types';
import { WalletAccount } from '@talismn/connect-wallets';
import { Signer } from '@polkadot/types/types';
import logo from '@/public/wallet_connect.svg';

const metadata = {
  name: 'DotCircles',
  description: 'DotCircles',
  url: 'https://your-dapp-url.com',
  icons: ['https://your-dapp-url.com/icon.png'],
};

export const walletConnectService = {
  provider: undefined as UniversalProvider | undefined,
  session: undefined as { topic: string } | undefined,

  getProvider: async function (): Promise<UniversalProvider> {
    if (!this.provider) {
      this.provider = await UniversalProvider.init({
        projectId: 'e727e6ced464182502c2ffd72f9d7724',
        relayUrl: 'wss://relay.walletconnect.com',
        metadata,
      } as UniversalProviderOpts);
    }
    return this.provider;
  },

  init: async function (session: SessionTypes.Struct, chainId: string): Promise<WalletAccount> {
    const provider = await this.getProvider();
    this.session = { topic: session.topic };

    const addresses = Object.values(session.namespaces)
      .flatMap(ns => ns.accounts)
      .map(account => account.split(':')[2]);

    const signer: Signer = {
      signPayload: async (data) => {
        return provider.client.request({
          chainId,
          topic: session.topic,
          request: {
            method: 'polkadot_signTransaction',
            params: {
              address: data.address,
              transactionPayload: data,
            },
          },
        });
      },
    };

    return {
      address: addresses[0],
      source: 'walletConnect',
      name: 'WalletConnect',
      signer: signer as WalletAccount['signer'],
      wallet: {
        enable: () => undefined,
        extensionName: 'walletConnect',
        title: 'Wallet Connect',
        installUrl: 'https://walletconnect.com/',
        logo: {
          src: logo.src,
          alt: 'WalletConnect',
        },
        installed: true,
        extension: undefined,
        signer,
        getAccounts: () => Promise.resolve([]),
        subscribeAccounts: () => undefined,
        transformError: (err: Error) => err,
      },
    };
  },
};
