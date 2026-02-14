import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Crosshair, Package, Navigation, Clock } from 'lucide-react';
import L from 'leaflet';

interface Stop {
    id: number;
    name: string;
    address: string;
    lat: number;
    lng: number;
    status: string;
    type: string;
    cod?: string | null;
    specialInstructions?: string;
}

interface RouteMapProps {
    stops: Stop[];
    onStopClick: (id: number) => void;
    onBack: () => void;
    onNavigateExternal: (lat: number, lng: number) => void;
}

export function RouteMap({ stops, onStopClick, onBack, onNavigateExternal }: RouteMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
    const [totalETA, setTotalETA] = useState<number>(0);
    const [nextStop, setNextStop] = useState<Stop | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Get driver location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setDriverPosition([position.coords.latitude, position.coords.longitude]);
                setIsLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                // Default to Dubai
                setDriverPosition([25.2048, 55.2708]);
                setIsLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, []);

    // Calculate ETA and next stop
    useEffect(() => {
        const pendingStops = stops.filter(s =>
            s.status.toLowerCase() === 'pending'
        );
        if (pendingStops.length > 0) {
            setNextStop(pendingStops[0]);
            setTotalETA(pendingStops.length * 8); // ~8 min per stop estimate
        }
    }, [stops]);

    // Initialize map
    useEffect(() => {
        if (isLoading || !mapContainerRef.current || mapRef.current) return;

        const defaultCenter = driverPosition || [25.2048, 55.2708];

        // Create map
        const map = L.map(mapContainerRef.current, {
            center: defaultCenter as L.LatLngExpression,
            zoom: 13,
            zoomControl: false,
        });
        mapRef.current = map;

        // Add tile layer (OpenStreetMap)
        // Mapbox Streets v12
        // CartoDB Voyager (Clean, modern, no API key required for basic use)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);

        // Driver marker (blue)
        if (driverPosition) {
            const driverIcon = L.divIcon({
                className: 'driver-marker',
                html: `<div style="width: 20px; height: 20px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
            });
            L.marker(driverPosition, { icon: driverIcon }).addTo(map);
        }

        // Stop markers
        const bounds: L.LatLngExpression[] = [];
        if (driverPosition) bounds.push(driverPosition);

        stops.forEach((stop, index) => {
            if (!stop.lat || !stop.lng) return;

            const isPending = stop.status.toLowerCase() === 'pending';
            const color = isPending ? '#000000' : '#22c55e';

            const stopIcon = L.divIcon({
                className: 'stop-marker',
                html: `
          <div style="
            width: 32px; height: 32px; 
            background: ${color}; 
            border: 2px solid white; 
            border-radius: 50%; 
            display: flex; 
            align-items: center; 
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">${index + 1}</div>
        `,
                iconSize: [32, 32],
                iconAnchor: [16, 16],
            });

            const marker = L.marker([stop.lat, stop.lng], { icon: stopIcon }).addTo(map);

            // Popup content
            marker.bindPopup(`
        <div style="padding: 8px; min-width: 180px;">
          <strong style="font-size: 14px;">${stop.name}</strong>
          <p style="color: #666; font-size: 12px; margin: 4px 0;">${stop.address}</p>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
            <span style="
              font-size: 11px; 
              padding: 2px 8px; 
              border-radius: 12px;
              background: ${isPending ? '#fef3c7' : '#dcfce7'};
              color: ${isPending ? '#92400e' : '#166534'};
            ">${stop.status}</span>
            ${stop.cod ? `<span style="font-size: 12px; font-weight: bold; color: #000;">${stop.cod}</span>` : ''}
          </div>
          ${stop.specialInstructions ? `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #eee;">
               <p style="color: #d97706; font-size: 11px; font-weight: bold; margin: 0;">NOTE:</p>
               <p style="color: #4b5563; font-size: 11px; margin: 2px 0 0 0;">${stop.specialInstructions}</p>
            </div>
          ` : ''}
        </div>
      `);

            marker.on('click', () => {
                onStopClick(stop.id);
            });

            bounds.push([stop.lat, stop.lng]);
        });

        // Draw route line
        if (bounds.length > 1) {
            L.polyline(bounds as L.LatLngExpression[], {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.6,
                dashArray: '8, 8',
            }).addTo(map);
        }

        // Fit bounds
        if (bounds.length > 0) {
            map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50] });
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [isLoading, driverPosition, stops, onStopClick]);

    const handleRecenter = () => {
        if (mapRef.current && driverPosition) {
            mapRef.current.flyTo(driverPosition, 15);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-500 text-sm">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white relative">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 z-[1000] p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
                <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="flex-1">
                        <h2 className="font-bold text-gray-900">Route Map</h2>
                        <p className="text-sm text-gray-500">{stops.filter(s => s.status.toLowerCase() === 'pending').length} stops pending</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-black font-bold">
                            <Clock className="w-4 h-4" />
                            <span>~{totalETA} min</span>
                        </div>
                        <p className="text-xs text-gray-400">Est. total</p>
                    </div>
                </div>
            </div>

            {/* Map Container */}
            <div
                ref={mapContainerRef}
                style={{ width: '100%', height: '100vh' }}
            />

            {/* Recenter Button */}
            <button
                onClick={handleRecenter}
                className="absolute bottom-40 right-4 z-[1000] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center"
            >
                <Crosshair className="w-6 h-6 text-black" />
            </button>

            {/* Next Stop Card */}
            {nextStop && (
                <div className="absolute bottom-0 left-0 right-0 z-[1000] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                    <div
                        className="bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3"
                        onClick={() => onStopClick(nextStop.id)}
                    >
                        <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                            <Package className="w-6 h-6 text-green-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-400 uppercase">Next Stop</p>
                            <h3 className="font-bold text-gray-900 truncate">{nextStop.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{nextStop.address}</p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onNavigateExternal(nextStop.lat, nextStop.lng);
                            }}
                            className="w-12 h-12 rounded-xl bg-black flex items-center justify-center flex-shrink-0"
                        >
                            <Navigation className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
