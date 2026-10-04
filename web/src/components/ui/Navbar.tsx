import { useAuth } from '../../hooks/useAuth';
import { Shield, LogOut, ScanSearch } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const { role, name, address, logout } = useAuth();

  const roleColors = {
    PATIENT: 'bg-green-500',
    HOSPITAL: 'bg-blue-500',
    RESEARCHER: 'bg-purple-500'
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/40 backdrop-blur-xl border-b border-white/5 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white ml-1">Aarogyan</span>
        </Link>

        {role && (
          <div className="flex items-center gap-3 animate-fade-in">
            {(role === 'HOSPITAL' || role === 'RESEARCHER') && (
              <NavLink
                to="/inspector"
                aria-label="Open on-chain inspector"
                className={({ isActive }) => `nav-workspace-link ${isActive ? 'is-active' : ''}`}
              >
                <ScanSearch className="w-4 h-4" />
                <span>On-chain inspector</span>
              </NavLink>
            )}
            <div className="hidden sm:flex items-center gap-2 glass-card px-4 py-2 rounded-full border-white/5">
              <span className={`w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor] animate-pulse ${roleColors[role as keyof typeof roleColors]}`} />
              <span className="text-[13px] font-semibold text-zinc-300 tracking-wide">
                {name || `${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </span>
            </div>
            
            <button 
              onClick={logout}
              className="text-zinc-400 hover:text-white p-2.5 rounded-xl hover:bg-white/10 transition-all active:scale-95"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
