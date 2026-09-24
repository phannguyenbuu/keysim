// Web Audio API Synthesizer for Mechanical Keyboard Switches

class KeyboardSoundEngine {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public playSwitchSound(type: 'silent-linear' | 'speed-linear' | 'tactile-thock' | 'clicky') {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      switch (type) {
        case 'silent-linear': {
          // Soft, dampened, low-frequency muted tap
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(40, now + 0.05);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, now);

          gain.gain.setValueAtTime(0.3, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.07);
          break;
        }

        case 'speed-linear': {
          // Snappy, crisp bottom-out
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const noise = this.createNoiseBuffer(ctx, 0.04);
          const noiseNode = ctx.createBufferSource();
          const noiseGain = ctx.createGain();

          noiseNode.buffer = noise;

          osc.type = 'sine';
          osc.frequency.setValueAtTime(320, now);
          osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);

          gain.gain.setValueAtTime(0.4, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

          noiseGain.gain.setValueAtTime(0.2, now);
          noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

          osc.connect(gain);
          gain.connect(ctx.destination);

          noiseNode.connect(noiseGain);
          noiseGain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.08);
          noiseNode.start(now);
          break;
        }

        case 'tactile-thock': {
          // Deep, resonant, hollow acoustic thock
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(180, now);
          osc1.frequency.exponentialRampToValueAtTime(55, now + 0.1);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(90, now);
          osc2.frequency.exponentialRampToValueAtTime(45, now + 0.12);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);

          gain.gain.setValueAtTime(0.5, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.13);
          osc2.stop(now + 0.13);
          break;
        }

        case 'clicky': {
          // Crisp mechanical click-bar high pitch + bottom out
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const clickOsc = ctx.createOscillator();
          const clickGain = ctx.createGain();

          clickOsc.type = 'square';
          clickOsc.frequency.setValueAtTime(2400, now);
          clickOsc.frequency.exponentialRampToValueAtTime(800, now + 0.015);

          clickGain.gain.setValueAtTime(0.35, now);
          clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.018);

          osc.type = 'sine';
          osc.frequency.setValueAtTime(220, now + 0.01);
          osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

          gain.gain.setValueAtTime(0.3, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

          clickOsc.connect(clickGain);
          clickGain.connect(ctx.destination);

          osc.connect(gain);
          gain.connect(ctx.destination);

          clickOsc.start(now);
          clickOsc.stop(now + 0.02);
          osc.start(now + 0.01);
          osc.stop(now + 0.1);
          break;
        }
      }
    } catch {
      // AudioContext might be blocked until user gesture, ignore safely
    }
  }

  private createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
}

export const soundEngine = new KeyboardSoundEngine();
