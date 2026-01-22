import { Package, TrendingUp, Truck, Wallet, Settings, Clock, MapPin, QrCode } from 'lucide-react';
import { TabBar } from './TabBar';
import { ShiftTracker } from './ShiftTracker';
import { useState, useEffect } from 'react';
import { timeTracker, TimeTrackerState } from '../services/timeTracker';

interface DashboardProps {
    onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
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

    const packageCount = routeData?.deliveries?.length || 0;
    const routeId = routeData?.id || routeData?.routeId || 'No Route';

    // Count pickups and deliveries separately
    const stops = routeData?.stops || routeData?.deliveries || [];
    const pickupCount = stops.filter((s: any) => s.stopType === 'pickup').length;
    const deliveryCount = stops.filter((s: any) => s.stopType === 'delivery' || !s.stopType).length;

    const completedCount = stops.filter((d: any) =>
        ['DELIVERED', 'PICKED_UP', 'RETURNED', 'COMPLETED', 'completed', 'Delivered', 'Returned', 'Picked Up'].includes(d.status)
    ).length || 0;

    const progressPercent = stops.length > 0 ? (completedCount / stops.length) * 100 : 0;
    const codTotal = stops
        ?.filter((d: any) => d.codRequired && d.status?.toLowerCase() === 'pending')
        .reduce((sum: number, d: any) => sum + (Number(d.codAmount) || 0), 0) || 0;

    const zone = routeData?.zone || 'Not Assigned';
    const vehicle = routeData?.vehicleInfo || 'Not Assigned';

    const isRouteCompleted = stops.length > 0 && completedCount === stops.length;
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