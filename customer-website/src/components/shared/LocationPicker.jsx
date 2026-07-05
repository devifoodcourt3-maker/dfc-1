import { useState, useRef, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import '../../utils/leafletIcons';
import 'leaflet/dist/leaflet.css';
import { X, Crosshair, Search, MapPin, Loader2 } from 'lucide-react';
import { reverseGeocode, searchAddress } from '../../utils/geocode';

const DEFAULT_CENTER = [17.9311, 83.4289]; // Tagarapuvalasa, Visakhapatnam, Andhra Pradesh

const ClickToPlace = ({ onPick }) => {
  useMapEvents({ click(e) { onPick([e.latlng.lat, e.latlng.lng]); } });
  return null;
};

const LocationPicker = ({ initial, onConfirm, onClose }) => {
  const mapRef = useRef(null);
  const [position, setPosition] = useState(initial || null);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Invalidate map size after mount so Leaflet fills the container properly
  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!position) return;
    setIsGeocoding(true);
    const t = setTimeout(async () => {
      const addr = await reverseGeocode(position[0], position[1]);
      setAddress(addr);
      setIsGeocoding(false);
    }, 600);
    return () => clearTimeout(t);
  }, [position]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = [pos.coords.latitude, pos.coords.longitude];
        setPosition(next);
        mapRef.current?.flyTo(next, 17);
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    const r = await searchAddress(query);
    setResults(r);
    setIsSearching(false);
  };

  const pickResult = (r) => {
    const next = [r.lat, r.lng];
    setPosition(next);
    mapRef.current?.flyTo(next, 17);
    setResults([]);
    setQuery('');
  };

  const handleMarkerDrag = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng();
    setPosition([lat, lng]);
  }, []);

  return (
    /* Overlay — no padding on mobile so modal is edge-to-edge */
    <div className="fixed inset-0 bg-ink-900/50 backdrop-blur-sm z-[1000] flex items-end sm:items-center justify-center sm:p-4">

      {/*
        Mobile  → bottom-sheet style, full viewport height, no rounded top corners
        Desktop → centred card, max-w-lg, 90vh, rounded corners
      */}
      <div
        className="
          bg-white border border-ink-900/[0.08] shadow-soft-lg flex flex-col overflow-hidden
          w-full
          h-[100dvh] rounded-none
          sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-2xl
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-ink-900/[0.06] flex-shrink-0">
          <h2 className="font-bold text-ink-900 flex items-center gap-2">
            <MapPin size={17} style={{ color: '#b91c1c' }} /> Pin Your Location
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-ink-900/[0.05] rounded-lg transition-colors">
            <X size={18} className="text-ink-500" />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-ink-900/[0.06] flex-shrink-0 relative">
          <div className="flex gap-2">
            <input
              value={query} onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
              placeholder="Search your area, street, landmark..."
              className="input-field flex-1 text-sm"
            />
            <button type="button" onClick={handleSearch} disabled={isSearching} className="btn-outline px-4 text-sm py-2.5">
              {isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            </button>
          </div>
          {results.length > 0 && (
            <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-ink-900/[0.08] rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto shadow-soft-lg">
              {results.map((r, i) => (
                <button key={i} type="button" onClick={() => pickResult(r)}
                  className="w-full text-left px-3 py-2.5 text-sm text-ink-700 hover:bg-cream-100 transition-colors border-b border-ink-900/[0.05] last:border-0">
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map — flex-1 fills remaining space; touch-action:none lets Leaflet own all touch events */}
        <div className="flex-1 relative" style={{ minHeight: '200px', touchAction: 'none' }}>
          <MapContainer
            ref={mapRef}
            center={position || DEFAULT_CENTER}
            zoom={position ? 17 : 14}
            style={{ height: '100%', width: '100%', minHeight: '200px', background: '#f5f3f0' }}
            // Disable tap handler to prevent the ghost-click delay on mobile
            tap={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickToPlace onPick={setPosition} />
            {position && (
              <Marker
                position={position}
                draggable
                eventHandlers={{ dragend: handleMarkerDrag }}
              />
            )}
          </MapContainer>

          {/* Locate Me button */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="absolute bottom-4 right-4 z-[500] bg-white border border-ink-900/[0.1] hover:bg-cream-100 text-ink-900 p-3 rounded-full shadow-soft-lg transition-colors active:scale-95"
          >
            {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Crosshair size={18} />}
          </button>

          {/* Hint overlay */}
          {!position && (
            <div className="absolute top-3 left-3 right-3 z-[500] bg-white/95 border border-ink-900/[0.08] rounded-xl px-3 py-2 text-xs text-ink-600 text-center pointer-events-none shadow-soft">
              Tap anywhere on the map to drop a pin, or search above
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-ink-900/[0.06] flex-shrink-0 space-y-3">
          <div className="text-xs min-h-[16px]">
            {isGeocoding
              ? <span className="text-ink-400">Looking up address...</span>
              : address
                ? <span className="text-ink-700">{address}</span>
                : <span className="text-ink-400">Drop a pin to detect the address</span>}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center text-sm py-2.5">Cancel</button>
            <button
              type="button"
              disabled={!position}
              onClick={() => onConfirm({ lat: position[0], lng: position[1], address })}
              className="btn-primary flex-1 justify-center text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPicker;
