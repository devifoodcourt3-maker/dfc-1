/**
 * Shared Web Audio API context.
 *
 * Browsers block audio until at least ONE user gesture occurs.
 * Call `unlockAudio()` inside any click handler to satisfy the policy.
 * It returns a Promise that resolves when the context is fully running.
 */

let sharedAudioCtx = null;

export const getAudioContext = () => {
  if (!sharedAudioCtx) {
    sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return sharedAudioCtx;
};

/**
 * Call once on any user gesture to satisfy the browser autoplay policy.
 * Returns a Promise — resolves when the AudioContext is fully running.
 */
export const unlockAudio = () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    return ctx.resume();
  }
  return Promise.resolve();
};

/**
 * Plays a short, deep alarm buzz to confirm sound is enabled.
 */
export const playUnlockChirp = () => {
  const ctx = getAudioContext();
  if (ctx.state !== 'running') return;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(100, ctx.currentTime);
  
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(102, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  
  osc1.start(ctx.currentTime);
  osc1.stop(ctx.currentTime + 0.25);
  osc2.start(ctx.currentTime);
  osc2.stop(ctx.currentTime + 0.25);
};
