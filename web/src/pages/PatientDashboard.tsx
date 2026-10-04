import { useAuth } from '../hooks/useAuth';
import WalletConnect from '../components/auth/WalletConnect';
import CoreWorkflow from '../App.backup';

export default function PatientDashboard() {
  const { role, isLoading, address, logout } = useAuth();

  if (isLoading) return <div className="min-h-screen bg-mesh flex items-center justify-center text-white">Loading session...</div>;
  if (role !== 'PATIENT') return <WalletConnect requiredRole="PATIENT" />;

  return <CoreWorkflow workspace="patient" authAddress={address} authRole={role} onLogout={logout} />;
}
