import React from 'react';

interface GlassPanelProps {
  className?: string;
  children: React.ReactNode;
}

export default function GlassPanel({ className = '', children }: GlassPanelProps) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl ${className}`}
    >
      {children}
    </div>
  );
}
