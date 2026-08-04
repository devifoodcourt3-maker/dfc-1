import { useState, useEffect } from 'react';
import { Save, Plus, X, ToggleLeft, ToggleRight, Store, Printer, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const SettingsPage = () => {
  const { restaurant, updateRestaurant } = useAuthStore();
  const [tab, setTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({ name: '', phone: '', email: '', address: '', tagline: '' });
  const [settings, setSettings] = useState(null);
  const [newArea, setNewArea] = useState('');
  const [printAgent, setPrintAgent] = useState(null); // { restaurantId, printAgentKey }
  const [showKey, setShowKey] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/dashboard/settings');
        const { restaurant: r, settings: s } = res.data.data;
        setProfile({ name: r.name, phone: r.phone || '', email: r.email || '', address: r.address || '', tagline: r.tagline || '' });
        setSettings(s);
      } catch { toast.error('Failed to load settings'); }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await api.put('/dashboard/restaurant', profile);
      updateRestaurant(res.data.data.restaurant);
      toast.success('Profile saved');
    } catch { toast.error('Save failed'); }
    finally { setIsSaving(false); }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      await api.put('/dashboard/settings', settings);
      toast.success('Settings saved');
    } catch { toast.error('Save failed'); }
    finally { setIsSaving(false); }
  };

  const loadPrintAgentKey = async () => {
    setIsLoadingKey(true);
    try {
      const res = await api.get('/dashboard/print/agent-key');
      setPrintAgent(res.data.data);
    } catch { toast.error('Failed to load print agent key'); }
    finally { setIsLoadingKey(false); }
  };

  const regeneratePrintAgentKey = async () => {
    if (!confirm('Regenerating invalidates the current key — the print agent will stop working until its .env is updated with the new key. Continue?')) return;
    setIsRegeneratingKey(true);
    try {
      const res = await api.post('/dashboard/print/agent-key/regenerate');
      setPrintAgent(res.data.data);
      setShowKey(true);
      toast.success('Print agent key regenerated');
    } catch { toast.error('Failed to regenerate key'); }
    finally { setIsRegeneratingKey(false); }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleOpen = async () => {
    try {
      const res = await api.patch('/dashboard/settings/toggle-open');
      setSettings((s) => ({ ...s, isOpen: res.data.data.isOpen }));
      toast.success(res.data.message);
    } catch { toast.error('Toggle failed'); }
  };

  const addArea = () => {
    if (!newArea.trim()) return;
    setSettings((s) => ({ ...s, deliveryAreas: [...(s.deliveryAreas || []), { name: newArea.trim(), extraCharge: 0, isActive: true }] }));
    setNewArea('');
  };

  const removeArea = (i) => {
    setSettings((s) => ({ ...s, deliveryAreas: s.deliveryAreas.filter((_, idx) => idx !== i) }));
  };

  const toggleArea = (i) => {
    setSettings((s) => ({
      ...s,
      deliveryAreas: s.deliveryAreas.map((a, idx) => idx === i ? { ...a, isActive: !a.isActive } : a),
    }));
  };

  const updateAreaCharge = (i, value) => {
    setSettings((s) => ({
      ...s,
      deliveryAreas: s.deliveryAreas.map((a, idx) => idx === i ? { ...a, extraCharge: value } : a),
    }));
  };

  const updateHours = (day, field, value) => {
    setSettings((s) => ({
      ...s,
      openingHours: s.openingHours.map((h) => h.day === day ? { ...h, [field]: value } : h),
    }));
  };

  useEffect(() => {
    if (tab === 'printer' && !printAgent) loadPrintAgentKey();
  }, [tab]);

  if (isLoading) return <div className="p-6 text-ink-500">Loading settings...</div>;

  const TABS = [
    { id: 'general',  label: 'General' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'hours',    label: 'Opening Hours' },
    { id: 'areas',    label: 'Delivery Areas' },
    { id: 'printer',  label: 'Print Agent' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Settings</h1>
          <p className="text-ink-500 text-sm mt-1">Manage restaurant configuration</p>
        </div>

        {/* Open/Closed toggle */}
        <button onClick={toggleOpen}
          className={`flex items-center gap-3 px-5 py-2.5 rounded-xl border font-semibold transition-all ${
            settings?.isOpen
              ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
          }`}>
          <Store size={17} />
          {settings?.isOpen ? 'OPEN — Click to close' : 'CLOSED — Click to open'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-ink-900/[0.07] rounded-xl p-1 w-fit shadow-soft">
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
              ${tab === id ? 'bg-cream-100 text-ink-900' : 'text-ink-500 hover:text-ink-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === 'general' && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <h3 className="font-semibold text-ink-900">Restaurant Profile</h3>
          {[
            { key: 'name', label: 'Restaurant Name', placeholder: 'DFC Restaurant' },
            { key: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210' },
            { key: 'email', label: 'Email', placeholder: 'hello@restaurant.com' },
            { key: 'tagline', label: 'Tagline', placeholder: 'Authentic flavours, delivered with love' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                placeholder={placeholder} className="input" />
            </div>
          ))}
          <div>
            <label className="label">Address</label>
            <textarea value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="input resize-none" rows={2} placeholder="Full restaurant address" />
          </div>
          <button onClick={saveProfile} disabled={isSaving} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      )}

      {/* Delivery */}
      {tab === 'delivery' && settings && (
        <div className="card p-6 space-y-5 max-w-2xl">
          <h3 className="font-semibold text-ink-900">Delivery Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Delivery Charge (₹)</label>
              <input type="number" value={settings.deliveryCharge}
                onChange={(e) => setSettings({ ...settings, deliveryCharge: e.target.value })}
                className="input" min="0" />
            </div>
            <div>
              <label className="label">Free Delivery Above (₹) <span className="text-ink-400 text-xs">0 = disabled</span></label>
              <input type="number" value={settings.freeDeliveryAbove}
                onChange={(e) => setSettings({ ...settings, freeDeliveryAbove: e.target.value })}
                className="input" min="0" />
            </div>
            <div>
              <label className="label">Minimum Order Value (₹)</label>
              <input type="number" value={settings.minOrderValue}
                onChange={(e) => setSettings({ ...settings, minOrderValue: e.target.value })}
                className="input" min="0" />
            </div>
            <div>
              <label className="label">Estimated Delivery Time (mins)</label>
              <input type="number" value={settings.estimatedDeliveryMins}
                onChange={(e) => setSettings({ ...settings, estimatedDeliveryMins: e.target.value })}
                className="input" min="5" />
            </div>
          </div>
          <button onClick={saveSettings} disabled={isSaving} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Delivery Settings'}
          </button>
        </div>
      )}

      {/* Hours */}
      {tab === 'hours' && settings && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <h3 className="font-semibold text-ink-900">Opening Hours</h3>
          <div className="space-y-3">
            {(settings.openingHours || []).map((h) => (
              <div key={h.day} className="flex items-center gap-4">
                <span className="w-24 text-sm font-medium text-ink-700 capitalize">{h.day}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={h.isClosed}
                    onChange={(e) => updateHours(h.day, 'isClosed', e.target.checked)}
                    className="w-4 h-4 rounded accent-red-500" />
                  <span className="text-sm text-ink-500">Closed</span>
                </label>
                {!h.isClosed && (
                  <>
                    <input type="time" value={h.open} onChange={(e) => updateHours(h.day, 'open', e.target.value)}
                      className="input w-32 text-sm" />
                    <span className="text-ink-400 text-sm">to</span>
                    <input type="time" value={h.close} onChange={(e) => updateHours(h.day, 'close', e.target.value)}
                      className="input w-32 text-sm" />
                  </>
                )}
              </div>
            ))}
          </div>
          <button onClick={saveSettings} disabled={isSaving} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Hours'}
          </button>
        </div>
      )}

      {/* Areas */}
      {tab === 'areas' && settings && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <h3 className="font-semibold text-ink-900">Delivery Areas</h3>
          <p className="text-ink-500 text-xs -mt-2">
            Extra charge is added on top of the base delivery charge (see Delivery tab) when a customer
            selects that area at checkout — e.g. base ₹{settings.deliveryCharge ?? 40} + ₹20 extra for a farther area = ₹{(Number(settings.deliveryCharge) || 0) + 20} delivery charge.
          </p>
          <div className="space-y-2">
            {(settings.deliveryAreas || []).map((area, i) => (
              <div key={i} className="flex items-center gap-3 bg-cream-100 rounded-lg px-4 py-3">
                <button onClick={() => toggleArea(i)}>
                  {area.isActive
                    ? <ToggleRight size={22} className="text-green-500" />
                    : <ToggleLeft size={22} className="text-ink-300" />}
                </button>
                <span className={`flex-1 text-sm font-medium ${area.isActive ? 'text-ink-900' : 'text-ink-400'}`}>{area.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-400 text-xs">₹ extra</span>
                  <input type="number" min="0" value={area.extraCharge ?? 0}
                    onChange={(e) => updateAreaCharge(i, e.target.value)}
                    className="input w-20 text-sm py-1.5" />
                </div>
                <button onClick={() => removeArea(i)} className="text-ink-400 hover:text-red-600 transition-colors">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newArea} onChange={(e) => setNewArea(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addArea()}
              placeholder="Add area name (e.g. Benz Circle)" className="input flex-1" />
            <button onClick={addArea} className="btn-secondary px-4">
              <Plus size={16} />
            </button>
          </div>
          <button onClick={saveSettings} disabled={isSaving} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {isSaving ? 'Saving...' : 'Save Areas'}
          </button>
        </div>
      )}

      {/* Print Agent */}
      {tab === 'printer' && (
        <div className="card p-6 space-y-4 max-w-2xl">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-ink-700" />
            <h3 className="font-semibold text-ink-900">Kitchen Printer Agent</h3>
          </div>
          <p className="text-ink-500 text-sm">
            The KOT print agent is a small program that runs on the computer connected to your kitchen
            printer. It auto-prints a ticket whenever you confirm an order. Paste these two values into
            its <code className="bg-cream-100 px-1 rounded">.env</code> file to connect it to this restaurant.
          </p>

          {isLoadingKey ? (
            <p className="text-ink-400 text-sm">Loading...</p>
          ) : printAgent ? (
            <div className="space-y-3">
              <div>
                <label className="label">RESTAURANT_ID</label>
                <div className="flex items-center gap-2">
                  <input readOnly value={printAgent.restaurantId} className="input font-mono text-sm" />
                  <button onClick={() => copyToClipboard(printAgent.restaurantId, 'Restaurant ID')}
                    className="btn-secondary p-2.5" title="Copy">
                    <Copy size={15} />
                  </button>
                </div>
              </div>
              <div>
                <label className="label">PRINT_AGENT_KEY</label>
                <div className="flex items-center gap-2">
                  <input readOnly type={showKey ? 'text' : 'password'} value={printAgent.printAgentKey}
                    className="input font-mono text-sm" />
                  <button onClick={() => setShowKey((v) => !v)} className="btn-secondary p-2.5" title={showKey ? 'Hide' : 'Show'}>
                    {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button onClick={() => copyToClipboard(printAgent.printAgentKey, 'Print agent key')}
                    className="btn-secondary p-2.5" title="Copy">
                    <Copy size={15} />
                  </button>
                </div>
              </div>
              <button onClick={regeneratePrintAgentKey} disabled={isRegeneratingKey}
                className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium disabled:opacity-50">
                <RefreshCw size={14} className={isRegeneratingKey ? 'animate-spin' : ''} />
                {isRegeneratingKey ? 'Regenerating...' : 'Regenerate Key'}
              </button>
              <p className="text-ink-400 text-xs">
                Only regenerate if this key may have leaked or you're setting up a replacement printer PC —
                the running print agent will stop working until you update its <code className="bg-cream-100 px-1 rounded">.env</code> with the new key.
              </p>
            </div>
          ) : (
            <p className="text-red-600 text-sm">Failed to load. Try switching tabs and back.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
