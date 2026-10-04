import { useAuth } from '../hooks/useAuth';
import WalletConnect from '../components/auth/WalletConnect';
import CoreWorkflow from '../App.backup';

export default function InspectorDashboard() {
  const { role, isLoading, address, logout } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-mesh flex items-center justify-center text-white">Loading session...</div>;
  if (role !== 'RESEARCHER' && role !== 'HOSPITAL') return <WalletConnect requiredRole="RESEARCHER" />;

  return <CoreWorkflow workspace="inspector" authAddress={address} authRole={role} onLogout={logout} />;
}
