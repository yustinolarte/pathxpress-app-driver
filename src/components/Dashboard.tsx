import { useState, useEffect } from 'react';
import { ScreenName, TabBar } from './TabBar';
import { ShiftTracker } from './ShiftTracker';
import { timeTracker, TimeTrackerState } from '../services/timeTracker';
import { networkService } from '../services/network';
import { offlineQueue } from '../services/offlineQueue';

interface DashboardProps {
    onNavigate: (screen: ScreenName) => void;
    routeData?: any;
    onStartRoute?: () => void;
    hasActiveRoute?: boolean;
    driverInfo?: any;
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
};

export function Dashboard({ onNavigate, routeData, onStartRoute, hasActiveRoute, driverInfo }: DashboardProps) {
    const [trackerState, setTrackerState] = useState<TimeTrackerState>(timeTracker.getState());

    useEffect(() => {
        const unsubscribe = timeTracker.subscribe(setTrackerState);
        return unsubscribe;
    }, []);

    const [isOnline, setIsOnline] = useState(networkService.isOnline());
    const [pendingSync, setPendingSync] = useState(offlineQueue.getQueueSize());

    useEffect(() => {
        const handleNetworkChange = (online: boolean) => {
            setIsOnline(online);
            if (online) {
                // Auto-sync when back online
                const token = localStorage.getItem('authToken');
                if (token && offlineQueue.getQueueSize() > 0) {
                    offlineQueue.processQueue(token).then(() => {
                        setPendingSync(offlineQueue.getQueueSize());
                    });
                }
            }
        };

        networkService.addListener(handleNetworkChange);

        // Poll queue size periodically just in case
        const interval = setInterval(() => {
            setPendingSync(offlineQueue.getQueueSize());
        }, 5000);

        return () => {
            networkService.removeListener(handleNetworkChange);
            clearInterval(interval);
        };
    }, []);

    const handleSync = async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            await offlineQueue.processQueue(token);
            setPendingSync(offlineQueue.getQueueSize());
        }
    };

    const isOnDuty = trackerState.isOnDuty;
    const hasRoute = hasActiveRoute && routeData;
    const routeId = routeData?.id || routeData?.routeId || 'N/A';
    // ... (rest of function)



    // Raw stops from API
    const stopsRaw = routeData?.stops || routeData?.deliveries || [];

    // Group by orderId to match RouteList's "Unified Package View"
    const ordersMap: Record<string, any[]> = {};
    stopsRaw.forEach((s: any) => {
        const key = s.orderId ? s.orderId.toString() : `-${s.id}`;
        if (!ordersMap[key]) ordersMap[key] = [];
        ordersMap[key].push(s);
    });

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

    // Count SDD and NDD
    const sddCount = stopsRaw.filter((s: any) => {
        const svc = s.serviceType?.toLowerCase() || '';
        const type = s.type || '';
        return svc.includes('same') || svc === 'sdd' || type === 'SDD';
    }).length;
    const nddCount = packageCount - sddCount;

    const completedStatuses = ['delivered', 'picked_up', 'returned', 'completed', 'failed', 'attempted', 'delivery_attempted', 'failed_delivery', 'on_hold'];
    const completedCount = groupedStops.filter((d: any) =>
        completedStatuses.includes(d.status?.toLowerCase()?.replace(' ', '_'))
    ).length;

    const progressPercent = packageCount > 0 ? (completedCount / packageCount) * 100 : 0;

    // COD calculation — only delivery stops pending
    const codTotal = stopsRaw
        ?.filter((d: any) => (d.codRequired || d.type === 'COD') &&
            d.status?.toLowerCase() === 'pending' &&
            (d.stopType === 'delivery' || d.type === 'delivery'))
        .reduce((sum: number, d: any) => sum + (Number(d.codAmount) || 0), 0) || 0;

    // Total COD for all deliveries (for progress denominator)
    const codTotalAll = stopsRaw
        ?.filter((d: any) => (d.codRequired || d.type === 'COD'))
        .reduce((sum: number, d: any) => sum + (Number(d.codAmount) || 0), 0) || 0;

    // COD Collected — only count strictly successful completions
    const codCollected = stopsRaw
        ?.filter((d: any) => (d.codRequired || d.type === 'COD') &&
            ['delivered', 'picked_up', 'completed'].includes(d.status?.toLowerCase()))
        .reduce((sum: number, d: any) => sum + (Number(d.codAmount) || 0), 0) || 0;

    const codPercent = codTotalAll > 0 ? (codCollected / codTotalAll) * 100 : 0;

    const zone = routeData?.zone || 'Not Assigned';
    const isRouteCompleted = packageCount > 0 && completedCount === packageCount;
    const isRouteStarted = completedCount > 0;

    // Next pending stop
    const nextStop = groupedStops.find((s: any) =>
        !completedStatuses.includes(s.status?.toLowerCase()?.replace(' ', '_'))
    );

    const handleButtonClick = () => {
        if (!hasRoute && onStartRoute) {
            if (!isOnDuty) timeTracker.clockIn();
            onStartRoute();
        } else {
            if (!isOnDuty) timeTracker.clockIn();
            onNavigate('route');
        }
    };

    let buttonText = 'Scan Route QR';
    let buttonIcon = 'qr_code_scanner';
    if (hasRoute) {
        if (isRouteCompleted) {
            buttonText = 'Route Completed';
            buttonIcon = 'check_circle';
        } else if (isRouteStarted) {
            buttonText = 'Continue Route';
            buttonIcon = 'play_arrow';
        } else {
            buttonText = 'Start Route';
            buttonIcon = 'play_arrow';
        }
    }
    const isButtonDisabled = hasRoute && isRouteCompleted;

    return (
        <div className="min-h-screen bg-background pb-28 font-sans">
            {/* Header */}
            <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-2">
                {/* Greeting + Status */}
                <div className="flex items-center justify-between mb-6">
                    <div
                        className="flex items-center gap-3 active:scale-95 transition-transform cursor-pointer"
                        onClick={() => onNavigate('profile')}
                    >
                        <div className="w-12 h-12 rounded-full bg-surface-dark border-2 border-primary/30 flex items-center justify-center overflow-hidden">
                            <span className="material-symbols-rounded text-2xl text-gray-400">person</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">{getGreeting()},</p>
                            <h2 className="text-lg font-bold text-foreground capitalize">
                                {driverInfo?.name || driverInfo?.username || driverInfo?.firstName || driverInfo?.first_name || 'Driver'}
                            </h2>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${isOnDuty
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-gray-700/50 text-gray-400 border-gray-600'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOnDuty ? 'bg-green-400' : 'bg-gray-500'}`} />
                        {isOnDuty ? 'On Duty' : 'Off Duty'}
                    </div>
                </div>

                {/* Offline Indicator */}
                {!isOnline && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-rounded text-red-500">wifi_off</span>
                            <p className="text-xs font-bold text-red-400">You are offline</p>
                        </div>
                        <p className="text-[10px] text-red-300">Actions will be saved locally</p>
                    </div>
                )}

                {/* Pending Sync Indicator */}
                {pendingSync > 0 && (
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-rounded text-orange-500">cloud_upload</span>
                            <p className="text-xs font-bold text-orange-400">{pendingSync} Pending Updates</p>
                        </div>
                        {isOnline && (
                            <button
                                onClick={handleSync}
                                className="px-3 py-1 bg-orange-500/20 rounded-lg text-[10px] font-bold text-orange-400 hover:bg-orange-500/30 transition-colors"
                            >
                                Sync Now
                            </button>
                        )}
                    </div>
                )}

                {/* Shift Tracker Card */}
                <ShiftTracker onClockOutAttempt={() => onNavigate('wallet')} />

                {/* KPI Summary Cards — 2 column grid */}
                <section className="grid grid-cols-2 gap-3 mt-5">
                    {/* Packages Card */}
                    <div className="bg-card rounded-xl p-4 border border-gray-800/50 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
                        <div className="relative z-10">
                            <p className="text-xs text-gray-400 font-medium mb-1">Total Packages</p>
                            <h2 className="text-3xl font-bold text-foreground">{packageCount}</h2>
                            <div className="mt-3 flex items-center gap-2 text-xs font-medium">
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    {sddCount} SDD
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 border border-gray-600">
                                    {nddCount} NDD
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* COD Card */}
                    <div className="bg-card rounded-xl p-4 border border-primary/30 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start">
                                    <p className="text-xs text-primary font-semibold mb-1">To Collect (COD)</p>
                                    <span className="material-symbols-rounded text-primary/80 text-lg">payments</span>
                                </div>
                                <h2 className="text-2xl font-bold text-primary mt-1">
                                    {codTotal.toLocaleString()} <span className="text-sm font-normal text-gray-500">AED</span>
                                </h2>
                            </div>
                            <div className="mt-3">
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${codPercent}%` }} />
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 text-right">{Math.round(codPercent)}% Collected</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Current Route Card */}
                {hasRoute && (
                    <section
                        className="mt-4 bg-card rounded-xl border border-gray-800/50 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                        onClick={() => onNavigate('route')}
                    >
                        {/* Route header */}
                        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-primary text-xl">route</span>
                                <span className="text-foreground font-semibold text-sm">Route #{routeId}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${isRouteCompleted
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-gray-700 text-gray-300'
                                }`}>
                                {isRouteCompleted ? 'Completed' : 'Active'}
                            </span>
                        </div>
                        {/* Map placeholder */}
                        <div className="mx-4 h-28 rounded-lg bg-surface-darker relative overflow-hidden mb-2">
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/50" />
                            {/* Grid pattern */}
                            <div className="absolute inset-0 opacity-10" style={{
                                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize: '30px 30px'
                            }} />
                            {/* Red dot for current location */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/50">
                                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-50" />
                            </div>
                            {/* ETA badge */}
                            <div className="absolute bottom-2 right-2 bg-surface-dark/90 backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-gray-700/50">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Est. Finish</p>
                                <p className="text-sm font-bold text-foreground">
                                    {new Date(Date.now() + 3600000 * (packageCount - completedCount) * 0.3).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                        {/* Next stop */}
                        {nextStop && (
                            <div className="px-4 pb-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">Next Stop</p>
                                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                        {nextStop.address || nextStop.customerName || 'N/A'}
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-primary text-xl">navigation</span>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Quick Actions */}
                <section className="grid grid-cols-2 gap-3 mt-5">
                    {/* Scan to Load */}
                    <button
                        onClick={() => {
                            if (hasRoute) {
                                onNavigate('load_scan');
                            } else if (onStartRoute) {
                                if (!isOnDuty) timeTracker.clockIn();
                                onStartRoute();
                            }
                        }}
                        className="bg-card rounded-xl p-5 border border-gray-800/50 text-center active:scale-95 transition-all hover:border-gray-600"
                    >
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-surface-darker flex items-center justify-center">
                            <span className="material-symbols-rounded text-2xl text-gray-300">qr_code_scanner</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{hasRoute ? 'Scan to Load' : 'Scan Route'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{hasRoute ? 'Verify Packages' : 'Get Manifest'}</p>
                    </button>

                    {/* Start/Continue Route */}
                    <button
                        onClick={handleButtonClick}
                        disabled={isButtonDisabled}
                        className={`rounded-xl p-5 text-center active:scale-95 transition-all ${isButtonDisabled
                            ? 'bg-gray-800 opacity-50 cursor-not-allowed'
                            : 'bg-primary hover:bg-red-700'
                            }`}
                    >
                        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/20 flex items-center justify-center">
                            <span className="material-symbols-rounded text-2xl text-white">{buttonIcon}</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{buttonText}</p>
                        <p className="text-xs text-white/70 mt-0.5">
                            {hasRoute ? `${completedCount}/${packageCount} Done` : 'Begin Deliveries'}
                        </p>
                    </button>
                </section>

                {/* Route Progress Bar */}
                {hasRoute && (
                    <div className="mt-5 bg-card rounded-xl p-4 border border-gray-800/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Route Progress</span>
                            <span className="text-xs text-gray-300 font-bold">{completedCount}/{packageCount}</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                            <span>{zone}</span>
                            <span>{Math.round(progressPercent)}%</span>
                        </div>
                    </div>
                )}

                {/* Updates */}
                <section className="mt-5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Updates</h3>
                    <div className="space-y-2">
                        {hasRoute && codTotal > 2000 && (
                            <div className="bg-card rounded-xl p-4 border border-gray-800/50 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-rounded text-primary text-sm">warning</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">COD Limit Near</p>
                                    <p className="text-xs text-gray-400 mt-0.5">You are approaching your cash limit. Please deposit soon.</p>
                                </div>
                                <span className="text-[10px] text-gray-600 whitespace-nowrap">Now</span>
                            </div>
                        )}
                        {!hasRoute && (
                            <div className="bg-card rounded-xl p-4 border border-gray-800/50 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-rounded text-blue-400 text-sm">info</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">No Active Route</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Scan a route QR code to load your deliveries for today.</p>
                                </div>
                            </div>
                        )}
                        {hasRoute && completedCount > 0 && (
                            <div className="bg-card rounded-xl p-4 border border-gray-800/50 flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-rounded text-green-400 text-sm">check_circle</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Progress Update</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{completedCount} of {packageCount} stops completed. Keep going!</p>
                                </div>
                                <span className="text-[10px] text-gray-600 whitespace-nowrap">Just now</span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            <TabBar currentTab="home" onNavigate={onNavigate} disabled={!isOnDuty} hasRoute={!!hasRoute} />
        </div>
    );
}