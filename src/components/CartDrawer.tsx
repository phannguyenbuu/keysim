import React from 'react';
import {
  SwitchOption,
  KeycapOption,
  CaseOption,
  ExtraOption,
  StepId,
} from '../types/builder';
import { X, ArrowRight, Trash2, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSwitch: SwitchOption;
  selectedKeycap: KeycapOption;
  selectedCase: CaseOption;
  selectedExtras: ExtraOption[];
  onRemoveExtra: (extraId: string) => void;
  totalPrice: number;
  onNavigateStep: (step: StepId) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  selectedSwitch,
  selectedKeycap,
  selectedCase,
  selectedExtras,
  onRemoveExtra,
  totalPrice,
  onNavigateStep,
}) => {
  if (!isOpen) return null;

  const handleGoToStep = (step: StepId) => {
    onNavigateStep(step);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-brand-panel border-l border-brand-border p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative">
          {/* Top Header */}
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-brand-border/70 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-brand-lime/20 border border-brand-lime/40 flex items-center justify-center text-brand-lime">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-bold text-white">Current Custom Build</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-brand-border/50 hover:bg-brand-border text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-4 text-xs">
              {/* Switch Item */}
              <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    1. Switch Base
                  </span>
                  <strong className="text-sm text-white font-semibold block">
                    {selectedSwitch.name}
                  </strong>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedSwitch.specs.type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-brand-cyan text-sm font-bold block">
                    ${selectedSwitch.price}
                  </span>
                  <button
                    onClick={() => handleGoToStep('switches')}
                    className="text-[11px] text-slate-400 hover:text-brand-cyan transition-colors underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Keycaps Item */}
              <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    2. Keycap Set
                  </span>
                  <strong className="text-sm text-white font-semibold block">
                    {selectedKeycap.name}
                  </strong>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedKeycap.material}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-brand-cyan text-sm font-bold block">
                    +${selectedKeycap.price}
                  </span>
                  <button
                    onClick={() => handleGoToStep('keycaps')}
                    className="text-[11px] text-slate-400 hover:text-brand-cyan transition-colors underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Case Item */}
              <div className="p-3.5 rounded-2xl bg-brand-card border border-brand-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    3. Case & Mounting
                  </span>
                  <strong className="text-sm text-white font-semibold block">
                    {selectedCase.name}
                  </strong>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {selectedCase.material}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-brand-cyan text-sm font-bold block">
                    +${selectedCase.price}
                  </span>
                  <button
                    onClick={() => handleGoToStep('case')}
                    className="text-[11px] text-slate-400 hover:text-brand-cyan transition-colors underline"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Extras Items */}
              {selectedExtras.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-brand-border/40">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">
                    4. Extras ({selectedExtras.length})
                  </span>
                  {selectedExtras.map((extra) => (
                    <div
                      key={extra.id}
                      className="p-2.5 rounded-xl bg-brand-card/60 border border-brand-border/50 flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-slate-200 block text-xs">{extra.name}</strong>
                        <span className="font-mono text-brand-cyan text-[11px]">
                          +${extra.price}
                        </span>
                      </div>
                      <button
                        onClick={() => onRemoveExtra(extra.id)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                        title="Remove Extra"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Total & Checkout CTA */}
          <div className="pt-6 border-t border-brand-border/80">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-slate-400 text-sm">Estimated Total</span>
              <span className="font-mono text-2xl font-extrabold text-white">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => handleGoToStep('review')}
              className="w-full py-4 px-6 rounded-2xl bg-brand-lime hover:bg-brand-limeHover text-black font-extrabold text-sm flex items-center justify-center space-x-2 transition-all shadow-lime-glow"
            >
              <span>Review & Place Order</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
