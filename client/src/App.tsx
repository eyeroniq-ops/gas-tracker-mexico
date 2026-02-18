import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import axios from 'axios';
import type { Station } from './types';
import PueblaMap from './components/Map';
import Filters from './components/Filters';
import './index.css';
import { MEXICAN_STATES } from './constants/states';

function App() {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  // Persistence for Favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  const [viewMode, setViewMode] = useState<'map' | 'favorites'>('map');

  // Filter States
  const [sortBy, setSortBy] = useState<'regular' | 'premium' | 'diesel'>('regular');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState(10); // Default 10km radius
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [darkMode, setDarkMode] = useState(false); // Default to Light Mode as per mockup
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);

  // State Filter
  const [selectedStateName, setSelectedStateName] = useState<string>('Puebla');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 19.0414, lng: -98.2063 });

  // Bottom Sheet State
  const [sheetHeight, setSheetHeight] = useState(40); // Percentage: 40% default
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Toggle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle State Change
  const handleSelectState = (stateName: string) => {
    const state = MEXICAN_STATES.find(s => s.name === stateName);
    if (state) {
      setSelectedStateName(stateName);
      const newCenter = { lat: state.lat, lng: state.lng };
      setMapCenter(newCenter);
      setUserLocation(newCenter); // Move filtering radius to new state
      setRadius(50); // Increase search radius
      setSelectedStationId(null); // Deselect station
    }
  };

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  // Helper to Generate Mock Data (Images & Ratings)
  const enrichStationData = (stations: Station[]) => {
    return stations.map(s => ({
      ...s,
      image: getBrandImage(s.brand),
      rating: (3.5 + Math.random() * 1.5).toFixed(1), // Random 3.5 - 5.0
      reviews: Math.floor(Math.random() * 500) + 10
    }));
  };

  const getBrandImage = (brand?: string) => {
    const b = brand?.toLowerCase() || '';
    // Using reliable Logos from Wikipedia/Commons (SVG/PNG)
    if (b.includes('pemex')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Pemex_logo.svg/800px-Pemex_logo.svg.png';
    if (b.includes('mobil')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Mobil_logo.svg/800px-Mobil_logo.svg.png';
    if (b.includes('shell')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Shell_logo.svg/800px-Shell_logo.svg.png';
    if (b.includes('g500')) return 'https://g500network.com/images/logo_g500.png';
    if (b.includes('bp') || b.includes('british')) return 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/BP_Helios_logo.svg/800px-BP_Helios_logo.svg.png';
    if (b.includes('repsol')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Repsol_logo.svg/800px-Repsol_logo.svg.png';
    if (b.includes('oxxo')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Oxxo_Logo.svg/800px-Oxxo_Logo.svg.png';
    // Generic Fallback
    return 'https://images.unsplash.com/photo-1527018601619-a50d69c37eb9?q=80&w=400&auto=format&fit=crop';
  };

  // Fetch Data with Static Fallback
  useEffect(() => {
    const fetchData = async () => {
      let rawData: Station[] = [];
      try {
        // 1. Try Local API (Dev/Local)
        console.log("Fetching from local API...");
        const apiResponse = await axios.get('http://localhost:3001/api/stations', { timeout: 3000 });
        if (Array.isArray(apiResponse.data)) {
          rawData = apiResponse.data;
        } else if (apiResponse.data?.stations) {
          rawData = apiResponse.data.stations;
        }
      } catch (localError) {
        console.warn("Local API failed, using bundled data.", localError);
        try {
          // 2. Load Bundled JSON (Netlify/Prod)
          // This ensures data is part of the build, no 404s.
          const staticData: any = await import('./data/stations.json');

          if (staticData.default && Array.isArray(staticData.default)) {
            rawData = staticData.default;
          } else if (staticData.default?.stations) {
            rawData = staticData.default.stations;
          } else if (staticData.stations) {
            rawData = staticData.stations; // Direct import case
          }
        } catch (bundleError) {
          console.error("Critical: Failed to load bundled data.", bundleError);
        }
      }

      if (rawData && rawData.length > 0) {
        console.log(`[DEBUG] Successfully loaded ${rawData.length} stations.`);
        setStations(enrichStationData(rawData));
      } else {
        console.error("No data loaded.");
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Geolocation
  const handleLocateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error(error)
      );
    }
  };

  // Drag Handlers for Bottom Sheet
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    if ('touches' in e) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = e.clientY;
    }
    startHeight.current = sheetHeight;
    document.body.style.userSelect = 'none';
    document.body.style.overflow = 'hidden'; // Prevent body scroll while dragging
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    // Prevent default to avoid scrolling on mobile
    if (e.cancelable) e.preventDefault();

    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = startY.current - clientY; // Up is positive
    const windowHeight = window.innerHeight;
    const deltaPercentage = (deltaY / windowHeight) * 100;

    let newHeight = startHeight.current + deltaPercentage;

    // Clamp values (Top bar height is roughly 15%)
    if (newHeight < 15) newHeight = 15;
    if (newHeight > 92) newHeight = 92;

    setSheetHeight(newHeight);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.overflow = '';

    // Snap logic for better UX
    if (sheetHeight > 60) setSheetHeight(90);      // Fullscreen
    else if (sheetHeight < 25) setSheetHeight(15); // Collapsed
    else setSheetHeight(40);                       // Half-screen (default)
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove, { passive: false });
      window.addEventListener('touchmove', handleDragMove, { passive: false });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, sheetHeight]);

  // DATA PROCESSING & FILTERING
  const processedStations = useMemo(() => {
    // 1. Filter out invalid prices (N/A or <= 0)
    let validStations = stations.filter(s => {
      const p = s.prices[sortBy];
      return p !== undefined && p > 0;
    });

    // 2. Outlier Detection (Filter prices < 70% of average)
    if (validStations.length > 0) {
      const total = validStations.reduce((sum, s) => sum + (s.prices[sortBy] || 0), 0);
      const avg = total / validStations.length;
      const threshold = avg * 0.7;
      validStations = validStations.filter(s => (s.prices[sortBy] || 0) >= threshold);
    }

    // 3. Radius Filter
    if (userLocation) {
      validStations = validStations.filter(s => {
        const R = 6371; // km
        const dLat = (s.location.lat - userLocation.lat) * Math.PI / 180;
        const dLon = (s.location.lng - userLocation.lng) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(s.location.lat * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const dist = R * c;
        return dist <= radius;
      });
    }

    // 4. Search Filter
    if (search) {
      const lowerSearch = search.toLowerCase();
      validStations = validStations.filter(s =>
        s.name.toLowerCase().includes(lowerSearch) ||
        (s.location.address && s.location.address.toLowerCase().includes(lowerSearch)) ||
        (s.brand && s.brand.toLowerCase().includes(lowerSearch))
      );
    }

    // 5. Sort
    return validStations.sort((a, b) => {
      const priceA = a.prices[sortBy] || 9999;
      const priceB = b.prices[sortBy] || 9999;
      return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }, [stations, search, sortBy, userLocation, radius, sortOrder]);

  const displayStations = useMemo(() => {
    if (viewMode === 'favorites') {
      return processedStations.filter(s => favorites.includes(s.id));
    }
    return processedStations;
  }, [processedStations, viewMode, favorites]);

  // Calculate Price Quartiles for Colors
  const getPriceColor = (price: number | undefined) => {
    const prices = displayStations.map(s => s.prices[sortBy]).filter((p): p is number => p !== undefined && p > 0).sort((a, b) => a - b);
    const minPrice = prices[0] || 0;
    const maxPrice = prices[prices.length - 1] || 0;
    const range = maxPrice - minPrice;

    if (!price || range === 0) return 'text-slate-500';
    const normalized = (price - minPrice) / range;

    // Matching Map.tsx colors but for TEXT
    if (normalized < 0.25) return 'text-[#00b050]';   // Green
    if (normalized < 0.50) return 'text-[#ffc000]';   // Yellow
    if (normalized < 0.75) return 'text-[#ed7d31]';   // Orange
    return 'text-[#c00000]';                           // Red
  };

  const updateStationAddress = useCallback((id: string, address: string) => {
    setStations(prev => prev.map(s => s.id === id ? { ...s, location: { ...s.location, address } } : s));
  }, []);

  // Background Address Auto-Fetcher (Throttled)
  const lastFetchTime = useRef<number>(0);

  useEffect(() => {
    // Find stations visible in list that lack an address
    const stationsNeedingAddress = displayStations.filter(s =>
      !s.location.address ||
      s.location.address === "Ver dirección en mapa..." ||
      s.location.address === "Dirección no disponible"
    );

    if (stationsNeedingAddress.length === 0) return;

    // Pick the first one
    const candidate = stationsNeedingAddress[0];

    // Throttle logic
    const now = Date.now();
    const timeSinceLast = now - lastFetchTime.current;
    const delay = timeSinceLast > 1200 ? 0 : 1200 - timeSinceLast;

    const timer = setTimeout(async () => {
      lastFetchTime.current = Date.now();
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${candidate.location.lat}&lon=${candidate.location.lng}`);
        const data = await res.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',').slice(0, 3).join(',');
          updateStationAddress(candidate.id, parts);
        } else {
          // Mark as failed so we don't retry immediately (optional: add a 'fetched' flag, but here we just leave logic to 'Dirección no disponible' which we filter out? 
          // Actually if we filter out 'Dirección no disponible', we won't retry unique failures.
          // Let's set it to something distinctive if failed? 
          // For now, let's just update to "Ubicación desconocida" to break the loop
          updateStationAddress(candidate.id, "Ubicación aproximada");
        }
      } catch (e) {
        updateStationAddress(candidate.id, "Ubicación aproximada");
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [displayStations, updateStationAddress]);



  return (
    <div className="flex flex-col h-screen w-full relative bg-background-light dark:bg-background-dark overflow-hidden font-display text-slate-900 dark:text-slate-100 touch-none">

      {/* HEADER (Floating) */}
      <Filters
        sortBy={sortBy}
        onSortChange={setSortBy}
        searchTerm={search}
        onSearchChange={setSearch}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenInfo={() => setShowInfoModal(true)}
        radius={radius}
        onRadiusChange={setRadius}
        selectedStateName={selectedStateName}
        onSelectState={handleSelectState}
      />

      {/* MAP VIEW (Full Screen Background) */}
      <main className="absolute inset-0 z-0 h-full w-full">
        <PueblaMap
          stations={displayStations}
          selectedStationId={selectedStationId}
          onSelectStation={(id) => {
            setSelectedStationId(id);
            setSheetHeight(40); // Open sheet to show details
          }}
          userLocation={userLocation}
          darkMode={darkMode}
          sortBy={sortBy}
          radius={radius}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onAddressFetched={updateStationAddress}
          center={mapCenter}
        />

        {/* Floating Map Controls */}
        <div
          className="absolute right-4 flex flex-col gap-3 z-[400] transition-all duration-100 ease-out"
          style={{ bottom: `calc(${sheetHeight}% + 24px)` }}
        >
          <button
            onClick={handleLocateUser}
            className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            title="Mi Ubicación"
          >
            <span className="material-symbols-outlined">my_location</span>
          </button>
        </div>
      </main>

      {/* BOTTOM LIST (Draggable Sheet) */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#101922] rounded-t-3xl shadow-[0_-8px_30px_rgba(0,0,0,0.12)] z-30 flex flex-col overflow-hidden transition-all duration-100 ease-out"
        style={{ height: `${sheetHeight}%` }}
      >

        {/* Handle (Draggable Area) */}
        <div
          className="w-full h-8 flex items-center justify-center cursor-grab active:cursor-grabbing hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shrink-0"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          style={{ touchAction: 'none' }}
        >
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {viewMode === 'map' ? 'Las más baratas cerca' : 'Mis Favoritos'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
            >
              <span className="material-symbols-outlined text-[14px]">sort</span>
              {sortOrder === 'asc' ? 'Menor Precio' : 'Mayor Precio'}
            </button>
            <button
              onClick={() => setViewMode('map')}
              className="text-sm font-medium text-primary hover:text-blue-400 transition"
            >
              Ver todas
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24 hide-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando...</div>
          ) : displayStations.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No hay resultados.</div>
          ) : displayStations.map(station => (
            <div
              key={station.id}
              onClick={() => {
                setSelectedStationId(station.id);
              }}
              className={`bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 flex gap-3 border transition-all cursor-pointer ${selectedStationId === station.id
                ? 'border-primary shadow-lg shadow-primary/10'
                : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
            >
              {/* Station Image */}
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-white relative border border-slate-100 flex items-center justify-center">
                <img
                  src={station.image}
                  alt={station.brand}
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                  <span className="material-symbols-outlined text-[32px]">local_gas_station</span>
                </div>
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-2">{station.name}</h3>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      <span>{station.rating || '4.5'}</span>
                      <span className="material-symbols-outlined text-[10px] text-amber-500 font-variation-fill">star</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug break-words line-clamp-2">
                    {station.location.address || "Ver dirección en mapa..."}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">{station.reviews || 100} opiniones</p>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <button
                    onClick={(e) => toggleFavorite(station.id, e)}
                    className={`p-1 -ml-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition ${favorites.includes(station.id) ? 'text-red-500' : 'text-slate-400'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{favorites.includes(station.id) ? 'favorite' : 'favorite_border'}</span>
                  </button>
                  <div className="text-right">
                    <p className={`text-xl font-black leading-none ${getPriceColor(station.prices[sortBy])}`}>
                      ${(station.prices[sortBy] || 0).toFixed(2)}
                    </p>
                    <span className="text-[9px] font-bold uppercase text-slate-400">Litro</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#101922]/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 pb-6 pt-3 z-40">
        <div className="max-w-md mx-auto flex items-center justify-around">
          <NavButton icon="map" label="Explorar" active={viewMode === 'map'} onClick={() => setViewMode('map')} />
          <NavButton icon="favorite" label="Favoritos" active={viewMode === 'favorites'} onClick={() => setViewMode('favorites')} />
        </div>
      </nav>

      {/* Info Modal */}
      <InfoModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  );
}

function NavButton({ icon, label, active = false, onClick }: { icon: string, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 ${active ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'} transition`}>
      <span className={`material-symbols-outlined text-[28px] ${active ? 'font-variation-fill' : ''}`}>{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  )
}

function InfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">local_gas_station</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Gas Tracker Puebla</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Encuentra las gasolineras más baratas y cercanas a ti en tiempo real. Compara precios de Regular, Premium y Diesel.
          </p>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-4">Developed by</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 lowercase tracking-tight">eyeroniq</h3>

            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 px-4">
              ¿Te gustaría tener una app como esta para tu negocio?
            </p>

            <div className="flex flex-col gap-3">
              <a href="https://www.eyeroniq.com" target="_blank" rel="noreferrer" className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px]">language</span>
                www.eyeroniq.com
              </a>
              <a href="https://instagram.com/_eyeroniq" target="_blank" rel="noreferrer" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:brightness-110">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                @_eyeroniq
              </a>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-4 text-center text-sm font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition border-t border-slate-100 dark:border-slate-800">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default App;
