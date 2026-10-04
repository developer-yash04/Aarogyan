import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import WalletConnect from '../components/auth/WalletConnect';
import Navbar from '../components/ui/Navbar';
import { Download } from 'lucide-react';

export default function HospitalDashboard() {
  const { role, isLoading, token } = useAuth();
  
  // Form State
  const [patientWallet, setPatientWallet] = useState('');
  const [birthDate, setBirthDate] = useState('1990-01-01');
  const [sex, setSex] = useState(1);
  const [hba1c, setHba1c] = useState('');
  const [bmi, setBmi] = useState('');
  const [sys, setSys] = useState('');
  const [dia, setDia] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedFile, setIssuedFile] = useState<any>(null);

  if (isLoading) return <div className="min-h-screen bg-mesh flex items-center justify-center text-white">Loading...</div>;
  if (role !== 'HOSPITAL') return <WalletConnect requiredRole="HOSPITAL" />;

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);
    setIssuedFile(null);
    try {
      const res = await fetch('http://localhost:3001/api/hospital/issue-credential', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          patientWalletAddress: patientWallet,
          healthData: {
            birthDate,
            sex: Number(sex),
            hba1cScaled: Math.round(parseFloat(hba1c) * 100),
            bmiScaled: Math.round(parseFloat(bmi) * 100),
            systolicBp: Number(sys),
            diastolicBp: Number(dia),
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setIssuedFile(data);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsIssuing(false);
    }
  };

  const downloadJson = () => {
    if (!issuedFile) return;
    const blob = new Blob([JSON.stringify(issuedFile.credentialBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = issuedFile.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-mesh pt-28 pb-12 px-8">
      <Navbar />
      
      <div className="max-w-6xl mx-auto animate-fade-in-up">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Hospital Administration</h1>
          <p className="text-zinc-400 text-lg">Issue cryptographic health credentials and decrypt patient match contacts.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 stagger">
          <div className="glass-panel p-8 col-span-1">
            <h2 className="text-xl font-bold mb-3 text-white">Issue Credential</h2>
            <p className="text-sm text-zinc-400 mb-8 leading-relaxed">Sign and issue a new verifiable EHR using your hospital's private key.</p>
            
            <form onSubmit={handleIssue} className="space-y-5">
              <div>
                <label className="label-glass">Patient Wallet Address</label>
                <input required value={patientWallet} onChange={e=>setPatientWallet(e.target.value)} className="input-glass" placeholder="0x..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-glass">Birth Date</label>
                  <input type="date" required value={birthDate} onChange={e=>setBirthDate(e.target.value)} className="input-glass" />
                </div>
                <div>
                  <label className="label-glass">Sex</label>
                  <select value={sex} onChange={e=>setSex(Number(e.target.value))} className="input-glass">
                    <option value={1}>Male</option>
                    <option value={2}>Female</option>
                  </select>
                </div>
                <div>
                  <label className="label-glass">HbA1c (%)</label>
                  <input type="number" step="0.1" required value={hba1c} onChange={e=>setHba1c(e.target.value)} className="input-glass" placeholder="e.g. 5.7" />
                </div>
                <div>
                  <label className="label-glass">BMI</label>
                  <input type="number" step="0.1" required value={bmi} onChange={e=>setBmi(e.target.value)} className="input-glass" placeholder="e.g. 22.4" />
                </div>
                <div>
                  <label className="label-glass">Sys BP</label>
                  <input type="number" required value={sys} onChange={e=>setSys(e.target.value)} className="input-glass" placeholder="120" />
                </div>
                <div>
                  <label className="label-glass">Dia BP</label>
                  <input type="number" required value={dia} onChange={e=>setDia(e.target.value)} className="input-glass" placeholder="80" />
                </div>
              </div>
              
              <button disabled={isIssuing} type="submit" className="btn-secondary w-full mt-6 py-2.5">
                {isIssuing ? 'Signing...' : 'Sign & Issue Credential'}
              </button>
            </form>

            {issuedFile && (
              <div className="mt-8 p-5 bg-green-500/10 border border-green-500/20 rounded-xl animate-fade-in text-center">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-green-400">✓</div>
                <p className="text-sm font-semibold text-green-400 mb-4">Credential generated securely.</p>
                <button onClick={downloadJson} className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm">
                  <Download className="w-4 h-4" /> Download EHR (.json)
                </button>
              </div>
            )}
          </div>

          <div className="glass-panel p-8 col-span-2">
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-3">
              Incoming Trial Matches
              <span className="badge badge-blue ml-auto">Live Monitoring</span>
            </h2>
            <div className="divider-glass" />
            
            <div className="text-center text-zinc-500 py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-2xl">📡</div>
              <p>No recent matches detected on-chain for your events.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
