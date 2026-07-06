import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import useOrdersStore from '../store/ordersStore';
import useRidersStore from '../store/ridersStore';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { getAudioContext } from '../utils/audioContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const ALERT_INTERVAL_MS = 4000;
const ORIGINAL_TITLE = 'DFC Dashboard';
const FLASH_TITLE = '🔔 NEW ORDER!';

let socketInstance = null;

const useSocket = () => {
  const { restaurant } = useAuthStore();
  const { addOrder, updateOrderInList, removeAcknowledged, unacknowledgedIds } = useOrdersStore();
  const { updateRiderStatus } = useRidersStore();

  const audioRef = useRef(null);
  const alertIntervalRef = useRef(null);
  const titleFlashRef = useRef(null);
  const isTitleFlashingRef = useRef(false);

  // ── Audio ──────────────────────────────────────────────────────────────────
  const createAlertAudio = useCallback(() => {
    const ctx = getAudioContext();

    const scheduleBuzzes = () => {
      // Master compressor to maximise perceived loudness
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -6;
      compressor.knee.value = 0;
      compressor.ratio.value = 20;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.1;
      compressor.connect(ctx.destination);

      const masterGain = ctx.createGain();
      masterGain.gain.value = 1.5;
      masterGain.connect(compressor);

      const playBurst = (startTime, freq, duration) => {
        // Layer 1: sawtooth for harsh buzz
        const osc1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, startTime);
        osc1.connect(g1);
        g1.connect(masterGain);
        g1.gain.setValueAtTime(0, startTime);
        g1.gain.linearRampToValueAtTime(0.6, startTime + 0.01);
        g1.gain.setValueAtTime(0.6, startTime + duration - 0.01);
        g1.gain.linearRampToValueAtTime(0, startTime + duration);
        osc1.start(startTime);
        osc1.stop(startTime + duration);

        // Layer 2: square at sub-octave for body/depth
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(freq / 2, startTime);
        osc2.connect(g2);
        g2.connect(masterGain);
        g2.gain.setValueAtTime(0, startTime);
        g2.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
        g2.gain.setValueAtTime(0.4, startTime + duration - 0.01);
        g2.gain.linearRampToValueAtTime(0, startTime + duration);
        osc2.start(startTime);
        osc2.stop(startTime + duration);
      };

      // 4 rapid high-pitched alarm bursts: BEEP-BEEP-BEEP-BEEP
      const now = ctx.currentTime;
      const burstDuration = 0.18;
      const gap = 0.24; // burst + silence gap
      playBurst(now + gap * 0, 1040, burstDuration);
      playBurst(now + gap * 1, 1040, burstDuration);
      playBurst(now + gap * 2, 1040, burstDuration);
      playBurst(now + gap * 3, 1040, burstDuration);
    };

    // CRITICAL: resume() is async — schedule audio only AFTER context is running.
    // Previously audio was scheduled before resume completed → silent first buzz.
    if (ctx.state === 'running') {
      scheduleBuzzes();
    } else {
      ctx.resume().then(scheduleBuzzes);
    }
  }, []);


  // ── Tab title flash ────────────────────────────────────────────────────────
  const startTitleFlash = useCallback(() => {
    if (isTitleFlashingRef.current) return;
    isTitleFlashingRef.current = true;
    let toggled = false;
    titleFlashRef.current = setInterval(() => {
      document.title = toggled ? ORIGINAL_TITLE : FLASH_TITLE;
      toggled = !toggled;
    }, 800);
  }, []);

  const stopTitleFlash = useCallback(() => {
    if (titleFlashRef.current) {
      clearInterval(titleFlashRef.current);
      titleFlashRef.current = null;
    }
    isTitleFlashingRef.current = false;
    document.title = ORIGINAL_TITLE;
  }, []);

  // ── Alert loop ─────────────────────────────────────────────────────────────
  const startAlertLoop = useCallback(() => {
    createAlertAudio();
    startTitleFlash();

    // Request browser notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    if (alertIntervalRef.current) return; // already running
    alertIntervalRef.current = setInterval(() => {
      const { unacknowledgedIds: ids } = useOrdersStore.getState();
      if (ids.size === 0) {
        stopAlertLoop();
        return;
      }
      createAlertAudio();
    }, ALERT_INTERVAL_MS);
  }, [createAlertAudio, startTitleFlash]);

  const stopAlertLoop = useCallback(() => {
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current);
      alertIntervalRef.current = null;
    }
    stopTitleFlash();
  }, [stopTitleFlash]);

  // ── Watch unacknowledged count ─────────────────────────────────────────────
  useEffect(() => {
    if (unacknowledgedIds.size > 0) {
      startAlertLoop();
    } else {
      stopAlertLoop();
    }
  }, [unacknowledgedIds.size]);

  // ── Socket connection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurant?._id) return;

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
        transports: ['websocket', 'polling'],
      });
    }

    const socket = socketInstance;

    socket.on('connect', () => {
      console.log('✅ Dashboard socket connected');
      socket.emit('join-restaurant', restaurant._id);
    });

    socket.on('new-order', (order) => {
      addOrder(order);

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🍽️ New Order!', {
          body: `${order.customer.name} — ₹${order.total} — ${order.orderId}`,
          icon: '/favicon.png',
          requireInteraction: true,
        });
      }

      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-slide-in' : 'opacity-0'} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3`}
          style={{ background: 'linear-gradient(135deg, #e2131c, #f7780e)' }}>
          <span className="text-2xl">🔔</span>
          <div>
            <p className="font-bold">New Order!</p>
            <p className="text-sm opacity-90">{order.customer.name} · ₹{order.total}</p>
          </div>
        </div>
      ), { duration: 8000 });
    });

    socket.on('order-status-update', ({ orderId, status, order }) => {
      updateOrderInList(orderId, status, order);
    });

    socket.on('order-acknowledged', ({ orderId }) => {
      removeAcknowledged(orderId);
    });

    // Real-time rider availability badge updates
    socket.on('rider-status-update', ({ riderId, status, activeOrder }) => {
      updateRiderStatus(riderId, status, activeOrder);
    });

    socket.on('disconnect', () => {
      console.warn('Dashboard socket disconnected');
    });

    return () => {
      socket.off('new-order');
      socket.off('order-status-update');
      socket.off('order-acknowledged');
      socket.off('rider-status-update');
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [restaurant?._id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlertLoop();
    };
  }, []);

  return { socket: socketInstance };
};

export default useSocket;
