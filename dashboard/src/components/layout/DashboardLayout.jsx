import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import useSocket from '../../hooks/useSocket';
import useOrdersStore from '../../store/ordersStore';
import { unlockAudio } from '../../utils/audioContext';
import { Bell } from 'lucide-react';

const DashboardLayout = () => {
  useSocket(); // Initialize socket + notifications
  const { unacknowledgedIds } = useOrdersStore();
  const [socketConnected, setSocketConnected] = useState(true);

  // Unlock AudioContext on the very first interaction inside the dashboard.
  // This covers the page-refresh case where the login page is skipped.
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
    window.addEventListener('click', unlock, true);
    window.addEventListener('keydown', unlock, true);
    return () => {
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };
  }, []);

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 ml-64 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-ink-900/[0.06] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Live</span>
          </div>

          <div className="flex items-center gap-4">
            {unacknowledgedIds.size > 0 && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full animate-pulse-fast">
                <Bell size={13} />
                <span>{unacknowledgedIds.size} pending alert{unacknowledgedIds.size > 1 ? 's' : ''}</span>
              </div>
            )}
            <span className="text-xs text-ink-400">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

