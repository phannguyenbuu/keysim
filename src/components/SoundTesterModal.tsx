import React, { useState, useEffect } from 'react';
import { SwitchOption } from '../types/builder';
import { soundEngine } from '../utils/audioSynth';
import { X, Volume2, Sparkles, Music } from 'lucide-react';

interface SoundTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  switches: SwitchOption[];
  activeSwitchId: string;
  onSelectSwitch: (id: string) => void;
}

const DEMO_KEYS = ['Q', 'W', 'E', 'R', 'T', 'Y', 'SPACE', 'ENTER'];

export const SoundTesterModal: React.FC<SoundTesterModalProps> = ({
  isOpen,
  onClose,
  switches,
  activeSwitchId,
  onSelectSwitch,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeSwitch = switches.find((s) => s.id === activeSwitchId) || switches[0];

  const triggerKey = (key: string) => {
    setActiveKey(key);
    soundEngine.playSwitchSound(activeSwitch.specs.soundType);
    setTimeout(() => {
      setActiveKey((prev) => (prev === key ? null : prev));
    }, 120);
  };

  // Listen to real physical keyboard presses when modal is open!
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const keyName = e.key.toUpperCase() === ' ' ? 'SPACE' : e.key.toUpperCase();
      triggerKey(keyName);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeSwitch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-3xl bg-brand-card border border-brand-border p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-brand-border/40 hover:bg-brand-border text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center text-brand-cyan">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Switch Sound Testing Studio
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-lime/20 text-brand-lime font-bold">
                LIVE AUDIO
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Type on your physical keyboard or click virtual keys below to audition acoustics.
            </p>
          </div>
        </div>

        {/* Switch Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          {switches.map((item) => {
            const isSelected = item.id === activeSwitch.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSwitch(item.id);
                  soundEngine.playSwitchSound(item.specs.soundType);
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-brand-cardHover border-brand-cyan shadow-blue-glow ring-1 ring-brand-cyan/60'
                    : 'bg-brand-panel border-brand-border text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="text-[10px] font-mono block text-brand-cyan uppercase">
                  {item.categoryLabel}
                </span>
                <strong className="text-xs font-bold text-white block truncate">
                  {item.name}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {item.specs.soundLevel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Switch Acoustic Profile Banner */}
        <div className="p-4 rounded-2xl bg-brand-panel border border-brand-border/60 mb-6 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-lime" />
              Auditioning: {activeSwitch.name}
            </span>
            <p className="text-[11px] text-slate-400">
              {activeSwitch.specs.type} • {activeSwitch.specs.force} actuation • {activeSwitch.specs.soundLevel}
            </p>
          </div>

          <button
            onClick={() => soundEngine.playSwitchSound(activeSwitch.specs.soundType)}
            className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-brand-lime hover:bg-brand-limeHover text-black text-xs font-bold shadow-sm transition-all"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Play Tone</span>
          </button>
        </div>

        {/* Virtual Interactive Keyboard Deck */}
        <div className="bg-black/50 border border-brand-border/80 rounded-2xl p-5 text-center">
          <p className="text-[11px] font-mono text-slate-400 mb-3 uppercase tracking-wider">
            Interactive Keys (Press on Keyboard or Click)
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {DEMO_KEYS.map((key) => {
              const isPressed = activeKey === key;
              return (
                <button
                  key={key}
                  onClick={() => triggerKey(key)}
                  className={`font-mono font-bold rounded-xl transition-all select-none ${
                    key === 'SPACE'
                      ? 'px-8 py-3.5 text-xs'
                      : key === 'ENTER'
                      ? 'px-5 py-3.5 text-xs'
                      : 'w-12 h-12 text-sm'
                  } ${
                    isPressed
                      ? 'bg-brand-cyan text-black scale-95 shadow-blue-glow translate-y-1'
                      : 'bg-[#1e2333] hover:bg-[#282f45] border border-white/10 text-slate-200 shadow-md'
                  }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Done CTA */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-brand-border hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
