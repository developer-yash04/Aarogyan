import { useState, useCallback } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
declare global {
  interface Window {
    ethereum?: any;
  }
}


export function useWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = useCallback(async () => {
    setError(null);
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      const provider = new BrowserProvider(window.ethereum);
      const userSigner = await provider.getSigner();
      const userAddress = await userSigner.getAddress();

      setSigner(userSigner);
      setAccount(userAddress);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return { account, signer, isConnecting, error, connectWallet };
}
