import React from 'react';
import { CaseOption } from '../../types/builder';
import { BottomBar } from '../BottomBar';
import { Check, Wifi, Scale, Shield, Sparkles } from 'lucide-react';

interface CaseStepProps {
  cases: CaseOption[];
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  totalPrice: number;
}

export const CaseStep: React.FC<CaseStepProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onPrevious,
  onNext,
  totalPrice,
}) => {
  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Choose your case & layout
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-1">
          Precision CNC aluminum or frosted polycarbonate engineered with flex-cut acoustic gasket mounting.
        </p>
      </div>

      {/* Main Grid: Left Options Cards + Right Big Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Case Cards (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3.5">
          {cases.map((item) => {
            const isSelected = item.id === activeCase.id;

            return (
              <div
                key={item.id}
                onClick={() => onSelectCase(item.id)}
                className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border ${
                  isSelected
                    ? 'bg-brand-cardHover border-brand-cyan shadow-blue-glow ring-1 ring-brand-cyan/60'
                    : 'bg-brand-card/80 border-brand-border/80 hover:border-slate-600 hover:bg-brand-cardHover/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <h3 className="font-bold text-base text-white">{item.name}</h3>
                      {item.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-lime/20 text-brand-lime font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.tagline}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-base font-bold text-brand-cyan">
                      ${item.price}
                    </span>
                    {isSelected && (
                      <span className="mt-1 w-4 h-4 ml-auto rounded-full bg-brand-cyan text-black flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Specs quick row */}
                <div className="mt-3 pt-3 border-t border-brand-border/50 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{item.mountType.split(' ')[0]} Mount</span>
                  <span>{item.weight}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Preview Card (7 cols) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="relative flex-1 rounded-3xl overflow-hidden bg-gradient-to-b from-[#161a27] to-[#0c0e17] border border-brand-border shadow-2xl min-h-[380px] sm:min-h-[420px] flex flex-col justify-end">
            <div className="absolute inset-0 z-0">
              <img
                src={activeCase.image}
                alt={activeCase.name}
                className="w-full h-full object-cover object-center transition-all duration-500 scale-[1.02] hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
            </div>

            {/* Overlay Info */}
            <div className="relative z-10 p-6 sm:p-8">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan font-semibold">
                  <Sparkles className="w-3 h-3" />
                  {activeCase.material}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-brand-border text-slate-300">
                  <Wifi className="w-3 h-3 text-brand-lime" />
                  {activeCase.connectivity}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-brand-border text-slate-300">
                  <Scale className="w-3 h-3" />
                  {activeCase.weight}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activeCase.name}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg leading-relaxed">
                {activeCase.description}
              </p>

              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Shield className="w-4 h-4 text-brand-lime" />
                  <span>Poron foam dampeners & IXPE switch pads included</span>
                </div>
                <span className="font-mono text-2xl font-bold text-brand-cyan">
                  ${activeCase.price}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <BottomBar
        currentStepLabel="Case"
        nextStepLabel="Extras"
        actionItemName={activeCase.name}
        itemPrice={activeCase.price}
        totalPrice={totalPrice}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
};
