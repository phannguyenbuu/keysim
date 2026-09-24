import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface BottomBarProps {
  currentStepLabel: string;
  nextStepLabel?: string;
  actionItemName: string;
  itemPrice: number;
  totalPrice: number;
  onPrevious?: () => void;
  onNext: () => void;
  isLastStep?: boolean;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  nextStepLabel,
  actionItemName,
  totalPrice,
  onPrevious,
  onNext,
  isLastStep = false,
}) => {
  return (
    <div className="w-full mt-8 pt-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Back Button */}
        {onPrevious ? (
          <button
            onClick={onPrevious}
            className="flex items-center space-x-2 px-5 py-3 rounded-2xl bg-brand-card hover:bg-brand-cardHover border border-brand-border text-slate-300 hover:text-white transition-all text-sm font-medium w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        ) : (
          <div className="hidden sm:block" />
        )}

        {/* Primary Action Button (Figma Neon Lime CTA) */}
        <div className="flex-1 max-w-2xl w-full">
          <button
            onClick={onNext}
            className="w-full group py-4 px-6 rounded-2xl bg-brand-lime hover:bg-brand-limeHover text-black font-semibold text-sm sm:text-base flex items-center justify-center space-x-3 transition-all transform active:scale-[0.99] shadow-lime-glow"
          >
            <span>
              {isLastStep
                ? `Proceed to Checkout ($${totalPrice.toFixed(2)})`
                : `Add ${actionItemName} & Continue${nextStepLabel ? ` to ${nextStepLabel}` : ''}`}
            </span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </button>
        </div>

        {/* Total Price Quick Tag */}
        <div className="text-right hidden lg:block">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 block">Total Est.</span>
          <span className="font-mono text-lg font-bold text-white">${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
