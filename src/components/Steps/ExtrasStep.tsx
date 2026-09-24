import React from 'react';
import { ExtraOption } from '../../types/builder';
import { BottomBar } from '../BottomBar';
import { Check, Plus, Cable, Wrench, Sparkles, Shield } from 'lucide-react';

interface ExtrasStepProps {
  extras: ExtraOption[];
  selectedExtraIds: string[];
  onToggleExtra: (id: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  totalPrice: number;
}

const getExtraIcon = (iconName: string) => {
  switch (iconName) {
    case 'Cable':
      return <Cable className="w-5 h-5 text-brand-cyan" />;
    case 'Wrench':
      return <Wrench className="w-5 h-5 text-brand-lime" />;
    case 'Sparkles':
      return <Sparkles className="w-5 h-5 text-purple-400" />;
    case 'Shield':
      return <Shield className="w-5 h-5 text-amber-400" />;
    default:
      return <Sparkles className="w-5 h-5 text-brand-cyan" />;
  }
};

export const ExtrasStep: React.FC<ExtrasStepProps> = ({
  extras,
  selectedExtraIds,
  onToggleExtra,
  onPrevious,
  onNext,
  totalPrice,
}) => {
  const selectedCount = selectedExtraIds.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Customize with Extras & Tuning
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-1">
          Select optional studio artisan tuning, custom aviator cables, and ergonomic accessories.
        </p>
      </div>

      {/* Extras Grid (2x2 on desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {extras.map((item) => {
          const isSelected = selectedExtraIds.includes(item.id);

          return (
            <div
              key={item.id}
              onClick={() => onToggleExtra(item.id)}
              className={`relative cursor-pointer rounded-2xl p-5 transition-all duration-200 border flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand-cardHover border-brand-lime/80 shadow-lime-glow ring-1 ring-brand-lime/40'
                  : 'bg-brand-card/80 border-brand-border/80 hover:border-slate-600 hover:bg-brand-cardHover/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-border/40 flex items-center justify-center border border-white/5">
                      {getExtraIcon(item.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">{item.name}</h3>
                      <span className="text-xs font-mono text-brand-cyan">+${item.price}</span>
                    </div>
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-brand-lime text-black'
                        : 'bg-brand-border/50 text-slate-400 border border-brand-border'
                    }`}
                  >
                    {isSelected ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium">{item.tagline}</p>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-brand-border/50 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">
                  {isSelected ? '✓ Added to configuration' : 'Click to add to build'}
                </span>
                <span className={`font-semibold ${isSelected ? 'text-brand-lime' : 'text-slate-400'}`}>
                  {isSelected ? 'Selected' : 'Optional'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Bar */}
      <BottomBar
        currentStepLabel="Extras"
        nextStepLabel="Review Build"
        actionItemName={`${selectedCount} Extra${selectedCount === 1 ? '' : 's'}`}
        itemPrice={0}
        totalPrice={totalPrice}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </div>
  );
};
