import React from 'react';
import { SwitchOption } from '../../types/builder';
import { Check, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../utils/audioSynth';

interface SwitchStepProps {
  switches: SwitchOption[];
  selectedSwitchId: string;
  onSelectSwitch: (switchId: string) => void;
  onNext: () => void;
  totalPrice: number;
  onOpenSoundModal: () => void;
}

export const SwitchStep: React.FC<SwitchStepProps> = ({
  switches,
  selectedSwitchId,
  onSelectSwitch,
  onNext,
}) => {
  const activeSwitch = switches.find((s) => s.id === selectedSwitchId) || switches[0];

  const handleSelect = (item: SwitchOption) => {
    onSelectSwitch(item.id);
    soundEngine.playSwitchSound(item.specs.soundType);
  };

  return (
    <div className="w-full">
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Choose your switches
        </h1>
        <p className="text-sm text-[#8892b0] mt-1 font-normal">
          Four selections, fit to every typing profile.
        </p>
      </div>

      {/* Main 2-Column Grid (Left: 70%, Right: 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5">
        {/* Left Column: 4 Cards + Big Image Showcase (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* 4 Cards Grid - Fits strictly above the image */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {switches.map((item) => {
              const isSelected = item.id === activeSwitch.id;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`relative cursor-pointer rounded-xl p-3.5 transition-all select-none border text-left flex flex-col justify-between min-h-[96px] ${
                    isSelected
                      ? 'bg-[#151a28] border-[#2563eb] shadow-[0_0_15px_rgba(37,99,235,0.35)]'
                      : 'bg-[#131620] border-[#1e2330] hover:border-slate-700 hover:bg-[#161a26]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {item.badge ? (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isSelected
                            ? 'bg-[#3b82f6] text-white'
                            : 'bg-[#1e2330] text-slate-400'
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <span />
                    )}

                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-[#3b82f6] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="mt-2">
                    <h3 className="font-bold text-sm text-white leading-tight">
                      {item.categoryLabel}
                    </h3>
                    <p className="text-[11px] text-[#8892b0] mt-0.5 leading-snug">
                      {item.tagline}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Large Keyboard Image Box (with exact macro photograph) */}
          <div className="relative rounded-2xl overflow-hidden bg-[#131620] border border-[#1e2330] aspect-[16/9] sm:aspect-[16/8.5] flex items-end">
            <img
              src={activeSwitch.image}
              alt={activeSwitch.name}
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Subtle Gradient Shadow at bottom for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Bottom Overlay Info matching Figma exactly */}
            <div className="relative z-10 w-full p-5 sm:p-6 flex items-end justify-between">
              <div>
                <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6] text-white font-bold uppercase tracking-wider mb-1.5">
                  {activeSwitch.badge || 'PROFILE'}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">
                  {activeSwitch.name}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5 font-normal">
                  {activeSwitch.description.split('.')[0]}.
                </p>
              </div>

              {/* Price in Electric Blue on the right */}
              <div className="shrink-0 text-right">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#38bdf8] font-mono">
                  ${activeSwitch.price}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Switch specs & Compatibility alert (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card 1: Switch specs */}
          <div className="bg-[#131620] border border-[#1e2330] rounded-2xl p-5 shadow-sm">
            {/* Specs Header with blue vertical bar */}
            <div className="flex items-center space-x-2.5 pb-3.5 mb-3.5 border-b border-[#1c202d]">
              <span className="w-1 h-4 bg-[#38bdf8] rounded-full" />
              <h3 className="font-bold text-sm text-white">Switch specs</h3>
            </div>

            {/* 4 Rows */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8892b0]">Type</span>
                <span className="font-medium text-slate-200">{activeSwitch.specs.type.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8892b0]">Force</span>
                <span className="font-medium text-slate-200">{activeSwitch.specs.force.split(' ')[0]}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8892b0]">Travel</span>
                <span className="font-medium text-slate-200">{activeSwitch.specs.travel}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#8892b0]">Sound Level</span>
                <span className="font-medium text-[#38bdf8]">
                  {activeSwitch.category === 'office'
                    ? 'Silent'
                    : activeSwitch.category === 'gaming'
                    ? 'Medium'
                    : activeSwitch.category === 'typing'
                    ? 'Clicky'
                    : 'Thock'}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Green Compatibility Box */}
          <div className="bg-[#111c14] border border-[#1e3822] rounded-2xl p-4 flex items-start space-x-3 text-xs">
            <CheckCircle2 className="w-4 h-4 text-[#84cc16] shrink-0 mt-0.5" />
            <p className="text-[#a3e635] text-[11px] leading-relaxed">
              Compatible with hot-swap PCB sockets. Pre-lubed for maximum smoothness.
            </p>
          </div>
        </div>
      </div>

      {/* Full-width Neon Lime CTA Button */}
      <div className="w-full">
        <button
          onClick={onNext}
          className="w-full py-3.5 px-6 rounded-xl bg-[#d4ff00] hover:bg-[#bce400] text-black font-extrabold text-sm sm:text-base flex items-center justify-center transition-all transform active:scale-[0.99] shadow-[0_0_20px_rgba(212,255,0,0.3)]"
        >
          Add {activeSwitch.name} & Continue to Keycaps
        </button>
      </div>
    </div>
  );
};
