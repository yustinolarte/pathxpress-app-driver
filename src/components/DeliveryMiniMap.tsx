import { useEffect, useRef, useState } from 'react';
import { Navigation } from 'lucide-react';
import L from 'leaflet';
import { Geolocation } from '@capacitor/geolocation';

interface DeliveryMiniMapProps {
    destinationLat: number;
    destinationLng: number;
    customerName: string;
    onNavigate: () => void;
}

export function DeliveryMiniMap({ destinationLat, destinationLng, customerName, onNavigate }: DeliveryMiniMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const driverMarkerRef = useRef<L.Marker | null>(null);
    const routeLineRef = useRef<L.Polyline | null>(null);

    const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
    const [distance, setDistance] = useState<string>('');
    const [eta, setEta] = useState<string>('');
    const [watchId, setWatchId] = useState<string | null>(null);

    // 1. Start Real-Time GPS Tracking with Capacitor
    useEffect(() => {
        const startTracking = async () => {
            try {
                // Get initial position
                const current = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
                setDriverPosition([current.coords.latitude, current.coords.longitude]);

                // Start periodic watch
                const id = await Geolocation.watchPosition(
                    { enableHighAccuracy: true, timeout: 10000 },
                    (position, err) => {
                        if (position) {
                            setDriverPosition([position.coords.latitude, position.coords.longitude]);
                        }
                    }
                );
                setWatchId(id);
            } catch (error) {
                console.error('Error with geolocation:', error);

                // Fallback: Try web API if Capacitor fails or use a demo offset
                // This helps in browser testing as well
                if (navigator.geolocation) {
                    const navId = navigator.geolocation.watchPosition(
                        (pos) => setDriverPosition([pos.coords.latitude, pos.coords.longitude]),
                        (err) => console.error('Web Geo Error', err),
                        { enableHighAccuracy: true }
                    );
                    // Store numerical ID as string to unify type
                    setWatchId(navId.toString());
                } else {
                    // Absolute fallback for testing only
                    setDriverPosition([destinationLat - 0.01, destinationLng - 0.01]);
                }
            }
        };

        startTracking();

        return () => {
            if (watchId) {
                // Try clearing both (Capacitor string ID vs Browser Number ID)
                try {
                    Geolocation.clearWatch({ id: watchId });
                } catch (e) { }
                try {
                    navigator.geolocation.clearWatch(Number(watchId));
                } catch (e) { }
            }
        };
    }, []);

    // 2. Initialize Map (Run once)
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const map = L.map(mapContainerRef.current, {
            center: [destinationLat, destinationLng],
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
            dragging: true,
            scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

        // Destination Marker (Red)
        const destIcon = L.divIcon({
            className: 'dest-marker',
            html: `<div style="width: 40px; height: 40px; background: #ef4444; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 3px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                    <span style="transform: rotate(45deg); color: white; font-size: 16px;">📍</span>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        L.marker([destinationLat, destinationLng], { icon: destIcon }).addTo(map);
        mapRef.current = map;

        return () => {
            map.remove();
            mapRef.current = null;
        };
    }, [destinationLat, destinationLng]);


    // 3. Update Driver Marker, Route, and Metrics when position changes
    useEffect(() => {
        if (!mapRef.current || !driverPosition) return;
        const map = mapRef.current;

        // --- Driver Marker ---
        if (driverMarkerRef.current) {
            driverMarkerRef.current.setLatLng(driverPosition);
        } else {
            console.log("Creating new driver marker at", driverPosition);
            const driverIcon = L.divIcon({
                className: 'driver-marker',
                html: `<div style="width: 24px; height: 24px; background: #3b82f6; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            driverMarkerRef.current = L.marker(driverPosition, { icon: driverIcon }).addTo(map);
        }

        // --- Route Line ---
        if (routeLineRef.current) {
            routeLineRef.current.setLatLngs([driverPosition, [destinationLat, destinationLng]]);
        } else {
            routeLineRef.current = L.polyline([driverPosition, [destinationLat, destinationLng]], {
                color: '#3b82f6',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 10'
            }).addTo(map);
        }

        // --- Fit Bounds ---
        const bounds = L.latLngBounds([driverPosition, [destinationLat, destinationLng]]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

        // --- ETA Calculations ---
        const R = 6371; // Earth's radius in km
        const dLat = (destinationLat - driverPosition[0]) * Math.PI / 180;
        const dLon = (destinationLng - driverPosition[1]) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(driverPosition[0] * Math.PI / 180) * Math.cos(destinationLat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanceKm = R * c;

        setDistance(distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m` : `${distanceKm.toFixed(1)} km`);

        // Assume slightly slower speed for real traffic: 25 km/h
        const speedKmh = 25;
        const etaMinutes = Math.ceil((distanceKm / speedKmh) * 60);
        setEta(`${etaMinutes} min`);

    }, [driverPosition, destinationLat, destinationLng]);


    return (
        <div className="h-[35vh] bg-gray-100 relative w-full border-b border-gray-200">
            {/* Map Container */}
            <div ref={mapContainerRef} className="w-full h-full text-left" style={{ zIndex: 0 }} />

            {/* NEW: Compact ETA Pill (Top Center) */}
            {eta && (
                <div className="absolute top-4 left-0 right-0 flex justify-center z-[500] pointer-events-none">
                    <div className="bg-black/80 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto">
                        <span className="animate-pulse text-sm">🚗</span>
                        <span className="font-bold text-sm">{eta}</span>
                        <span className="text-gray-400 text-xs border-l border-gray-600 pl-2 ml-1">{distance}</span>
                    </div>
                </div>
            )}

            {/* NEW: Navigation FAB (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-[500]">
                <button
                    onClick={onNavigate}
                    className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 active:scale-95 transition-all text-white"
                >
                    <Navigation className="w-6 h-6" />
                </button>
            </div>

            {/* Loading State */}
            {!driverPosition && (
                <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center z-[800]">
                    <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-gray-500 font-medium text-sm">Locating...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
