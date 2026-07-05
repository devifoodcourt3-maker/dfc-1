import { Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import useSocket from '../../hooks/useSocket';
import useOrdersStore from '../../store/ordersStore';
import { unlockAudio, getAudioContext } from '../../utils/audioContext';
import { Bell, VolumeX } from 'lucide-react';

const DashboardLayout = () => {
  useSocket(); // Initialize socket + notifications
  const { unacknowledgedIds } = useOrdersStore();
  const [socketConnected, setSocketConnected] = useState(true);
  const [audioSuspended, setAudioSuspended] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [browserTab, setBrowserTab] = useState('chrome');

  // Unlock AudioContext on the very first interaction inside the dashboard.
  // This covers the page-refresh case where the login page is skipped.
  useEffect(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      setAudioSuspended(true);
    }

    const unlock = () => {
      unlockAudio().then(() => {
        if (ctx.state === 'running') {
          setAudioSuspended(false);
        }
      });
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock, true);
    };

    window.addEventListener('click', unlock, true);
    window.addEventListener('keydown', unlock, true);

    const stateHandler = () => {
      if (ctx.state === 'running') {
        setAudioSuspended(false);
      }
    };
    ctx.addEventListener('statechange', stateHandler);

    return () => {
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      ctx.removeEventListener('statechange', stateHandler);
    };
  }, []);

  const handleManualUnlock = () => {
    unlockAudio().then(() => {
      const ctx = getAudioContext();
      if (ctx.state === 'running') {
        setAudioSuspended(false);
      }
    });
  };

  return (
    <div className="flex h-screen bg-cream-50 overflow-hidden">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 ml-64 flex flex-col overflow-hidden">
        {audioSuspended && (
          <div className="fixed bottom-6 right-6 z-[1500] max-w-sm animate-slide-up">
            <div 
              onClick={handleManualUnlock}
              className="bg-white border border-amber-200 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl relative cursor-pointer border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-300"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 animate-pulse">
                    <VolumeX size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Sound Alerts Blocked</h4>
                    <p className="text-[10px] text-slate-400">Browser security restriction</p>
                  </div>
                </div>
                {/* Visual close cross */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setAudioSuspended(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <p className="text-xs text-slate-600 leading-relaxed">
                To hear new order alarm ringtones, click below to unmute or configure your browser settings.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={handleManualUnlock}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold py-2 px-3 rounded-xl shadow-md active:scale-95 transition-all hover:brightness-105 cursor-pointer text-center"
                >
                  🔊 Enable Sound
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowGuide(true);
                  }}
                  className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl transition-all cursor-pointer text-center"
                >
                  ⚙️ Auto-Ring Setup
                </button>
              </div>
            </div>
          </div>
        )}

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

      {/* Autoplay guide modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden text-slate-800 p-6 flex flex-col gap-4 shadow-2xl relative border border-slate-100">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <span>🔊</span> Enable Automatic Order Alarm
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Browsers block sound alerts on fresh page loads until you click the screen. To make the new order buzzer ring automatically without any user interaction, grant site sound permission:
            </p>

            {/* Browser selector tabs */}
            <div className="flex border-b border-slate-100 text-xs">
              <button
                onClick={() => setBrowserTab('chrome')}
                className={`flex-1 pb-2 font-semibold border-b-2 text-center transition-colors ${
                  browserTab === 'chrome'
                    ? 'border-orange-500 text-orange-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Chrome / Edge
              </button>
              <button
                onClick={() => setBrowserTab('firefox')}
                className={`flex-1 pb-2 font-semibold border-b-2 text-center transition-colors ${
                  browserTab === 'firefox'
                    ? 'border-orange-500 text-orange-600 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Firefox
              </button>
            </div>

            {/* Instruction Steps */}
            <div className="text-xs space-y-3 py-1">
              {browserTab === 'chrome' ? (
                <>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <p className="text-slate-700">Click the <strong>sliders/settings icon</strong> or 🔒 on the far left of the browser address bar.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <p className="text-slate-700">Click <strong>Site settings</strong> or <strong>Permissions</strong>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <p className="text-slate-700">Scroll to <strong>Sound</strong> and change it from <em>Automatic (default)</em> to <strong>Allow</strong>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">4</span>
                    <p className="text-slate-700">Refresh the page to apply the setting.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">1</span>
                    <p className="text-slate-700">Click the <strong>block autoplay icon</strong> (looks like a play button with a slash) on the left of the address bar.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">2</span>
                    <p className="text-slate-700">Under permissions, change it to <strong>Allow Audio and Video</strong>.</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">3</span>
                    <p className="text-slate-700">Refresh the page to apply the setting.</p>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowGuide(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;

