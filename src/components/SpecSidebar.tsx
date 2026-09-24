import React from 'react';
import { SwitchOption } from '../types/builder';
import { Volume2, CheckCircle, ShieldCheck } from 'lucide-react';
import { soundEngine } from '../utils/audioSynth';

interface SpecSidebarProps {
  activeSwitch: SwitchOption;
  onOpenSoundModal: () => void;
}

export const SpecSidebar: React.FC<SpecSidebarProps> = ({ activeSwitch, onOpenSoundModal }) => {
  const handlePlaySound = () => {
    soundEngine.playSwitchSound(activeSwitch.specs.soundType);
  };

  return (
    <aside className="w-full lg:w-80 flex flex-col gap-4">
      {/* Specs Card */}
      <div className="bg-brand-card/90 border border-brand-border/90 rounded-2xl p-5 shadow-card backdrop-blur-md">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-brand-border/60">
          <div className="flex items-center space-x-2.5">
            <span className="w-1 h-5 bg-brand-cyan rounded-full" />
            <h3 className="font-semibold text-slate-100 text-sm tracking-wide">Switch specs</h3>
          </div>
          <span className="text-[11px] font-mono text-brand-cyan bg-brand-cyan/10 px-2 py-0.5 rounded-full border border-brand-cyan/20">
            MX Footprint
          </span>
        </div>

        {/* Spec Rows */}
        <div className="space-y-3.5 text-xs">
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Type</span>
            <span className="font-medium text-slate-200 font-mono text-right">{activeSwitch.specs.type}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Actuation Force</span>
            <span className="font-medium text-slate-200 font-mono text-right">{activeSwitch.specs.force}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Total Travel</span>
            <span className="font-medium text-slate-200 font-mono text-right">{activeSwitch.specs.travel}</span>
          </div>

          <div className="flex justify-between items-center py-1">
            <span className="text-slate-400">Sound Profile</span>
            <span className="font-medium text-brand-cyan font-mono text-right flex items-center gap-1.5">
              {activeSwitch.specs.soundLevel}
            </span>
          </div>
        </div>

        {/* Listen Sample Button */}
        <div className="mt-5 pt-4 border-t border-brand-border/60 flex gap-2">
          <button
            onClick={handlePlaySound}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-brand-border/50 hover:bg-brand-border text-slate-200 hover:text-white transition-all text-xs font-medium border border-white/5 active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Test Sound</span>
          </button>
          <button
            onClick={onOpenSoundModal}
            className="py-2.5 px-3 rounded-xl bg-brand-card hover:bg-brand-cardHover border border-brand-border text-slate-400 hover:text-white transition-all text-xs"
            title="Open Full Sound Studio"
          >
            Studio
          </button>
        </div>
      </div>

      {/* Compatibility Notice (styled matching the Figma dark-olive notice box) */}
      <div className="bg-[#121c12]/90 border border-brand-lime/30 rounded-2xl p-4 shadow-card text-xs">
        <div className="flex items-start space-x-2.5">
          <CheckCircle className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-brand-lime font-medium">Hot-Swap Socket Compatible</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Standard 5-pin footprint fits all Gateron, Kailh, Cherry, and Outemu PCB sockets. Zero soldering required.
            </p>
          </div>
        </div>
      </div>

      {/* Quality Badge */}
      <div className="bg-brand-panel/60 border border-brand-border/50 rounded-2xl p-3.5 text-xs flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
        <p className="text-slate-400 text-[11px] leading-tight">
          Factory pre-lubricated with high-grade Krytox grease for silky smooth keystrokes right out of the box.
        </p>
      </div>
    </aside>
  );
};
