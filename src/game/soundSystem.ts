// Simple Web Audio API sound system - no external files needed
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playCoinSound() {
  playTone(880, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(1320, 0.15, 'sine', 0.1), 60);
}

export function playHitSound() {
  playTone(200, 0.15, 'sawtooth', 0.1);
  setTimeout(() => playTone(150, 0.1, 'square', 0.08), 50);
}

export function playPlayerHitSound() {
  playTone(300, 0.12, 'square', 0.1);
  setTimeout(() => playTone(200, 0.15, 'sawtooth', 0.08), 80);
}

export function playVictorySound() {
  [0, 100, 200, 300].forEach((delay, i) => {
    setTimeout(() => playTone(440 + i * 110, 0.2, 'sine', 0.1), delay);
  });
}

export function playDefeatSound() {
  playTone(300, 0.3, 'sawtooth', 0.1);
  setTimeout(() => playTone(200, 0.4, 'sawtooth', 0.08), 200);
}

export function playPortalSound() {
  playTone(400, 0.3, 'sine', 0.08);
  setTimeout(() => playTone(600, 0.3, 'sine', 0.08), 150);
  setTimeout(() => playTone(800, 0.3, 'sine', 0.06), 300);
}

export function playHealSound() {
  playTone(660, 0.15, 'sine', 0.1);
  setTimeout(() => playTone(880, 0.2, 'sine', 0.08), 100);
}

export function playBuySound() {
  playTone(523, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(659, 0.1, 'sine', 0.08), 80);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.06), 160);
}

export function playUseItemSound() {
  playTone(700, 0.12, 'triangle', 0.1);
  setTimeout(() => playTone(900, 0.15, 'triangle', 0.08), 80);
}

export function playCombatStartSound() {
  playTone(220, 0.15, 'square', 0.1);
  setTimeout(() => playTone(330, 0.1, 'square', 0.1), 100);
  setTimeout(() => playTone(440, 0.15, 'square', 0.08), 200);
}

export function playBowPickupSound() {
  [0, 80, 160, 240, 320].forEach((delay, i) => {
    setTimeout(() => playTone(500 + i * 100, 0.2, 'sine', 0.1), delay);
  });
}
