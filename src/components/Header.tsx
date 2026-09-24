import React from 'react';
import { StepId } from '../types/builder';
import { ShoppingBag } from 'lucide-react';

interface HeaderProps {
  currentStep: StepId;
  onSelectStep: (step: StepId) => void;
  totalPrice: number;
  totalItems: number;
  onOpenCart: () => void;
  onOpenSoundTester: () => void;
}

const STEPS: { id: StepId; label: string; number: number }[] = [
  { id: 'switches', label: 'Switches', number: 1 },
  { id: 'keycaps', label: 'Keycaps', number: 2 },
  { id: 'case', label: 'Case', number: 3 },
  { id: 'extras', label: 'Extras', number: 4 },
];

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  totalPrice,
  onOpenCart,
}) => {
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <header className="w-full bg-[#0c0d12] border-b border-[#1a1d28] z-30">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Logo & Tagline */}
        <div
          className="flex items-center space-x-3 cursor-pointer select-none"
          onClick={() => onSelectStep('switches')}
        >
          <div className="w-7 h-7 rounded-[7px] bg-[#d4ff00] flex items-center justify-center font-black text-black text-base leading-none shadow-sm">
            K
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="font-bold text-lg text-white tracking-tight">
              Keyhaus
            </span>
            <span className="text-[#333b4f] text-sm">|</span>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Build your custom keyboard
            </span>
          </div>
        </div>

        {/* Center: Stepper (Switches, Keycaps, Case, Extras) */}
        <nav className="hidden md:flex items-center space-x-3">
          {STEPS.map((step, idx) => {
            const isCurrent = step.id === currentStep;
            const isCompleted = idx < currentStepIndex;

            return (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => onSelectStep(step.id)}
                  className="flex items-center space-x-2 text-xs font-medium cursor-pointer transition-colors"
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#d4ff00] text-black shadow-[0_0_12px_rgba(212,255,0,0.4)]'
                        : isCompleted
                        ? 'bg-[#1e2330] text-[#d4ff00]'
                        : 'bg-[#181b26] text-slate-500'
                    }`}
                  >
                    {step.number}
                  </span>
                  <span
                    className={
                      isCurrent
                        ? 'text-white font-semibold'
                        : isCompleted
                        ? 'text-slate-300'
                        : 'text-slate-500'
                    }
                  >
                    {step.label}
                  </span>
                </button>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`w-6 h-[1px] transition-colors ${
                      idx < currentStepIndex ? 'bg-[#2a3042]' : 'bg-[#1c202d]'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right: Cart Summary / Total */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCart}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#141722] hover:bg-[#1a1e2d] border border-[#1e2330] text-slate-200 transition-colors text-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#d4ff00]" />
            <span className="font-mono font-medium">${totalPrice.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
