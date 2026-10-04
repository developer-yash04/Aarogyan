import { useState, useCallback } from 'react';

interface WalletState {
  address: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnecting: false,
    error: null,
  });

  const connectWallet = useCallback(async () => {
    if (!(window as any).ethereum) {
      setState(prev => ({ ...prev, error: 'MetaMask not found. Please install MetaMask.' }));
      return;
    }
    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts: string[] = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      setState({ address: accounts[0] ?? null, isConnecting: false, error: null });
    } catch (err: any) {
      setState({
        address: null,
        isConnecting: false,
        error: err?.message ?? 'Failed to connect wallet',
      });
    }
  }, []);

  return {
    address: state.address,
    isConnecting: state.isConnecting,
    error: state.error,
    connectWallet,
  };
}
