import { Loader2 } from 'lucide-react';

interface ProcessingViewProps {
  status: string;
}

export default function ProcessingView({ status }: ProcessingViewProps) {
  return (
    <div className="p-8 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-[#161D2B] border border-[#1E2D3D] rounded-2xl p-12 text-center w-full max-w-md">
        {/* Animated logo */}
        <div className="relative mx-auto w-16 h-16 mb-6">
          <div className="absolute inset-0 rounded-full border-2 border-[#8B7CFF]/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#8B7CFF] animate-spin" />
          <div className="absolute inset-2 rounded-full bg-[#8B7CFF]/10 flex items-center justify-center">
            <Loader2 size={20} className="text-[#8B7CFF] animate-spin" />
          </div>
        </div>

        <h2 className="text-lg font-semibold text-[#F8FAFC] mb-2">Analysing your response</h2>
        <p className="text-sm text-[#94A3B8] mb-6">{status || 'Processing...'}</p>

        {/* Step indicators */}
        <div className="space-y-2.5 text-left">
          <ProcessingStep
            label="Transcribing with Gnani Prisma"
            active={status.includes('Transcrib')}
            done={status.includes('Analysing')}
          />
          <ProcessingStep
            label="Analysing communication quality"
            active={status.includes('Analysing')}
            done={false}
          />
        </div>

        <p className="text-xs text-[#475569] mt-6">Powered by Gnani AI · Prisma</p>
      </div>
    </div>
  );
}

function ProcessingStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-sm transition-all ${active ? 'text-[#F8FAFC]' : done ? 'text-[#34D399]' : 'text-[#475569]'}`}>
      <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
        done ? 'bg-[#34D399]/20' : active ? 'bg-[#8B7CFF]/20' : 'bg-[#1E2D3D]'
      }`}>
        {done ? '✓' : active ? <span className="w-1.5 h-1.5 rounded-full bg-[#8B7CFF] animate-pulse" /> : '·'}
      </span>
      {label}
    </div>
  );
}
