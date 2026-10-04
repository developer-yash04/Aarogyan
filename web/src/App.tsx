import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import PatientDashboard from './pages/PatientDashboard';
import HospitalDashboard from './pages/HospitalDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import InspectorDashboard from './pages/InspectorDashboard';
import { Shield } from 'lucide-react';

function LandingPage() {
  return (
    <div className="min-h-screen bg-mesh text-white overflow-hidden relative">
      {/* Decorative Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/10 blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-white/5 blur-[150px] rounded-full pointer-events-none animate-pulse-slow" style={{ animationDelay: '2s' }} />
      
      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 min-h-20 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-2xl font-bold tracking-tighter">Aarogyan</span>
          </div>
          <div className="flex flex-wrap justify-end gap-2 sm:gap-4">
            <Link to="/patient" className="btn-secondary text-sm">Patient Login</Link>
            <Link to="/hospital" className="btn-secondary text-sm">Hospital Login</Link>
            <Link to="/researcher" className="btn-secondary text-sm">Researcher Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 text-center animate-fade-in-up">
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
          Privacy-Preserving<br />Clinical Trials.
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          The first decentralized protocol for cryptographic patient matching. Prove you qualify for clinical trials without revealing your underlying health data using Zero-Knowledge Proofs.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sm:gap-6">
          <Link to="/patient" className="btn-primary text-lg px-8 py-4">I am a Patient</Link>
          <Link to="/researcher" className="btn-secondary text-lg px-8 py-4">I am a Researcher</Link>
        </div>
      </main>

      {/* Grid */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 pb-32 stagger">
        <div className="glass-panel p-8 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-xl">🏥</div>
          <h3 className="text-xl font-bold mb-3">1. Hospital Verified</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Hospitals issue cryptographically signed health credentials directly to patients.</p>
        </div>
        <div className="glass-panel p-8 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-xl">🔐</div>
          <h3 className="text-xl font-bold mb-3">2. Zero-Knowledge</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Patients generate ZK proofs locally in the browser to prove trial eligibility.</p>
        </div>
        <div className="glass-panel p-8 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-xl">⛓️</div>
          <h3 className="text-xl font-bold mb-3">3. On-Chain Matching</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">Smart contracts verify proofs instantly, triggering secure contact decryption.</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/hospital" element={<HospitalDashboard />} />
          <Route path="/researcher" element={<ResearcherDashboard />} />
          <Route path="/inspector" element={<InspectorDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
