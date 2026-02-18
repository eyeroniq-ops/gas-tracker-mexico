import { useRef, useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Station } from '../types';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    stations: Station[];
    selectedStationId: string | null;
    onSelectStation: (id: string) => void;
    userLocation: { lat: number; lng: number } | null;
    darkMode: boolean;
    sortBy: 'regular' | 'premium' | 'diesel';
    radius: number;
    favorites: string[];
    onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
    onAddressFetched: (id: string, address: string) => void;
    center?: { lat: number; lng: number };
}

function MapUpdater({ center }: { center: { lat: number; lng: number } }) {
    const map = useMap();
    useEffect(() => {
        if (!center) return;
        map.flyTo([center.lat, center.lng], 14, { animate: true });
    }, [center, map]);
    return null;
}

const PueblaMap = ({ stations, selectedStationId, onSelectStation, userLocation, darkMode, sortBy, radius, favorites, onToggleFavorite, onAddressFetched, center }: MapProps) => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRefs = useRef<{ [id: string]: L.Marker | null }>({});
    const [fetchedAddress, setFetchedAddress] = useState<string>("");

    // Open popup when selected station changes
    useEffect(() => {
        if (selectedStationId && markerRefs.current[selectedStationId]) {
            markerRefs.current[selectedStationId]?.openPopup();
        }
    }, [selectedStationId]);

    // Fetch Address when station is selected if missing
    useEffect(() => {
        if (selectedStationId) {
            const station = stations.find(s => s.id === selectedStationId);
            if (station && (!station.location.address || station.location.address.trim() === '')) {
                setFetchedAddress("Cargando dirección...");
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${station.location.lat}&lon=${station.location.lng}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.display_name) {
                            // Simplify address: Take first 3 parts
                            const parts = data.display_name.split(',').slice(0, 3).join(',');
                            setFetchedAddress(parts);
                            onAddressFetched(selectedStationId, parts);
                        } else {
                            const msg = "Dirección no disponible";
                            setFetchedAddress(msg);
                            onAddressFetched(selectedStationId, msg);
                        }
                    })
                    .catch(() => {
                        const msg = "Dirección no disponible";
                        setFetchedAddress(msg);
                        onAddressFetched(selectedStationId, msg);
                    });
            } else {
                setFetchedAddress(station?.location.address || "");
            }
        }
    }, [selectedStationId, stations, onAddressFetched]);

    // Calculate Price Quartiles
    const prices = stations.map(s => s.prices[sortBy]).filter((p): p is number => p !== undefined && p > 0).sort((a, b) => a - b);
    const minPrice = prices[0] || 0;
    const maxPrice = prices[prices.length - 1] || 0;
    const range = maxPrice - minPrice;

    const getPriceColor = (price: number | undefined) => {
        if (!price || range === 0) return 'bg-slate-500 border-slate-600 text-white';
        const normalized = (price - minPrice) / range;
        // Matching the screenshot colors more closely
        if (normalized < 0.25) return 'bg-[#00b050] border-[#009040] text-white';   // Green
        if (normalized < 0.50) return 'bg-[#ffc000] border-[#e0a000] text-black';   // Yellow
        if (normalized < 0.75) return 'bg-[#ed7d31] border-[#d06020] text-white';   // Orange
        return 'bg-[#c00000] border-[#a00000] text-white';                           // Red
    };

    const createPriceIcon = (price: number | undefined, isSelected: boolean) => {
        const priceText = price ? `$${price.toFixed(2)}` : 'N/A';
        let colorClasses = getPriceColor(price);

        const scale = isSelected ? 'scale-125 z-50' : 'scale-100 z-10 hover:scale-110';
        const shadow = isSelected ? 'shadow-2xl' : 'shadow-md';
        const ring = isSelected ? 'ring-4 ring-blue-500/50' : '';

        return L.divIcon({
            className: 'custom-div-icon',
            html: `
            <div class="${colorClasses} ${scale} ${shadow} ${ring} border-2 rounded-full px-2.5 py-1 text-[11px] font-bold transform transition-all text-center whitespace-nowrap min-w-[48px] relative flex justify-center items-center font-display tracking-tight">
               ${priceText}
            </div>
          `,
            iconSize: [52, 28],
            iconAnchor: [26, 14],
            popupAnchor: [0, -14]
        });
    };

    const selectedStation = stations.find(s => s.id === selectedStationId);

    return (
        <MapContainer
            center={[19.0414, -98.2063]}
            zoom={13}
            className="h-full w-full z-0 outline-none"
            zoomControl={false}
            ref={mapRef}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url={darkMode
                    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    // Using a cleaner, more "Google Maps" like light theme
                    : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                }
            />

            {(center || selectedStation) && <MapUpdater center={selectedStation?.location || center!} />}
            {userLocation && (
                <>
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({
                        className: 'user-marker',
                        html: '<div class="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-lg relative"><div class="absolute inset-0 bg-blue-500/40 rounded-full animate-ping scale-150"></div></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                    })}>
                    </Marker>
                    <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={radius * 1000} // Dynamic Radius in meters
                        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1.5, dashArray: '5, 5' }}
                    />
                </>
            )}

            {stations.map(station => (
                <Marker
                    key={station.id}
                    ref={(el) => { markerRefs.current[station.id] = el; }}
                    position={[station.location.lat, station.location.lng]}
                    icon={createPriceIcon(station.prices[sortBy], selectedStationId === station.id)}
                    eventHandlers={{
                        click: () => onSelectStation(station.id),
                    }}
                >
                    <Popup className="custom-popup" closeButton={false} offset={[0, -10]} maxWidth={280}>
                        <div className="p-4 min-w-[240px] text-center font-display leading-tight relative">
                            {/* Favorite Button in Popup */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(station.id);
                                }}
                                className="absolute top-3 right-3 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-red-500 transition-colors z-[600]"
                                title="Agregar a favoritos"
                            >
                                <span className={`material-symbols-outlined text-[20px] ${favorites.includes(station.id) ? 'text-red-500 font-variation-fill' : ''}`}>
                                    {favorites.includes(station.id) ? 'favorite' : 'favorite_border'}
                                </span>
                            </button>

                            <h3 className="font-black text-slate-900 text-lg mb-0.5 pr-8">{station.name}</h3>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-widest">{station.brand || 'Gasolinera'}</div>

                            {/* All Prices Grid */}
                            <div className="grid grid-cols-3 gap-1.5 mb-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <div className={`flex flex-col items-center p-1 rounded-lg ${sortBy === 'regular' ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''}`}>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Regular</span>
                                    <span className={`text-sm font-black ${station.prices.regular ? 'text-emerald-600' : 'text-slate-300'}`}>
                                        {station.prices.regular ? `$${station.prices.regular.toFixed(2)}` : '--'}
                                    </span>
                                </div>
                                <div className={`flex flex-col items-center p-1 rounded-lg ${sortBy === 'premium' ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''}`}>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Premium</span>
                                    <span className={`text-sm font-black ${station.prices.premium ? 'text-rose-500' : 'text-slate-300'}`}>
                                        {station.prices.premium ? `$${station.prices.premium.toFixed(2)}` : '--'}
                                    </span>
                                </div>
                                <div className={`flex flex-col items-center p-1 rounded-lg ${sortBy === 'diesel' ? 'bg-white shadow-sm ring-1 ring-slate-200' : ''}`}>
                                    <span className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Diesel</span>
                                    <span className={`text-sm font-black ${station.prices.diesel ? 'text-slate-800' : 'text-slate-300'}`}>
                                        {station.prices.diesel ? `$${station.prices.diesel.toFixed(2)}` : '--'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 text-left mb-3 px-1">
                                <span className="material-symbols-outlined text-slate-400 text-[18px] mt-0.5 shrink-0">location_on</span>
                                <p className="text-xs font-medium text-slate-600 leading-snug break-words">
                                    {fetchedAddress || station.location.address || "Dirección no disponible"}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 text-xs font-bold py-2.5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition"
                                >
                                    <img src="https://www.google.com/images/branding/product/2x/maps_96in128dp.png" className="w-5 h-5" alt="Maps" />
                                    Google
                                </a>
                                <a
                                    href={`https://waze.com/ul?ll=${station.location.lat},${station.location.lng}&navigate=yes`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-center gap-2 bg-[#33ccff] text-white text-xs font-bold py-2.5 rounded-xl shadow-sm hover:brightness-110 active:scale-95 transition"
                                >
                                    <span className="material-symbols-outlined text-[18px]">near_me</span>
                                    Waze
                                </a>
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default PueblaMap;
