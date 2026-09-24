import React from 'react';
import {
  SwitchOption,
  KeycapOption,
  CaseOption,
  ExtraOption,
  OrderCustomerInfo,
} from '../types/builder';
import { CheckCircle2, PackageCheck, Printer, RotateCcw } from 'lucide-react';

interface CheckoutSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerInfo: OrderCustomerInfo | null;
  selectedSwitch: SwitchOption;
  selectedKeycap: KeycapOption;
  selectedCase: CaseOption;
  selectedExtras: ExtraOption[];
  totalPrice: number;
  onResetBuild: () => void;
}

export const CheckoutSuccessModal: React.FC<CheckoutSuccessModalProps> = ({
  isOpen,
  customerInfo,
  selectedSwitch,
  selectedKeycap,
  selectedCase,
  selectedExtras,
  totalPrice,
  onResetBuild,
}) => {
  if (!isOpen) return null;

  const orderNumber = `KH-${Math.floor(100000 + Math.random() * 900000)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-3xl bg-brand-card border border-brand-lime/40 p-6 sm:p-8 shadow-2xl text-center">
        {/* Celebration Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-brand-lime/20 border border-brand-lime/50 flex items-center justify-center text-brand-lime mb-5 shadow-lime-glow">
          <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
        </div>

        <span className="text-xs font-mono uppercase tracking-widest text-brand-lime font-bold">
          Order Confirmed
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
          Your Custom Build is in Queue!
        </h2>
        <p className="text-sm text-slate-400 mt-2">
          Thank you <strong className="text-slate-200">{customerInfo?.fullName || 'Customer'}</strong>.
          Confirmation sent to <span className="text-brand-cyan">{customerInfo?.email || 'your email'}</span>.
        </p>

        {/* Order Details Card */}
        <div className="mt-6 p-5 rounded-2xl bg-brand-panel border border-brand-border text-left text-xs space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-brand-border/60">
            <span className="text-slate-400">Order Reference</span>
            <span className="font-mono text-brand-lime font-bold text-sm">#{orderNumber}</span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Switches:</span>
              <span className="font-medium text-white">{selectedSwitch.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Keycaps:</span>
              <span className="font-medium text-white">{selectedKeycap.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Case Chassis:</span>
              <span className="font-medium text-white">{selectedCase.name}</span>
            </div>
            {selectedExtras.length > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Custom Extras:</span>
                <span className="font-medium text-white">{selectedExtras.length} Selected</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-baseline pt-3 border-t border-brand-border/60">
            <span className="text-slate-400 font-semibold">Total Paid</span>
            <span className="font-mono text-base font-extrabold text-brand-cyan">
              ${totalPrice.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Delivery Timeline info */}
        <div className="mt-4 p-4 rounded-xl bg-brand-border/30 text-xs text-slate-400 flex items-center gap-3 text-left">
          <PackageCheck className="w-5 h-5 text-brand-lime shrink-0" />
          <p className="text-[11px] leading-relaxed">
            Our workshop will solder, assemble, lube, and QA test your keyboard. Estimated dispatch within <strong>2-3 business days</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 py-3 px-4 rounded-xl bg-brand-border hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onResetBuild}
            className="flex-1 py-3 px-4 rounded-xl bg-brand-lime hover:bg-brand-limeHover text-black text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lime-glow"
          >
            <RotateCcw className="w-4 h-4 stroke-[2.5]" />
            <span>Configure Another Keyboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
