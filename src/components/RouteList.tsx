import { ArrowLeft, Navigation, Settings, MapPin, Truck, Wallet, CheckCircle, Package, Clock, Phone, Map, List } from 'lucide-react';
import { api } from '../services/api';
import { TabBar } from './TabBar';
import { RouteMap } from './RouteMap';
import { useState } from 'react';

interface RouteListProps {
    onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
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
    const [filter, setFilter] = useState<'All' | 'Pending' | 'COD' | 'Returns'>('All');
    const [showNavigateModal, setShowNavigateModal] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState<{ address: string; lat: number; lng: number } | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    const deliveries = routeData?.deliveries?.map((d: any) => ({
        id: d.id,
        name: d.customerName || 'Unknown Customer',
        address: d.address || 'No Address',
        distance: '0.0 km',
        status: d.status === 'pending' ? 'Pending' : d.status === 'completed' ? 'Delivered' : d.status,
        type: d.codAmount ? 'COD' : 'Prepaid',
        cod: d.codAmount ? `${d.codAmount} AED` : null,
        lat: d.latitude || d.coordinates?.lat || 0,
        lng: d.longitude || d.coordinates?.lng || 0
    })) || defaultDeliveries;

    const filteredDeliveries = deliveries.filter((delivery: any) => {
        if (filter === 'All') return true;
        if (filter === 'Pending') return delivery.status === 'Pending';
        if (filter === 'COD') return delivery.type === 'COD';
        if (filter === 'Returns') return delivery.type === 'Return';
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
        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedAddress.lat},${selectedAddress.lng}`;
        window.open(url, '_blank');
        setShowNavigateModal(false);
    };

    const openWaze = () => {
        if (!selectedAddress) return;
        const url = `https://waze.com/ul?ll=${selectedAddress.lat},${selectedAddress.lng}&navigate=yes`;
        window.open(url, '_blank');
        setShowNavigateModal(false);
    };

    // Sort logic
    const sortedDeliveries = [...filteredDeliveries].sort((a: any, b: any) => {
        const statusOrder: Record<string, number> = {
            'Pending': 1,
            'Attempted': 2,
            'Delivered': 3,
            'Returned': 3,
            'Cancelled': 3
        };
        const orderA = statusOrder[a.status] || 4;
        const orderB = statusOrder[b.status] || 4;
        return orderA - orderB;
    });

    const allCompleted = deliveries.every((d: any) =>
        ['Delivered', 'Returned', 'Cancelled', 'Attempted'].includes(d.status)
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

    const handleNavigateExternal = (lat: number, lng: number) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
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
                    {(['All', 'Pending', 'COD', 'Returns'] as const).map((filterOption) => (
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
                    const isCompleted = ['Delivered', 'Returned', 'Cancelled'].includes(delivery.status);

                    // Style logic based on card type in image
                    const isCOD = delivery.type === 'COD';
                    const isReturn = delivery.type === 'Return';

                    let accentColor = 'bg-accent-purple';
                    let accentText = 'text-accent-purple-foreground';

                    if (isCOD) {
                        accentColor = 'bg-accent-green';
                        accentText = 'text-accent-green-foreground';
                    }
                    if (isReturn) {
                        accentColor = 'bg-orange-100';
                        accentText = 'text-orange-700';
                    }

                    return (
                        <div
                            key={delivery.id}
                            onClick={() => !isCompleted && onSelectDelivery(delivery.id)}
                            className={`relative bg-white rounded-[2rem] p-6 transition-all border border-gray-100 shadow-sm hover:shadow-md ${isCompleted ? 'opacity-60 grayscale' : ''}`}
                        >
                            {/* Card Header: Type Badge & Logic */}
                            <div className={`absolute top-6 right-6 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${accentColor} ${accentText}`}>
                                {delivery.type === 'COD' ? `COD: ${delivery.cod}` : delivery.type}
                            </div>

                            {/* Main Info */}
                            <div className="mb-4 pr-24"> {/* Padding right to avoid overlap with badge */}
                                <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    {isReturn ? "Pick Up" : "Drop Off"} #{delivery.id}
                                </span>
                                <h3 className="text-xl font-bold font-heading text-gray-900 mb-1 leading-tight">
                                    {delivery.address}
                                </h3>
                                <p className="text-gray-500 font-medium text-sm flex items-center gap-2">
                                    <span className='w-1.5 h-1.5 rounded-full bg-gray-300'></span>
                                    {delivery.name}
                                    <span className='w-1.5 h-1.5 rounded-full bg-gray-300'></span>
                                    {delivery.distance}
                                </p>
                            </div>

                            {/* Actions / Status */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${delivery.status === 'Pending' ? 'bg-yellow-400' : 'bg-green-500'}`}></div>
                                    <span className="text-sm font-semibold text-gray-700">{delivery.status}</span>
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