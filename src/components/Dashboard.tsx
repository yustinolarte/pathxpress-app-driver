import { Package, TrendingUp, Truck, Wallet, Settings, Clock, MapPin, QrCode } from 'lucide-react';
import { TabBar } from './TabBar';
import { ShiftTracker } from './ShiftTracker';
import { useState, useEffect } from 'react';
import { timeTracker, TimeTrackerState } from '../services/timeTracker';

interface DashboardProps {
    onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'profile' | 'settings') => void;
    routeData?: any;
    onStartRoute?: () => void; // Called to start route scanning
    hasActiveRoute?: boolean; // True if route is scanned and inspection complete
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
};

export function Dashboard({ onNavigate, routeData, onStartRoute, hasActiveRoute }: DashboardProps) {
    const [trackerState, setTrackerState] = useState<TimeTrackerState>(timeTracker.getState());

    useEffect(() => {
        const unsubscribe = timeTracker.subscribe(setTrackerState);
        return unsubscribe;
    }, []);

    const isOnDuty = trackerState.isOnDuty;

    // Check if we have an active route
    const hasRoute = hasActiveRoute && routeData;

    const routeId = routeData?.id || routeData?.routeId || 'No Route';

    // Raw stops from API
    const stopsRaw = routeData?.stops || routeData?.deliveries || [];

    // Group by orderId to match RouteList's "Unified Package View"
    // Each order = 1 task for the driver, regardless of pickup+delivery stops
    const ordersMap: Record<string, any[]> = {};
    stopsRaw.forEach((s: any) => {
        const key = s.orderId ? s.orderId.toString() : `-${s.id}`;
        if (!ordersMap[key]) ordersMap[key] = [];
        ordersMap[key].push(s);
    });

    // For each order group, determine the "active" stop (same logic as RouteList)
    const groupedStops = Object.values(ordersMap).map((orderStops: any[]) => {
        if (orderStops.length === 1) return orderStops[0];

        const pickup = orderStops.find((s: any) => s.stopType === 'pickup' || s.type === 'pickup');
        const delivery = orderStops.find((s: any) => s.stopType === 'delivery' || s.type === 'delivery');

        if (pickup && delivery) {
            const pickupStatus = pickup.status?.toLowerCase().replace(' ', '_');
            const isPickupDone = ['picked_up'].includes(pickupStatus);
            if (!isPickupDone) return pickup;
            return delivery;
        }
        return orderStops[0];
    });

    const packageCount = groupedStops.length;

    // Count pickups and deliveries from raw stops
    const pickupCount = stopsRaw.filter((s: any) => s.stopType === 'pickup').length;
    const deliveryCount = stopsRaw.filter((s: any) => s.stopType === 'delivery' || !s.stopType).length;

    // Count completed based on the grouped (visible) stops
    const completedStatuses = ['delivered', 'picked_up', 'returned', 'completed', 'failed', 'attempted', 'delivery_attempted', 'failed_delivery', 'on_hold'];
    const completedCount = groupedStops.filter((d: any) =>
        completedStatuses.includes(d.status?.toLowerCase()?.replace(' ', '_'))
    ).length;

    const progressPercent = packageCount > 0 ? (completedCount / packageCount) * 100 : 0;

    // Only sum COD for DELIVERY stops to avoid double counting
    const codTotal = stopsRaw
        ?.filter((d: any) => (d.codRequired || d.type === 'COD') &&
            d.status?.toLowerCase() === 'pending' &&
            (d.stopType === 'delivery' || d.type === 'delivery'))
        .reduce((sum: number, d: any) => sum + (Number(d.codAmount) || 0), 0) || 0;

    const zone = routeData?.zone || 'Not Assigned';
    const vehicle = routeData?.vehicleInfo || 'Not Assigned';

    const isRouteCompleted = packageCount > 0 && completedCount === packageCount;
    const isRouteStarted = completedCount > 0;

    const handleButtonClick = () => {
        if (!hasRoute && onStartRoute) {
            // No route - start route scanning
            if (!isOnDuty) {
                timeTracker.clockIn();
            }
            onStartRoute();
        } else {
            // Has route - continue to route list
            if (!isOnDuty) {
                timeTracker.clockIn();
            }
            onNavigate('route');
        }
    };

    // Determine button text
    let buttonText = 'Scan Route QR';
    let showQrIcon = true;
    if (hasRoute) {
        showQrIcon = false;
        if (isRouteCompleted) {
            buttonText = 'Route Completed';
        } else if (isRouteStarted) {
            buttonText = 'Continue Route';
        } else {
            buttonText = 'Start Route';
        }
    }

    const isButtonDisabled = hasRoute && isRouteCompleted;

    return (
        <div className="min-h-screen bg-background pb-32 font-sans">
            {/* Header Section */}
            <div className="px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-2">
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => onNavigate('settings')} className='p-2 hover:bg-white rounded-full transition-colors'>
                        <Settings className="w-6 h-6 text-gray-800" />
                    </button>
                    <h2 className="text-xl font-bold font-heading">My shift</h2>
                    <span className="text-gray-400 font-medium">10 AM - 7 PM</span>
                </div>

                {/* Shift Tracker Card */}
                <ShiftTracker />

                {/* Route Info Section */}
                <div className="space-y-4 mt-6">

                    {/* Progress Card (Drop Off style) */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Route Progress</span>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-3xl font-bold font-heading text-gray-900">{completedCount}</span>
                                    <span className="text-gray-400 font-medium">/ {packageCount}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-2xl">
                                <TrendingUp className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>

                    {/* COD Info (Clean white card) */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="bg-gray-50 p-3 rounded-2xl">
                                <Wallet className="w-6 h-6 text-gray-800" />
                            </div>
                            <div>
                                <h4 className="font-bold font-heading text-gray-900">Cash to Collect</h4>
                                <p className="text-gray-500 text-sm">Pending COD</p>
                            </div>
                        </div>
                        <span className="text-xl font-bold font-heading text-gray-900">AED {codTotal}</span>
                    </div>

                    {/* Vehicle Info (Clean white card) */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="bg-gray-50 p-3 rounded-2xl">
                            <Truck className="w-6 h-6 text-gray-800" />
                        </div>
                        <div>
                            <h4 className="font-bold font-heading text-gray-900">Vehicle</h4>
                            <p className="text-gray-500 text-sm">{vehicle}</p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Action Button - Elevated to avoid overlap */}
            <div className="fixed bottom-[calc(7rem+env(safe-area-inset-bottom))] left-0 right-0 px-6 z-30">
                <button
                    onClick={handleButtonClick}
                    disabled={isButtonDisabled}
                    className={`w-full py-5 rounded-[2rem] font-bold text-lg shadow-xl transition-all flex items-center justify-center ${!isButtonDisabled
                        ? 'bg-primary text-white hover:bg-black/90'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {showQrIcon && <QrCode className="w-6 h-6 mr-2" />}
                    {buttonText}
                </button>
            </div>

            <TabBar currentTab="home" onNavigate={onNavigate} disabled={!isOnDuty} hasRoute={!!hasRoute} />
        </div>
    );
}