import { ArrowLeft, Navigation, Settings, MapPin, Truck, Wallet, CheckCircle, Package, Clock, Phone, Map, List } from 'lucide-react';
import { api } from '../services/api';
import { TabBar } from './TabBar';
import { RouteMap } from './RouteMap';
import { useState } from 'react';

interface RouteListProps {
    onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'profile' | 'settings') => void;
    onSelectDelivery: (id: number) => void;
    routeData?: any;
    authToken: string;
    onFinishRoute: () => void;
}

const defaultDeliveries = [
    { id: 1, name: 'Fatima Al Mansoori', address: 'Palm Jumeirah, Villa 234', distance: '2.1 km', status: 'Pending', type: 'COD', cod: '245.00 AED', lat: 25.1124, lng: 55.1390 },
    { id: 2, name: 'Mohammed Hassan', address: 'Dubai Marina, Tower 3, Apt 1205', distance: '3.2 km', status: 'Pending', type: 'Prepaid', cod: null, lat: 25.0805, lng: 55.1410 },
    { id: 3, name: 'Sarah Johnson', address: 'Business Bay, Office 45B', distance: '1.8 km', status: 'Delivered', type: 'COD', cod: '180.00 AED', lat: 25.1872, lng: 55.2631 },
    { id: 4, name: 'Abdullah Rashid', address: 'Al Barsha, Building 7, Unit 302', distance: '4.5 km', status: 'Pending', type: 'Prepaid', cod: null, lat: 25.1148, lng: 55.1961 },
    { id: 5, name: 'Layla Ahmed', address: 'Jumeirah Beach Residence, Block C', distance: '2.9 km', status: 'Attempted', type: 'COD', cod: '320.00 AED', lat: 25.0781, lng: 55.1342 },
    { id: 6, name: 'Omar Al Zaabi', address: 'Downtown Dubai, Burj Views', distance: '3.7 km', status: 'Pending', type: 'Return', cod: null, lat: 25.1972, lng: 55.2744 },
];

export function RouteList({ onNavigate, onSelectDelivery, routeData, authToken, onFinishRoute }: RouteListProps) {
    const [filter, setFilter] = useState<'All' | 'Pending' | 'COD' | 'Pickups'>('All');
    const [showNavigateModal, setShowNavigateModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    // Map deliveries/stops from route data, including stopType for pickup detection
    // Map deliveries/stops from route data
    // NEW LOGIC: Group by orderId to implement "Unified Package View"
    const stopsRaw = (routeData?.stops || routeData?.deliveries || []);

    // Group by Order ID
    const ordersMap: Record<string, any[]> = {};
    stopsRaw.forEach((s: any) => {
        let key = s.orderId ? s.orderId.toString() : `-${s.id}`;
        if (!ordersMap[key]) {
            ordersMap[key] = [];
        }
        ordersMap[key].push(s);
    });

    // Flatten back to list, choosing the "Active" stop for each order
    const deliveries = Object.values(ordersMap).map((orderStops: any) => {
        const stops = orderStops as any[];
        // If only one stop, return it
        if (stops.length === 1) return stops[0];

        // If multiple stops (Pickup + Delivery), find active one
        const pickup = stops.find((s: any) => s.stopType === 'pickup' || s.type === 'pickup');
        const delivery = stops.find((s: any) => s.stopType === 'delivery' || s.type === 'delivery');

        if (pickup && delivery) {
            // If pickup is not completed, SHOW PICKUP
            // Statuses that mean "Completed" for the purpose of moving next
            const status = pickup.status?.toLowerCase().replace(' ', '_');
            const isPickupDone = ['picked_up'].includes(status);

            if (!isPickupDone) return pickup;
            return delivery; // Pickup done, show delivery
        }

        // Fallback: return first
        return orderStops[0];
    }).map((d: any) => ({
        id: d.id,
        orderId: d.orderId, // Track orderId for pickup/delivery linking
        name: d.contactName || d.customerName || 'Unknown',
        address: d.address || 'No Address',
        distance: '0.0 km',
        status: d.status === 'pending' || d.status === 'PENDING' ? 'Pending' :
            d.status === 'picked_up' || d.status === 'PICKED_UP' ? 'Picked Up' :
                d.status === 'delivered' || d.status === 'DELIVERED' ? 'Delivered' :
                    d.status === 'attempted' || d.status === 'ATTEMPTED' || d.status === 'delivery_attempted' ? 'Attempted' :
                        d.status === 'returned' || d.status === 'RETURNED' ? 'Returned' :
                            d.status === 'failed' || d.status === 'FAILED' || d.status === 'failed_delivery' ? 'Failed' :
                                d.status === 'on_hold' || d.status === 'ON_HOLD' ? 'On Hold' : d.status,
        type: d.codAmount || d.codRequired ? 'COD' : 'Prepaid',
        cod: d.codAmount ? `${d.codAmount} AED` : null,
        lat: d.latitude || d.coordinates?.lat || 0,
        lng: d.longitude || d.coordinates?.lng || 0,
        // NEW: Use stopType from API to determine if pickup or delivery
        stopType: d.stopType || 'delivery',
        // NEW: isDisabled - delivery stops disabled until pickup is done
        isDisabled: d.isDisabled || false,
        waybillNumber: d.waybillNumber || d.packageRef,
        contactPhone: d.contactPhone || d.customerPhone,
    })) || defaultDeliveries;

    const filteredDeliveries = deliveries.filter((delivery: any) => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return delivery.status === 'Pending';
        if (filter === 'COD') return delivery.type === 'COD';
        if (filter === 'Pickups') return delivery.stopType === 'pickup';
        return true;
    });

    const handleNavigateClick = (e: React.MouseEvent, delivery: any) => {
        e.stopPropagation();
        setSelectedAddress({
            address: delivery.address,
            lat: delivery.lat,
            lng: delivery.lng,
        });
        setShowNavigateModal(true);
    };

    const openGoogleMaps = () => {
        if (!selectedAddress) return;
        const hasCoords = selectedAddress.lat && selectedAddress.lng && selectedAddress.lat !== 0 && selectedAddress.lng !== 0;
        const url = hasCoords
            ? `https://www.google.com/maps/dir/?api=1&destination=${selectedAddress.lat},${selectedAddress.lng}`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedAddress.address)}`;
        window.open(url, '_blank');
        setShowNavigateModal(false);
    };

    const openWaze = () => {
        if (!selectedAddress) return;
        const hasCoords = selectedAddress.lat && selectedAddress.lng && selectedAddress.lat !== 0 && selectedAddress.lng !== 0;
        const url = hasCoords
            ? `https://waze.com/ul?ll=${selectedAddress.lat},${selectedAddress.lng}&navigate=yes`
            : `https://waze.com/ul?q=${encodeURIComponent(selectedAddress.address)}&navigate=yes`;
        window.open(url, '_blank');
        setShowNavigateModal(false);
    };

    // Sort logic - pending first, then completed/failed, then on_hold/attempted last (re-attemptable)
    const sortedDeliveries = [...filteredDeliveries].sort((a: any, b: any) => {
        const statusOrder: Record<string, number> = {
            'Pending': 1,
            'Delivered': 2,
            'Picked Up': 2,
            'Returned': 2,
            'Failed': 2,
            'Cancelled': 2,
            'On Hold': 3,
            'Attempted': 3,
        };
        const orderA = statusOrder[a.status] || 5;
        const orderB = statusOrder[b.status] || 5;
        return orderA - orderB;
    });

    const allCompleted = deliveries.every((d: any) =>
        ['Delivered', 'Picked Up', 'Returned', 'Cancelled', 'Failed'].includes(d.status)
    );

    const handleFinishClick = async () => {
        if (!routeData?.id) return;
        try {
            await api.finishRoute(routeData.id, authToken);
            alert('Route finished successfully!');
            onFinishRoute();
        } catch (error) {
            console.error('Error finishing route:', error);
            alert('Failed to finish route. Please try again.');
        }
    };

    // Prepare stops for map
    const mapStops = deliveries.map((d: any) => ({
        id: d.id,
        name: d.name,
        address: d.address,
        lat: d.lat,
        lng: d.lng,
        status: d.status,
        type: d.type,
        cod: d.cod,
    }));

    const handleNavigateExternal = (lat: number, lng: number, address?: string) => {
        const hasCoords = lat && lng && lat !== 0 && lng !== 0;
        const url = hasCoords
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || 'Unknown')}`;
        window.open(url, '_blank');
    };

    // If map view is active, show RouteMap
    if (viewMode === 'map') {
        return (
            <RouteMap
                stops={mapStops}
                onStopClick={onSelectDelivery}
                onBack={() => setViewMode('list')}
                onNavigateExternal={handleNavigateExternal}
            />
        );
    }

    return (
        <div className="min-h-screen bg-background pb-32 font-sans">
            {/* Header */}
            <div className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-4 bg-background z-10 sticky top-0">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => onNavigate('dashboard')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-900" />
                    </button>
                    <h2 className="text-xl font-bold font-heading flex-1">Today's stops</h2>

                    {/* Map/List Toggle */}
                    <button
                        onClick={() => setViewMode('map')}
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg"
                    >
                        <Map className="w-5 h-5" />
                    </button>
                </div>

                {/* Filters as Pills */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {(['All', 'Pending', 'COD', 'Pickups'] as const).map((filterOption) => (
                        <button
                            key={filterOption}
                            onClick={() => setFilter(filterOption)}
                            className={`px-6 py-3 rounded-full whitespace-nowrap transition-all font-semibold text-sm ${filter === filterOption
                                ? 'bg-primary text-white shadow-lg shadow-black/10'
                                : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            {filterOption}
                        </button>
                    ))}
                </div>
            </div>

            {/* Delivery List */}
            <div className="px-6 space-y-4 pt-2">
                {sortedDeliveries.map((delivery: any) => {
                    const isCompleted = ['Delivered', 'Returned', 'Cancelled', 'Picked Up', 'Failed'].includes(delivery.status);
                    const isOnHold = delivery.status === 'On Hold';
                    const isFailed = delivery.status === 'Failed';
                    const isAttempted = delivery.status === 'Attempted';
                    const isDisabled = delivery.isDisabled && !isCompleted;

                    // Style logic based on card type
                    const isCOD = delivery.type === 'COD';
                    const isPickup = delivery.stopType === 'pickup';

                    let accentColor = 'bg-accent-purple';
                    let accentText = 'text-accent-purple-foreground';

                    if (isPickup) {
                        accentColor = 'bg-orange-100';
                        accentText = 'text-orange-700';
                    } else if (isCOD) {
                        accentColor = 'bg-accent-green';
                        accentText = 'text-accent-green-foreground';
                    }

                    // Disabled styling for delivery stops awaiting pickup
                    const disabledStyle = isDisabled ? 'opacity-50 pointer-events-none' : '';
                    const completedStyle = isCompleted ? 'opacity-60 grayscale' : '';
                    const onHoldStyle = isOnHold ? 'border-amber-300 bg-amber-50' : '';
                    const failedStyle = isFailed ? 'border-red-300 bg-red-50' : '';
                    const attemptedStyle = isAttempted ? 'border-yellow-300 bg-yellow-50' : '';

                    return (
                        <div
                            key={delivery.id}
                            onClick={() => !isCompleted && !isDisabled && onSelectDelivery(delivery.id)}
                            className={`relative rounded-[2rem] p-6 transition-all border shadow-sm hover:shadow-md ${completedStyle} ${disabledStyle} ${onHoldStyle || failedStyle || attemptedStyle || 'bg-white border-gray-100'}`}
                        >
                            {/* Disabled Overlay */}
                            {isDisabled && (
                                <div className="absolute inset-0 bg-gray-100/50 rounded-[2rem] flex items-center justify-center z-10">
                                    <div className="bg-gray-800 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
                                        🔒 Complete pickup first
                                    </div>
                                </div>
                            )}

                            {/* Card Header: Type Badge */}
                            <div className={`absolute top-6 right-6 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${accentColor} ${accentText}`}>
                                {isPickup ? 'PICKUP' : (isCOD ? `COD: ${delivery.cod}` : 'DELIVERY')}
                            </div>

                            {/* Main Info */}
                            <div className="mb-4 pr-24"> {/* Padding right to avoid overlap with badge */}
                                <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    {isPickup ? <Package className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                    {isPickup ? "Pickup" : "Drop Off"} #{delivery.id}
                                </span>
                                <h3 className="text-xl font-bold font-heading text-gray-900 mb-1 leading-tight">
                                    {delivery.address}
                                </h3>
                                <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                                    <span className='w-1.5 h-1.5 rounded-full bg-gray-300'></span>
                                    {delivery.name}
                                    {delivery.waybillNumber && (
                                        <>
                                            <span className='w-1.5 h-1.5 rounded-full bg-gray-300'></span>
                                            {delivery.waybillNumber}
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Actions / Status */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${delivery.status === 'Pending' ? 'bg-yellow-400' :
                                        delivery.status === 'On Hold' ? 'bg-amber-500' :
                                            delivery.status === 'Attempted' ? 'bg-orange-400' :
                                                delivery.status === 'Failed' ? 'bg-red-500' :
                                                    'bg-green-500'
                                        }`}></div>
                                    <span className={`text-sm font-semibold ${delivery.status === 'Failed' ? 'text-red-600' :
                                        delivery.status === 'On Hold' ? 'text-amber-600' :
                                            'text-gray-700'
                                        }`}>{delivery.status}</span>
                                </div>

                                {!isCompleted && (
                                    <button
                                        onClick={(e) => handleNavigateClick(e, delivery)}
                                        className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-gray-200 active:scale-95 transition-transform"
                                    >
                                        <Navigation className="w-4 h-4" />
                                        Navigate
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Finish Route Button */}
            {
                allCompleted && (
                    <div className="px-6 mt-8 mb-6">
                        <button
                            onClick={handleFinishClick}
                            className="w-full bg-accent-green text-accent-green-foreground hover:bg-green-200 py-6 rounded-[2.5rem] transition-all shadow-xl font-bold text-lg flex items-center justify-center gap-3"
                        >
                            <CheckCircle className="w-6 h-6" />
                            Finish Shift
                        </button>
                    </div>
                )
            }

            <TabBar currentTab="route" onNavigate={onNavigate} />

            {/* Navigation Modal */}
            {showNavigateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center px-6">
                    <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl">
                        <h3 className="text-xl font-bold font-heading mb-2 text-center">
                            Start Navigation
                        </h3>
                        <p className="text-gray-500 text-center mb-8 text-sm">
                            {selectedAddress?.address}
                        </p>

                        <div className="space-y-4 mb-6">
                            <button
                                onClick={openGoogleMaps}
                                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-900 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 font-semibold"
                            >
                                <MapPin className="w-5 h-5 text-red-500" />
                                Google Maps
                            </button>

                            <button
                                onClick={openWaze}
                                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-900 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 font-semibold"
                            >
                                <Navigation className="w-5 h-5 text-blue-500" />
                                Waze
                            </button>
                        </div>

                        <button
                            onClick={() => setShowNavigateModal(false)}
                            className="w-full text-gray-400 hover:text-gray-600 font-medium py-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div >
    );
}