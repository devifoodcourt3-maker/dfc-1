/**
 * Customer-side audio alert utility.
 *
 * Browsers block audio until the user interacts with the page.
 * The customer has always interacted (browsed the menu, placed the order)
 * before a cancellation can arrive, so the context will already be running.
 *
 * Call `playCancelAlert()` whenever the restaurant cancels the order.
 */

let audioCtx = null;

const getCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

/** Play a short urgent alert tone to notify the customer of a cancellation. */
const playTone = (ctx, frequency, startTime, duration) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startTime);

  gain.gain.setValueAtTime(0.001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.35, startTime + 0.04);
  gain.gain.setValueAtTime(0.35, startTime + duration - 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

/**
 * Plays a two-tone "uh-oh" descending alert — clearly signals something wrong.
 * Schedules audio after resume() resolves so it works even if context is suspended.
 */
export const playCancelAlert = () => {
  const ctx = getCtx();

  const schedule = () => {
    const t = ctx.currentTime;
    // High note → lower note = "uh-oh" descending pattern
    playTone(ctx, 880, t,        0.18); // A5
    playTone(ctx, 660, t + 0.22, 0.18); // E5
    playTone(ctx, 440, t + 0.44, 0.30); // A4 (held slightly longer)
  };

  if (ctx.state === 'running') {
    schedule();
  } else {
    ctx.resume().then(schedule);
  }
};
