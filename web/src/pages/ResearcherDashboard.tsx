import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import WalletConnect from '../components/auth/WalletConnect';
import Navbar from '../components/ui/Navbar';
import { Shield, Activity, Users } from 'lucide-react';

export default function ResearcherDashboard() {
  const { role, isLoading } = useAuth();
  const [trials, setTrials] = useState<any[]>([]);
  const [loadingTrials, setLoadingTrials] = useState(true);

  useEffect(() => {
    if (role === 'RESEARCHER') {
      fetch('http://localhost:3001/api/trials')
        .then(res => res.json())
        .then(data => setTrials(data))
        .catch(console.error)
        .finally(() => setLoadingTrials(false));
    }
  }, [role]);

  if (isLoading) return <div className="min-h-screen bg-mesh flex items-center justify-center text-white">Loading...</div>;
  if (role !== 'RESEARCHER') return <WalletConnect requiredRole="RESEARCHER" />;

  return (
    <div className="min-h-screen bg-mesh pt-28 pb-12 px-8">
      <Navbar />
      
      <div className="max-w-7xl mx-auto animate-fade-in-up">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Researcher Workspace</h1>
          <p className="text-zinc-400 text-lg">Manage clinical trials and monitor cryptographically verified matches.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 stagger">
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner"><Activity size={24} /></div>
            <div>
              <p className="text-3xl font-extrabold text-white tracking-tight">{trials.length}</p>
              <p className="text-sm text-zinc-400 font-medium mt-1">Active Trials</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner"><Shield size={24} /></div>
            <div>
              <p className="text-3xl font-extrabold text-white tracking-tight">0</p>
              <p className="text-sm text-zinc-400 font-medium mt-1">Verified Matches</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20 shadow-inner"><Users size={24} /></div>
            <div>
              <p className="text-3xl font-extrabold text-white tracking-tight">0</p>
              <p className="text-sm text-zinc-400 font-medium mt-1">Patients Enrolled</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 stagger">
          <div className="glass-panel p-8 col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Active Clinical Trials</h2>
              <button className="btn-primary py-2 px-4">＋ New Trial</button>
            </div>
            
            {loadingTrials ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <div className="glass-spinner mb-4"></div>
                Loading trials...
              </div>
            ) : (
              <div className="grid gap-5">
                {trials.map(trial => (
                  <div key={trial.id} className="glass-card p-6 border-l-4 border-l-purple-500 hover:border-l-purple-400">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white text-lg mb-1">{trial.title}</h3>
                        <p className="text-xs text-purple-400 font-mono flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span>
                          Event ID: {trial.eventId}
                        </p>
                      </div>
                      <button className="btn-secondary text-xs px-4 py-2">View Matches</button>
                    </div>
                    <p className="text-sm text-zinc-400 mb-5 leading-relaxed">{trial.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="badge">Age: {trial.criteria.min_age}-{trial.criteria.max_age}</span>
                      <span className="badge">HbA1c &lt; {trial.criteria.max_hba1c_scaled / 100}%</span>
                      <span className="badge">BMI: {trial.criteria.min_bmi_scaled / 100} - {trial.criteria.max_bmi_scaled / 100}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass-panel p-8 col-span-1 flex flex-col h-[600px]">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
              Live Chain Events
              <span className="status-dot status-dot-green ml-auto"></span>
            </h2>
            <div className="bg-[#09090b] p-5 rounded-2xl border border-white/5 font-mono text-[11px] leading-relaxed text-green-400 flex-grow overflow-y-auto shadow-inner">
              <p className="mb-3 opacity-70 flex items-start gap-2">
                <span className="text-zinc-500">[{new Date().toLocaleTimeString()}]</span>
                &gt; Establishing connection to Aarogyan Contract...
              </p>
              <p className="mb-3 opacity-70 flex items-start gap-2">
                <span className="text-zinc-500">[{new Date().toLocaleTimeString()}]</span>
                &gt; Listening for MatchRegistered events...
              </p>
              <p className="mb-3 text-zinc-500 italic mt-6 flex items-center justify-center gap-2">
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                Waiting for new blocks
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
