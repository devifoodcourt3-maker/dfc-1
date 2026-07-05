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
 * Plays a pleasant A5 chime/ding to confirm sound is enabled.
 */
export const playUnlockChirp = () => {
  const ctx = getAudioContext();
  if (ctx.state !== 'running') return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
  
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
};
