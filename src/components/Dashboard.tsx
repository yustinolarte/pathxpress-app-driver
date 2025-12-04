import { Package, TrendingUp, Truck, Wallet, Settings } from 'lucide-react';
import { TabBar } from './TabBar';
import { useState } from 'react';

interface DashboardProps {
    onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'issue' | 'profile' | 'settings') => void;
    routeData?: any;
}

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
};

export function Dashboard({ onNavigate, routeData }: DashboardProps) {
    const [isOnDuty, setIsOnDuty] = useState(true);

    // Use routeData if available, otherwise fallback to defaults (or empty state)
    const packageCount = routeData?.deliveries?.length || 0;
    const routeId = routeData?.id || routeData?.routeId || 'No Route'; // Handle both id and routeId

    // Fix: Check for backend statuses (DELIVERED, RETURNED) and legacy 'completed'
    const completedCount = routeData?.deliveries?.filter((d: any) =>
        ['DELIVERED', 'RETURNED', 'COMPLETED', 'completed', 'Delivered', 'Returned'].includes(d.status)
    ).length || 0;

    // Calculate progress percentage
    const progressPercent = packageCount > 0 ? (completedCount / packageCount) * 100 : 0;

    // Calculate real COD total from routeData
    const codTotal = routeData?.deliveries
        ?.filter((d: any) => d.type === 'COD' && d.status === 'PENDING')
        .reduce((sum: number, d: any) => sum + (Number(d.codAmount) || 0), 0) || 0;

    // Get Zone and Vehicle from routeData
    const zone = routeData?.zone || 'Not Assigned';
    const vehicle = routeData?.vehicleInfo || 'Not Assigned';

    // Determine button text and state
    const isRouteCompleted = packageCount > 0 && completedCount === packageCount;
    const isRouteStarted = completedCount > 0; // Or if the user has clicked start

    let buttonText = 'START ROUTE';
    let isButtonDisabled = !isOnDuty;

    if (!isOnDuty) {
        buttonText = 'OFF DUTY';
    } else if (isRouteCompleted) {
        buttonText = 'ROUTE COMPLETED';
        isButtonDisabled = true;
    } else if (isRouteStarted) {
        buttonText = `CONTINUE ROUTE (${completedCount}/${packageCount})`;
        isButtonDisabled = false; // Enable so user can go back to route list
    }

    const handleStartRoute = () => {
        onNavigate('route');
        // In a real app, you might want to save a "started" state here
    };

    return (
        <div className="min-h-screen bg-[#0a1128] pb-32">
            {/* Header */}
            <div className="bg-[#050505] px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="text-[#555555] mb-1">{getGreeting()}</div>
                        <h2 className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>Hi, Driver</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => onNavigate('settings')}
                            className="w-12 h-12 rounded-full bg-[#0a1128]/60 backdrop-blur-sm border border-[#555555]/20 flex items-center justify-center text-[#f2f4f8] hover:border-[#e10600]/50 transition-all"
                        >
                            <Settings className="w-5 h-5" />
                        </button>
                        <div className="w-12 h-12 rounded-full bg-[#e10600] flex items-center justify-center text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            DR
                        </div>
                    </div>
                </div>

                {/* ON DUTY Toggle */}
                <div className="flex items-center justify-between bg-[#0a1128]/60 backdrop-blur-sm rounded-2xl p-4 border border-[#555555]/20">
                    <span className="text-[#f2f4f8]">Status</span>
                    <div className="flex items-center gap-3">
                        <span className={`${isOnDuty ? 'text-[#00c853]' : 'text-[#555555]'}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                        </span>
                        <div
                            onClick={() => setIsOnDuty(!isOnDuty)}
                            className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors ${isOnDuty ? 'bg-[#e10600]' : 'bg-[#555555]'}`}
                        >
                            <div className={`absolute top-1 w-5 h-5 bg-[#f2f4f8] rounded-full shadow-md transition-all ${isOnDuty ? 'right-1' : 'left-1'}`}></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={`px-6 pt-6 space-y-4 transition-opacity duration-300 ${!isOnDuty ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                {/* Today's Route Card */}
                <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Package className="w-5 h-5 text-[#e10600]" />
                        <span className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>Today's Route: {routeId}</span>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2.5rem', lineHeight: '1' }}>{packageCount}</span>
                                <span className="text-[#555555] pb-2">packages assigned</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[#555555]">
                                    <span>Progress</span>
                                    <span>{completedCount}/{packageCount}</span>
                                </div>
                                <div className="w-full h-2 bg-[#0a1128] rounded-full overflow-hidden">
                                    <div className="h-full bg-[#e10600]" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="bg-[#050505]/60 backdrop-blur-sm border border-[#555555]/20 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#e10600]/20 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-5 h-5 text-[#e10600]" />
                            </div>
                            <div>
                                <div className="text-[#555555]">Zone</div>
                                <div className="text-[#f2f4f8]">{zone}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#e10600]/20 rounded-xl flex items-center justify-center">
                                <Truck className="w-5 h-5 text-[#e10600]" />
                            </div>
                            <div>
                                <div className="text-[#555555]">Vehicle</div>
                                <div className="text-[#f2f4f8]">{vehicle}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#e10600]/20 rounded-xl flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-[#e10600]" />
                            </div>
                            <div>
                                <div className="text-[#555555]">Pending COD Total</div>
                                <div className="text-[#f2f4f8]" style={{ fontFamily: 'Poppins, sans-serif' }}>{codTotal.toFixed(2)} AED</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Start Route Button */}
                <button
                    onClick={handleStartRoute}
                    disabled={isButtonDisabled}
                    className={`w-full py-5 rounded-2xl transition-all shadow-lg ${!isButtonDisabled
                        ? 'bg-[#e10600] hover:bg-[#c10500] text-[#f2f4f8] shadow-[#e10600]/30'
                        : 'bg-[#555555]/20 text-[#555555] cursor-not-allowed shadow-none'
                        }`}
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                    {buttonText}
                </button>
            </div>

            <TabBar currentTab="home" onNavigate={onNavigate} disabled={!isOnDuty} />
        </div>
    );
}