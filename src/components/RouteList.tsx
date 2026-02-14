import { api } from '../services/api';
import { ScreenName, TabBar } from './TabBar';
import { RouteMap } from './RouteMap';
import { useState } from 'react';

interface RouteListProps {
    onNavigate: (screen: ScreenName) => void;
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

    // Group by orderId — Unified Package View
    const stopsRaw = (routeData?.stops || routeData?.deliveries || []);
    const ordersMap: Record<string, any[]> = {};
    stopsRaw.forEach((s: any) => {
        const key = s.orderId ? s.orderId.toString() : `-${s.id}`;
        if (!ordersMap[key]) ordersMap[key] = [];
        ordersMap[key].push(s);
    });

    const deliveries = Object.values(ordersMap).map((orderStops: any) => {
        const stops = orderStops as any[];
        if (stops.length === 1) return stops[0];
        const pickup = stops.find((s: any) => s.stopType === 'pickup' || s.type === 'pickup');
        const delivery = stops.find((s: any) => s.stopType === 'delivery' || s.type === 'delivery');
        if (pickup && delivery) {
            const status = pickup.status?.toLowerCase().replace(' ', '_');
            if (!['picked_up'].includes(status)) return pickup;
            return delivery;
        }
        return orderStops[0];
    }).map((d: any) => ({
        id: d.id,
        orderId: d.orderId,
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
        codAmount: Number(d.codAmount) || 0,
        lat: d.latitude || d.coordinates?.lat || 0,
        lng: d.longitude || d.coordinates?.lng || 0,
        stopType: d.stopType || 'delivery',
        isDisabled: d.isDisabled || false,
        waybillNumber: d.waybillNumber || d.packageRef,
        contactPhone: d.contactPhone || d.customerPhone,
        serviceType: d.serviceType || (d.type === 'SDD' ? 'SDD' : 'NDD'),
        specialInstructions: d.specialInstructions || d.notes,
    })) || defaultDeliveries.map(d => ({ ...d, specialInstructions: '' }));

    const filteredDeliveries = deliveries.filter((delivery: any) => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return delivery.status === 'Pending';
        if (filter === 'COD') return delivery.type === 'COD';
        if (filter === 'Pickups') return delivery.stopType === 'pickup';
        return true;
    });

    const handleNavigateClick = (e: React.MouseEvent, delivery: any) => {
        e.stopPropagation();
        setSelectedAddress({ address: delivery.address, lat: delivery.lat, lng: delivery.lng });
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

    // Sort: pending first, completed second, on_hold/attempted last
    const sortedDeliveries = [...filteredDeliveries].sort((a: any, b: any) => {
        const statusOrder: Record<string, number> = {
            'Pending': 1, 'Delivered': 2, 'Picked Up': 2, 'Returned': 2,
            'Failed': 2, 'Cancelled': 2, 'On Hold': 3, 'Attempted': 3,
        };
        return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
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

    const mapStops = deliveries.map((d: any) => ({
        id: d.id, name: d.name, address: d.address, lat: d.lat, lng: d.lng, status: d.status, type: d.type, cod: d.cod,
        specialInstructions: d.specialInstructions
    }));

    const handleNavigateExternal = (lat: number, lng: number, address?: string) => {
        const hasCoords = lat && lng && lat !== 0 && lng !== 0;
        const url = hasCoords
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address || 'Unknown')}`;
        window.open(url, '_blank');
    };

    // Stats
    const routeId = routeData?.id || routeData?.routeId || 'N/A';
    const pendingCount = deliveries.filter((d: any) => d.status === 'Pending').length;
    const totalCOD = deliveries.filter((d: any) => d.type === 'COD' && d.status === 'Pending').reduce((sum: number, d: any) => sum + d.codAmount, 0);
    const urgentCount = deliveries.filter((d: any) => d.serviceType === 'SDD' && d.status === 'Pending').length;

    // Separate SDD (priority) and NDD (standard) for display
    const sddDeliveries = sortedDeliveries.filter((d: any) => d.serviceType === 'SDD');
    const nddDeliveries = sortedDeliveries.filter((d: any) => d.serviceType !== 'SDD');

    // If map view
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
        <div className="min-h-screen bg-background pb-28 font-sans">
            {/* Header */}
            <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-3 bg-background z-10 sticky top-0">
                <div className="flex items-center justify-between mb-1">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Today's Route</h1>
                        <p className="text-xs text-gray-500 mt-0.5">Route #{routeId} • {pendingCount} Stops Remaining</p>
                    </div>
                    <div
                        onClick={() => onNavigate('profile')}
                        className="w-10 h-10 rounded-full bg-surface-dark border border-gray-700/50 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
                    >
                        <span className="material-symbols-rounded text-gray-400 text-xl">person</span>
                    </div>
                </div>

                {/* List / Map Toggle */}
                <div className="flex items-center justify-between mt-4 mb-3">
                    <div className="flex bg-surface-dark rounded-xl p-1 border border-gray-800/50">
                        <button
                            onClick={() => setViewMode('list')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all bg-primary text-white result-list-view"
                        >
                            <span className="material-symbols-rounded text-base">format_list_bulleted</span>
                            List
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all text-gray-400 result-map-view"
                        >
                            <span className="material-symbols-rounded text-base">map</span>
                            Map
                        </button>
                    </div>
                    {/* Filter button - Horizontal Scroll */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
                        {(['All', 'Pending', 'COD', 'Pickups'] as const).map((fo) => (
                            <button
                                key={fo}
                                onClick={() => setFilter(fo)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${filter === fo ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-500 border border-gray-800/50'
                                    }`}
                            >
                                {fo}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Stats Row */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                    <div className="bg-surface-dark rounded-xl px-4 py-3 border border-gray-800/50 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Total COD</p>
                            <p className="text-lg font-bold text-foreground">AED {totalCOD.toLocaleString()}</p>
                        </div>
                        <span className="material-symbols-rounded text-green-500 text-2xl">payments</span>
                    </div>
                    <div className="bg-surface-dark rounded-xl px-4 py-3 border border-primary/20 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Urgent</p>
                            <p className="text-lg font-bold text-primary">{urgentCount > 0 ? `${urgentCount} Stops` : 'None'}</p>
                        </div>
                        <span className="material-symbols-rounded text-primary text-2xl">priority_high</span>
                    </div>
                </div>
            </div>

            {/* Delivery List with Priority Sections */}
            <div className="px-5 pt-3 space-y-3">
                {/* SDD Priority Section */}
                {sddDeliveries.length > 0 && (
                    <>
                        <div className="flex items-center gap-2 pt-2">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Priority (SDD)</span>
                            <div className="flex-1 h-px bg-primary/20" />
                        </div>
                        {sddDeliveries.map((delivery: any) => renderDeliveryCard(delivery, true))}
                    </>
                )}

                {/* NDD Standard Section */}
                {nddDeliveries.length > 0 && (
                    <>
                        <div className="flex items-center gap-2 pt-3">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Standard (NDD)</span>
                            <div className="flex-1 h-px bg-gray-800" />
                        </div>
                        {nddDeliveries.map((delivery: any) => renderDeliveryCard(delivery, false))}
                    </>
                )}

                {/* If no SDD/NDD distinction, just show all */}
                {sddDeliveries.length === 0 && nddDeliveries.length === 0 && (
                    sortedDeliveries.map((delivery: any) => renderDeliveryCard(delivery, false))
                )}
            </div>

            {/* Finish Route Button */}
            {
                allCompleted && (
                    <div className="px-5 mt-6 mb-6">
                        <button
                            onClick={handleFinishClick}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl transition-all font-bold text-base flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-rounded">check_circle</span>
                            Finish Route
                        </button>
                    </div>
                )
            }

            {/* Optimize Route FAB - High Z-Index to stay above TabBar */}
            {
                !allCompleted && (
                    <div className="fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] left-0 right-0 z-[60] flex justify-center pointer-events-none">
                        <div className="w-full max-w-md relative pr-5">
                            <button className="absolute right-5 bg-primary text-white px-5 py-3 rounded-full shadow-lg shadow-red-900/40 flex items-center gap-2 active:scale-95 transition-transform font-semibold text-sm pointer-events-auto ring-2 ring-background">
                                <span className="material-symbols-rounded text-xl">auto_fix_high</span>
                                Optimize Route
                            </button>
                        </div>
                    </div>
                )
            }

            <TabBar currentTab="route" onNavigate={onNavigate} />

            {/* Navigation Modal */}
            {
                showNavigateModal && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center px-5">
                        <div className="w-full max-w-md bg-surface-dark rounded-2xl p-6 border border-gray-800">
                            <h3 className="text-lg font-bold text-foreground mb-1 text-center">Start Navigation</h3>
                            <p className="text-gray-500 text-center mb-6 text-sm">{selectedAddress?.address}</p>

                            <div className="space-y-3 mb-4">
                                <button
                                    onClick={openGoogleMaps}
                                    className="w-full bg-surface-darker hover:bg-gray-800 border border-gray-700 text-foreground py-4 rounded-xl transition-all flex items-center justify-center gap-3 font-semibold"
                                >
                                    <span className="material-symbols-rounded text-red-500">location_on</span>
                                    Google Maps
                                </button>
                                <button
                                    onClick={openWaze}
                                    className="w-full bg-surface-darker hover:bg-gray-800 border border-gray-700 text-foreground py-4 rounded-xl transition-all flex items-center justify-center gap-3 font-semibold"
                                >
                                    <span className="material-symbols-rounded text-blue-500">navigation</span>
                                    Waze
                                </button>
                            </div>

                            <button
                                onClick={() => setShowNavigateModal(false)}
                                className="w-full text-gray-500 hover:text-gray-300 font-medium py-2"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );

    function renderDeliveryCard(delivery: any, isSDD: boolean) {
        const isCompleted = ['Delivered', 'Returned', 'Cancelled', 'Picked Up', 'Failed'].includes(delivery.status);
        const isDisabled = delivery.isDisabled && !isCompleted;
        const isPickup = delivery.stopType === 'pickup';
        const isCOD = delivery.type === 'COD';
        const isPrepaid = delivery.type === 'Prepaid';
        const hasNotes = !!delivery.specialInstructions;

        const completedStyle = isCompleted ? 'opacity-50' : '';
        const disabledStyle = isDisabled ? 'opacity-40 pointer-events-none' : '';

        // Left border color: red for SDD, gray for NDD, orange for pickup
        const borderColor = isPickup ? 'border-l-orange-500' : (isSDD ? 'border-l-primary' : 'border-l-gray-600');

        return (
            <div
                key={delivery.id}
                onClick={() => !isCompleted && !isDisabled && onSelectDelivery(delivery.id)}
                className={`bg-card rounded-xl p-4 border border-gray-800/50 border-l-4 ${borderColor} relative transition-all active:scale-[0.98] cursor-pointer ${completedStyle} ${disabledStyle}`}
            >
                {/* Disabled overlay */}
                {isDisabled && (
                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center z-10">
                        <div className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                            <span className="material-symbols-rounded text-sm">lock</span>
                            Complete pickup first
                        </div>
                    </div>
                )}

                {/* Top row: badges + COD */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {isSDD && (
                            <span className="px-2 py-0.5 rounded bg-primary text-white text-[10px] font-bold">SDD</span>
                        )}
                        {!isSDD && !isPickup && (
                            <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300 text-[10px] font-bold">NDD</span>
                        )}
                        {isPickup && (
                            <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[10px] font-bold">PICKUP</span>
                        )}
                        {isPrepaid && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 text-green-400 text-[10px] font-medium">
                                <span className="material-symbols-rounded text-xs">check_circle</span>
                                Paid Online
                            </span>
                        )}
                    </div>
                    {isCOD && delivery.cod && (
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 uppercase">Cash on Delivery</p>
                            <p className="text-sm font-bold text-foreground">{delivery.cod}</p>
                        </div>
                    )}
                </div>

                {/* Customer name + address */}
                <h3 className="text-base font-bold text-foreground mb-0.5">{delivery.name}</h3>
                <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                    <span className="material-symbols-rounded text-sm text-gray-600">location_on</span>
                    {delivery.address}
                </p>

                {/* Special Instructions Indicator */}
                {hasNotes && !isCompleted && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2.5 mb-3 flex items-start gap-2">
                        <span className="material-symbols-rounded text-yellow-500 text-base">info</span>
                        <div className="flex-1">
                            <p className="text-[10px] text-yellow-500/80 font-bold uppercase tracking-wide">Note</p>
                            <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">{delivery.specialInstructions}</p>
                        </div>
                    </div>
                )}

                {/* Bottom: status + navigate */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${delivery.status === 'Pending' ? 'bg-yellow-400' :
                            delivery.status === 'On Hold' ? 'bg-amber-500' :
                                delivery.status === 'Attempted' ? 'bg-orange-400' :
                                    delivery.status === 'Failed' ? 'bg-red-500' :
                                        'bg-green-500'
                            }`} />
                        <span className="text-xs text-gray-400 font-medium">{delivery.status}</span>
                        {delivery.waybillNumber && (
                            <span className="text-[10px] text-gray-600 ml-2">{delivery.waybillNumber}</span>
                        )}
                    </div>

                    {!isCompleted && (
                        <button
                            onClick={(e) => handleNavigateClick(e, delivery)}
                            className="w-9 h-9 rounded-full bg-primary flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-red-900/30"
                        >
                            <span className="material-symbols-rounded text-white text-lg">navigation</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }
}