import { Link } from 'react-router-dom';
import { Shield, Database, Activity, ArrowRight, Lock, Zap, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white overflow-x-hidden">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none translate-x-1/3 translate-y-1/3" />

      {/* Navbar */}
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Aarogyan</span>
        </div>

        {/* Login buttons */}
        <nav className="flex items-center gap-2">
          <Link
            to="/patient"
            className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 hover:text-white transition-all duration-200 flex items-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            Patient Login
          </Link>
          <Link
            to="/hospital"
            className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 hover:text-white transition-all duration-200 flex items-center gap-1.5"
          >
            <Database className="w-3.5 h-3.5 text-blue-400" />
            Hospital Login
          </Link>
          <Link
            to="/researcher"
            className="px-4 py-2 text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-full text-white/80 hover:text-white transition-all duration-200 flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            Researcher Login
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-5xl mx-auto px-6 pt-28 pb-24 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-white/50 mb-8">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            Powered by Zero-Knowledge Proofs
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Privacy-Preserving
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Clinical Trials.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-white/40 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-10">
            Patients prove eligibility without revealing health data. Hospitals issue tamper-proof
            credentials. Researchers find verified matches — all on-chain, all trustless.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/patient"
              className="group flex items-center gap-2.5 px-6 py-3.5 bg-white text-zinc-950 rounded-xl font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg active:scale-95"
            >
              Get Started as Patient
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </Link>
            <Link
              to="/researcher"
              className="flex items-center gap-2.5 px-6 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 hover:border-white/20 transition-all duration-200 active:scale-95"
            >
              Explore Trials
            </Link>
          </div>
        </section>

        {/* Feature grid */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ZK Proofs */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 group hover:bg-white/5 hover:border-white/15 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">ZK Proof Eligibility</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Patients generate zero-knowledge proofs locally. No raw health data ever
                leaves the browser — not even to us.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                <Lock className="w-3 h-3" />
                Fully private
              </div>
            </div>

            {/* Hospital Verified */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 group hover:bg-white/5 hover:border-white/15 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Hospital-Verified Credentials</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Hospitals cryptographically sign EHR data. Credentials are verifiable
                on-chain without exposing patient identity.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-blue-400 text-xs font-medium">
                <Shield className="w-3 h-3" />
                Tamper-proof
              </div>
            </div>

            {/* On-Chain Matching */}
            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-6 group hover:bg-white/5 hover:border-white/15 transition-all duration-300">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">On-Chain Matching</h3>
              <p className="text-white/40 text-sm leading-relaxed">
                Smart contracts match verified patients to trials transparently. Researchers
                receive nullifier-based contact handles, not identities.
              </p>
              <div className="mt-4 flex items-center gap-1.5 text-purple-400 text-xs font-medium">
                <Users className="w-3 h-3" />
                Pseudonymous
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 pb-24">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 md:p-12">
            <h2 className="text-2xl font-bold text-white text-center mb-10">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Hospital Issues EHR', desc: 'Signs patient health data into a portable credential bundle.' },
                { step: '02', title: 'Patient Imports EHR', desc: 'Loads credential locally. No upload to any server.' },
                { step: '03', title: 'ZK Proof Generated', desc: 'Browser proves eligibility in-device. Proof sent on-chain.' },
                { step: '04', title: 'Researcher Matched', desc: 'Smart contract emits match event. Researcher decrypts contact.' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-bold text-white/10 mb-3">{item.step}</div>
                  <h4 className="font-semibold text-white text-sm mb-2">{item.title}</h4>
                  <p className="text-white/35 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-6 text-center">
        <p className="text-white/20 text-sm">
          &copy; {new Date().getFullYear()} Aarogyan. Privacy-first clinical research infrastructure.
        </p>
      </footer>
    </div>
  );
}
