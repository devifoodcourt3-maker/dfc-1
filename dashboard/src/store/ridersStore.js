import { create } from 'zustand';
import api from '../services/api';

const useRidersStore = create((set, get) => ({
  riders: [],
  isLoading: false,

  fetchRiders: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/dashboard/riders');
      set({ riders: res.data.data.riders, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Add a newly created rider to the top of the list
  addRider: (rider) =>
    set((state) => ({
      riders: [{ ...rider, activeOrders: 0, activeOrder: null }, ...state.riders],
    })),

  // Patch any field(s) on a specific rider (toggle active, etc.)
  updateRider: (id, patch) =>
    set((state) => ({
      riders: state.riders.map((r) => (r._id === id ? { ...r, ...patch } : r)),
    })),

  // Remove a rider from the list
  removeRider: (id) =>
    set((state) => ({
      riders: state.riders.filter((r) => r._id !== id),
    })),

  /**
   * Called by the `rider-status-update` socket event.
   * status: 'available' | 'on_delivery' | 'offline'
   * activeOrder: { orderId, assignedAt, status } | null
   */
  updateRiderStatus: (riderId, status, activeOrder) =>
    set((state) => ({
      riders: state.riders.map((r) => {
        if (r._id !== riderId) return r;
        return {
          ...r,
          riderStatus: status,
          activeOrders: status === 'on_delivery' ? Math.max(r.activeOrders || 0, 1) : 0,
          activeOrder: status === 'on_delivery' ? (activeOrder || r.activeOrder) : null,
        };
      }),
    })),
}));

export default useRidersStore;
