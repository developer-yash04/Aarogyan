import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ShieldAlert, Activity, Database, Loader2 } from 'lucide-react';

interface WalletConnectProps {
  requiredRole: 'PATIENT' | 'HOSPITAL' | 'RESEARCHER';
}

export default function WalletConnect({ requiredRole }: WalletConnectProps) {
  const { login } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    setError('');
    setIsConnecting(true);
    try {
      if (!window.ethereum) throw new Error("MetaMask is not installed!");

      // 1. Get Wallet Address
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];

      // 2. Get Nonce from Server
      const nonceRes = await fetch('http://localhost:3001/api/auth/nonce');
      const { message } = await nonceRes.json();

      // 3. Sign Message
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, address],
      });

      // 4. Verify & Login
      await login(address, signature, message);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const roleConfig = {
    PATIENT: { icon: Activity, color: 'text-green-400', bg: 'bg-green-400/10' },
    HOSPITAL: { icon: Database, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    RESEARCHER: { icon: ShieldAlert, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  };

  const Config = roleConfig[requiredRole];
  const Icon = Config.icon;

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <div className="glass-panel p-10 max-w-md w-full text-center animate-fade-in-up">
        <div className={`w-16 h-16 mx-auto rounded-2xl ${Config.bg} flex items-center justify-center mb-6 border border-white/5 shadow-inner`}>
          <Icon className={`w-8 h-8 ${Config.color}`} />
        </div>
        
        <h2 className="text-3xl font-extrabold text-white mb-3 tracking-tight">
          {requiredRole.charAt(0) + requiredRole.slice(1).toLowerCase()} Portal
        </h2>
        
        <p className="text-sm text-zinc-400 mb-8 leading-relaxed">
          Sign in securely with your Ethereum wallet to access the decentralized workspace. No passwords required.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-8 animate-fade-in text-left flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button 
          onClick={handleConnect}
          disabled={isConnecting}
          className="btn-primary w-full flex items-center justify-center gap-3 py-3 text-base"
        >
          {isConnecting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Authenticating...</>
          ) : (
            'Connect Wallet'
          )}
        </button>
      </div>
    </div>
  );
}
