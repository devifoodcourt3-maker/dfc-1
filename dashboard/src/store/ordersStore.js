import { create } from 'zustand';
import api from '../services/api';

const useOrdersStore = create((set, get) => ({
  orders: [],
  isLoading: false,
  filter: 'all',
  unacknowledgedIds: new Set(), // drives the alert loop

  setFilter: (filter) => set({ filter }),

  fetchOrders: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await api.get('/dashboard/orders', { params });
      set({ orders: res.data.data.orders, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  // Called by socket 'new-order' event
  addOrder: (order) => {
    set((state) => ({
      orders: [order, ...state.orders],
      unacknowledgedIds: new Set([...state.unacknowledgedIds, order._id]),
    }));
  },

  // Called by socket 'order-status-update'
  updateOrderInList: (orderId, status, updatedOrder) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.orderId === orderId ? { ...o, ...updatedOrder, status } : o
      ),
    }));
  },

  // Called by socket 'kot-print-status' (printing/printed/failed on the local print agent)
  updatePrintStatus: (orderId, kot) => {
    set((state) => ({
      orders: state.orders.map((o) => (o.orderId === orderId ? { ...o, kot } : o)),
    }));
  },

  // Admin-triggered reprint after a failed KOT (printer offline, out of paper, etc.)
  retryPrint: async (id) => {
    try {
      const res = await api.post(`/dashboard/orders/${id}/print/retry`);
      const kot = res.data.data.kot;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? { ...o, kot } : o)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  // Called when confirm/cancel clicked
  updateStatus: async (id, status) => {
    try {
      const res = await api.patch(`/dashboard/orders/${id}/status`, { status });
      const updated = res.data.data.order;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? updated : o)),
        // Remove from unacknowledged if confirmed or cancelled
        unacknowledgedIds:
          ['confirmed', 'cancelled'].includes(status)
            ? new Set([...state.unacknowledgedIds].filter((uid) => uid !== id))
            : state.unacknowledgedIds,
      }));
      return { success: true, order: updated };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  acknowledgeOrder: (id) => {
    api.patch(`/dashboard/orders/${id}/acknowledge`).catch(() => {});
    set((state) => ({
      unacknowledgedIds: new Set([...state.unacknowledgedIds].filter((uid) => uid !== id)),
    }));
  },

  // Assign a delivery boy to a ready order
  assignRider: async (id, riderId) => {
    try {
      const res = await api.patch(`/dashboard/orders/${id}/assign`, { riderId });
      const updated = res.data.data.order;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? updated : o)),
      }));
      return { success: true, order: updated, message: res.data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  unassignRider: async (id) => {
    try {
      const res = await api.patch(`/dashboard/orders/${id}/unassign`);
      const updated = res.data.data.order;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? updated : o)),
      }));
      return { success: true, order: updated };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  // Socket 'order-acknowledged' from another dashboard tab
  removeAcknowledged: (id) => {
    set((state) => ({
      unacknowledgedIds: new Set([...state.unacknowledgedIds].filter((uid) => uid !== id)),
    }));
  },

  clearOrders: async (params = {}) => {
    try {
      const res = await api.delete('/dashboard/orders/clear', { params });
      const deletedCount = res.data.data.deletedCount;
      set((state) => ({
        orders: state.orders.filter((o) => {
          if (params.status && params.status !== 'all' && o.status !== params.status) return true;
          if (params.date) {
            const orderDate = new Date(o.createdAt).toDateString();
            const filterDate = new Date(params.date).toDateString();
            if (orderDate !== filterDate) return true;
          }
          return false;
        }),
      }));
      return { success: true, deletedCount };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  filteredOrders: () => {
    const { orders, filter } = get();
    if (filter === 'all') return orders;
    return orders.filter((o) => o.status === filter);
  },
}));

export default useOrdersStore;
