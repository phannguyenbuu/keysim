import React, { useState } from 'react';
import {
  SwitchOption,
  KeycapOption,
  CaseOption,
  ExtraOption,
  OrderCustomerInfo,
} from '../../types/builder';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  CreditCard,
  Truck,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReviewStepProps {
  selectedSwitch: SwitchOption;
  selectedKeycap: KeycapOption;
  selectedCase: CaseOption;
  selectedExtras: ExtraOption[];
  totalPrice: number;
  onPrevious: () => void;
  onOrderComplete: (customerInfo: OrderCustomerInfo) => void;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  selectedSwitch,
  selectedKeycap,
  selectedCase,
  selectedExtras,
  totalPrice,
  onPrevious,
  onOrderComplete,
}) => {
  const [formData, setFormData] = useState<OrderCustomerInfo>({
    fullName: 'Alex Vance',
    email: 'alex.vance@keyhaus.design',
    address: '742 Evergreen Terrace',
    city: 'San Francisco, CA',
    paymentMethod: 'card',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Trigger celebration confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ccff00', '#38bdf8', '#ffffff', '#a855f7'],
    });

    setTimeout(() => {
      setIsSubmitting(false);
      onOrderComplete(formData);
    }, 900);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Review Your Custom Build
        </h1>
        <p className="text-sm sm:text-base text-slate-400 mt-1">
          Double-check your custom specification before our workshop begins assembly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Build Summary Breakdown (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Visual Showcase Card */}
          <div className="rounded-3xl overflow-hidden bg-brand-card/90 border border-brand-border p-6 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="w-full sm:w-48 h-36 rounded-2xl overflow-hidden bg-black/40 border border-white/5 shrink-0">
                <img
                  src={selectedSwitch.image}
                  alt="Keyboard custom build"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-left w-full">
                <div className="inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-brand-lime/20 border border-brand-lime/40 text-brand-lime font-bold">
                  <Sparkles className="w-3 h-3" />
                  Custom Artisan Build
                </div>
                <h3 className="text-xl font-bold text-white">
                  Keyhaus Studio 75% Custom
                </h3>
                <p className="text-xs text-slate-400">
                  Gasket Mount • Tri-Mode Wireless • Hand-Assembled & Tested
                </p>
              </div>
            </div>

            {/* Configured Components Table */}
            <div className="mt-6 pt-6 border-t border-brand-border/60 space-y-3.5 text-sm">
              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-slate-400 text-xs block">Switches</span>
                  <strong className="text-white font-medium">{selectedSwitch.name}</strong>
                  <span className="text-xs text-slate-400 ml-2">({selectedSwitch.specs.type})</span>
                </div>
                <span className="font-mono text-brand-cyan">${selectedSwitch.price}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-slate-400 text-xs block">Keycaps</span>
                  <strong className="text-white font-medium">{selectedKeycap.name}</strong>
                  <span className="text-xs text-slate-400 ml-2">({selectedKeycap.material})</span>
                </div>
                <span className="font-mono text-brand-cyan">+${selectedKeycap.price}</span>
              </div>

              <div className="flex justify-between items-center py-1">
                <div>
                  <span className="text-slate-400 text-xs block">Chassis / Case</span>
                  <strong className="text-white font-medium">{selectedCase.name}</strong>
                </div>
                <span className="font-mono text-brand-cyan">+${selectedCase.price}</span>
              </div>

              {selectedExtras.map((extra) => (
                <div key={extra.id} className="flex justify-between items-center py-1 text-xs">
                  <div>
                    <span className="text-brand-lime text-[11px] block">Extra Add-On</span>
                    <strong className="text-slate-200 font-medium">{extra.name}</strong>
                  </div>
                  <span className="font-mono text-brand-cyan">+${extra.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 bg-brand-panel/80 border border-brand-border text-xs flex items-center gap-3">
              <Truck className="w-5 h-5 text-brand-cyan shrink-0" />
              <div>
                <p className="font-semibold text-white">Insured Global Express</p>
                <p className="text-slate-400 text-[11px]">Free delivery with tracking code</p>
              </div>
            </div>
            <div className="rounded-2xl p-4 bg-brand-panel/80 border border-brand-border text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-brand-lime shrink-0" />
              <div>
                <p className="font-semibold text-white">2-Year Studio Warranty</p>
                <p className="text-slate-400 text-[11px]">Full coverage on PCB, diodes & finish</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Checkout Form & Total Receipt (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <form
            onSubmit={handleSubmitOrder}
            className="rounded-3xl bg-brand-card/95 border border-brand-border p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-brand-border/60 mb-5">
              <div className="flex items-center space-x-2">
                <Lock className="w-4 h-4 text-brand-cyan" />
                <h3 className="font-bold text-white text-base">Express Checkout</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">256-bit Encrypted</span>
            </div>

            {/* Input Fields */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-panel border border-brand-border focus:border-brand-cyan focus:outline-none text-white text-sm"
                  placeholder="e.g. Alex Vance"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-panel border border-brand-border focus:border-brand-cyan focus:outline-none text-white text-sm"
                  placeholder="alex@example.com"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1.5 font-medium">Shipping Address</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-brand-panel border border-brand-border focus:border-brand-cyan focus:outline-none text-white text-sm"
                  placeholder="Street address"
                />
              </div>

              {/* Payment Methods */}
              <div>
                <label className="block text-slate-300 mb-2 font-medium">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', label: 'Credit Card', icon: CreditCard },
                    { id: 'apple_pay', label: 'Apple Pay', icon: CheckCircle2 },
                    { id: 'crypto', label: 'Crypto', icon: Sparkles },
                  ].map((method) => (
                    <button
                      type="button"
                      key={method.id}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          paymentMethod: method.id as 'card' | 'apple_pay' | 'crypto',
                        })
                      }
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                        formData.paymentMethod === method.id
                          ? 'bg-brand-cardHover border-brand-cyan text-white shadow-sm'
                          : 'bg-brand-panel border-brand-border text-slate-400 hover:text-white'
                      }`}
                    >
                      <method.icon className="w-4 h-4 text-brand-cyan" />
                      <span className="text-[11px] font-medium">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Receipt Cost Breakdown */}
            <div className="mt-6 pt-5 border-t border-brand-border/60 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping</span>
                <span className="font-mono text-brand-lime font-semibold">FREE ($0.00)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Custom Assembly & QA</span>
                <span className="font-mono text-brand-cyan font-semibold">INCLUDED</span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-brand-border font-bold text-base text-white">
                <span>Total Amount</span>
                <span className="text-2xl font-mono text-brand-lime font-extrabold">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Submit Order Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 rounded-2xl bg-brand-lime hover:bg-brand-limeHover text-black font-extrabold text-base flex items-center justify-center space-x-2 transition-all shadow-lime-glow transform active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <span>Place Order • ${totalPrice.toFixed(2)}</span>
                )}
              </button>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] text-slate-500 flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                30-day no questions asked money-back satisfaction guarantee
              </span>
            </div>
          </form>

          {/* Return to Editing Button */}
          <button
            onClick={onPrevious}
            className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-brand-card hover:bg-brand-cardHover border border-brand-border text-slate-300 hover:text-white transition-all text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Modify Custom Extras</span>
          </button>
        </div>
      </div>
    </div>
  );
};
