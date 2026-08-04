import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { RefreshCw, Filter, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useOrdersStore from '../store/ordersStore';
import OrderCard from '../components/orders/OrderCard';

const FILTERS = [
  { value: 'all',       label: 'All Orders' },
  { value: 'pending',   label: 'Pending',   color: 'text-amber-700' },
  { value: 'confirmed', label: 'Confirmed', color: 'text-blue-700' },
  { value: 'preparing', label: 'Preparing', color: 'text-purple-700' },
  { value: 'ready',     label: 'Ready',     color: 'text-green-700' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'text-brand-700' },
  { value: 'delivered', label: 'Delivered', color: 'text-ink-600' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-700' },
];

const OrdersPage = () => {
  const { orders, isLoading, filter, setFilter, fetchOrders, filteredOrders, unacknowledgedIds, clearOrders } = useOrdersStore();
  const [date, setDate] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = () => fetchOrders({ date, status: filter !== 'all' ? filter : undefined });

  const handleClear = async () => {
    const status = filter !== 'all' ? filter : undefined;
    const scopeLabel = [
      status ? FILTERS.find((f) => f.value === status)?.label : 'All orders',
      date ? `on ${date}` : null,
    ].filter(Boolean).join(' · ');

    if (!confirm(`Permanently delete ${scopeLabel}? This cannot be undone.`)) return;

    setIsClearing(true);
    const result = await clearOrders({ date, status });
    setIsClearing(false);

    if (result.success) {
      toast.success(`Cleared ${result.deletedCount} order${result.deletedCount === 1 ? '' : 's'}`);
    } else {
      toast.error(result.message || 'Failed to clear orders');
    }
  };

  const displayed = filteredOrders();

  const counts = {};
  orders.forEach((o) => {
    counts[o.status] = (counts[o.status] || 0) + 1;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Orders</h1>
          <p className="text-ink-500 text-sm mt-1">
            {orders.length} total · {unacknowledgedIds.size > 0 && (
              <span className="text-brand-600 font-semibold">{unacknowledgedIds.size} need attention</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input w-40 text-sm"
          />
          <button onClick={handleRefresh} disabled={isLoading}
            className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={handleClear} disabled={isClearing || orders.length === 0}
            className="btn-secondary flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50">
            <Trash2 size={15} />
            Clear Orders
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-white border border-ink-900/[0.07] rounded-xl p-1 overflow-x-auto shadow-soft">
        {FILTERS.map(({ value, label, color }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 flex items-center gap-2
              ${filter === value
                ? 'bg-cream-100 text-ink-900 shadow-sm'
                : 'text-ink-500 hover:text-ink-900 hover:bg-cream-100'
              }`}
          >
            <span className={filter === value && color ? color : ''}>{label}</span>
            {value !== 'all' && counts[value] > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-ink-100 ${color || 'text-ink-700'}`}>
                {counts[value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 h-48 animate-pulse">
              <div className="h-4 bg-cream-100 rounded w-1/2 mb-3" />
              <div className="h-3 bg-cream-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-cream-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-6xl mb-4">🍽️</p>
          <p className="text-ink-700 font-medium">No orders found</p>
          <p className="text-ink-400 text-sm mt-1">
            {filter !== 'all' ? `No ${filter} orders right now` : 'Orders will appear here in real-time'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {displayed.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                isNew={unacknowledgedIds.has(order._id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
