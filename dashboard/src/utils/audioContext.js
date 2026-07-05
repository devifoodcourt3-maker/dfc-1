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
