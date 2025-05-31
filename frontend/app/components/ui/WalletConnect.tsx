'use client';

import { useCallback, useEffect, useState } from 'react';
import { WalletConnectModal } from '@walletconnect/modal';
import { walletConnectConfig, chainIds } from '@/config/walletConnect';
import { walletConnectService } from '@/services/walletConnect';
import { SessionTypes } from '@walletconnect/types';
import { Button } from '@heroui/button';
import { Image } from '@heroui/image';


export const WalletConnect = () => {
  const [provider, setProvider] = useState<Promise<any>>();
  const [modal, setModal] = useState<WalletConnectModal>();

  const handleModal = useCallback((uri?: string) => {
    if (uri) modal?.openModal({ uri });
  }, [modal]);

  const handleSession = useCallback(
    async (approval: () => Promise<SessionTypes.Struct>) => {
      const chainId = chainIds['circles'];
      const session = await approval();
      const account = await walletConnectService.init(session, chainId);
      console.log('Connected account:', account.address);
      modal?.closeModal();
    },
    [modal]
  );

  const connect = useCallback(async () => {
    if (!provider) return;
    const wcProvider = await provider;
    const { uri, approval } = await wcProvider.client.connect(walletConnectConfig);
    handleModal(uri);
    await handleSession(approval);
  }, [provider, handleModal, handleSession]);

  useEffect(() => {
    setProvider(walletConnectService.getProvider());
    setModal(
      new WalletConnectModal({
        projectId: 'e727e6ced464182502c2ffd72f9d7724',
      })
    );
  }, []);

  return (
    <Button onPress={connect}>
        <Image src="wallet_connect.svg" height={25} width={25}/>
      Connect with WalletConnect
    </Button>
  );
};
