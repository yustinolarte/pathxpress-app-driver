import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { timeTracker } from '../services/timeTracker';
import { ScreenName, TabBar } from './TabBar';

interface DriverWalletProps {
    onNavigate: (screen: ScreenName) => void;
    authToken: string;
    onLogout: () => void;
    routeData?: any; // New prop
}

interface WalletSummary {
    totalExpected: number;
    totalCollected: number;
    discrepancy: number;
    orders: Array<{
        id: number;
        waybillNumber: string;
        customerName: string;
        expectedAmount: number;
        collectedAmount: number;
        status: string;
        isDelivered: boolean;
    }>;
}

export function DriverWallet({ onNavigate, authToken, onLogout, routeData }: DriverWalletProps) {
    const [summary, setSummary] = useState<WalletSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEndingShift, setIsEndingShift] = useState(false);

    useEffect(() => { loadSummary(); }, [routeData]); // Reload if routeData changes

    const loadSummary = async () => {
        try {
            setLoading(true);

            // Priority 1: Use local routeData if available (Matches Dashboard)
            if (routeData) {
                const stops = routeData.stops || routeData.deliveries || [];
                let totalExpected = 0;
                let totalCollected = 0;
                let orders: any[] = [];

                stops.forEach((d: any) => {
                    const amount = Number(d.codAmount || 0);
                    if (amount > 0) {
                        totalExpected += amount;
                        // Check status loosely to match Dashboard logic
                        const status = d.status?.toLowerCase();
                        const isDelivered = status === 'delivered' || status === 'picked_up' || status === 'completed';
                        const collected = isDelivered ? amount : 0;
                        totalCollected += collected;

                        orders.push({
                            id: d.id,
                            waybillNumber: d.waybillNumber || d.trackingNumber || `ORD-${d.id}`,
                            customerName: d.customerName || 'Unknown',
                            expectedAmount: amount,
                            collectedAmount: collected,
                            status: d.status,
                            isDelivered: isDelivered
                        });
                    }
                });

                setSummary({
                    totalExpected,
                    totalCollected,
                    discrepancy: 0,
                    orders
                });
                setError(null);
                setLoading(false);
                return;
            }

            // Priority 2: Fallback to API if no active route
            const data = await api.getWalletSummary(authToken);
            setSummary(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load wallet summary:', err);
            // Don't show error screen if we have legitimate empty state, just show empty
            setSummary({ totalExpected: 0, totalCollected: 0, discrepancy: 0, orders: [] });
        } finally {
            setLoading(false);
        }
    };

    const handleEndShift = async () => {
        if (!summary) return;
        if (summary.discrepancy !== 0) {
            const confirmed = window.confirm(`Warning: There is a discrepancy of ${summary.discrepancy > 0 ? '+' : ''}${summary.discrepancy} AED. Are you sure you want to end your shift?`);
            if (!confirmed) return;
        } else {
            const confirmed = window.confirm('Are you sure you want to end your shift and logout?');
            if (!confirmed) return;
        }
        setIsEndingShift(true);
        try {
            await timeTracker.clockOut();
            onLogout();
        } catch (err) {
            console.error('Error ending shift:', err);
            alert('Failed to clock out. Please try again.');
            setIsEndingShift(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center">
                <span className="material-symbols-rounded text-red-500 text-5xl mb-4">error</span>
                <h3 className="text-xl font-bold text-white mb-2">Error Loading Wallet</h3>
                <p className="text-gray-500 mb-6">{error || 'Unknown error occurred'}</p>
                <button onClick={() => onNavigate('dashboard')} className="px-6 py-3 bg-card border border-gray-800 rounded-xl font-bold text-gray-300">
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const hasDiscrepancy = summary.discrepancy !== 0;
    const progressPercent = summary.totalExpected > 0 ? (summary.totalCollected / summary.totalExpected) * 100 : 0;

    return (
        <div className="min-h-screen bg-background pb-28 font-sans flex flex-col">
            {/* Header */}
            <div className="px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-4">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">COD Wallet</h1>
                    <button onClick={loadSummary} className="w-10 h-10 rounded-full bg-card border border-gray-800/50 flex items-center justify-center">
                        <span className="material-symbols-rounded text-gray-400 text-xl">refresh</span>
                    </button>
                </div>

                {/* Total Collected Today — Main Card */}
                <div className="bg-gradient-to-br from-primary to-red-800 rounded-2xl p-5 text-white relative overflow-hidden">
                    {/* BG Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-rounded text-white/70 text-lg">account_balance_wallet</span>
                            <p className="text-sm text-white/80 font-medium">Total Collected Today</p>
                        </div>
                        <h2 className="text-4xl font-bold tracking-tight">
                            {summary.totalCollected.toLocaleString()} <span className="text-base font-normal text-white/60">AED</span>
                        </h2>

                        {/* Progress bar */}
                        <div className="mt-4 bg-black/20 rounded-full h-2 overflow-hidden">
                            <div className="bg-white h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(progressPercent, 100)}%` }} />
                        </div>
                        <p className="text-xs text-white/60 mt-1.5 text-right">{Math.round(progressPercent)}% of assigned COD</p>
                    </div>
                </div>

                {/* Assigned + Remaining — 2 col */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-card rounded-xl p-4 border border-gray-800/50">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Assigned COD</p>
                        <p className="text-xl font-bold text-white mt-1">{summary.totalExpected.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-500">AED</p>
                    </div>
                    <div className="bg-card rounded-xl p-4 border border-gray-800/50">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">Remaining</p>
                        <p className={`text-xl font-bold mt-1 ${hasDiscrepancy ? 'text-primary' : 'text-green-400'}`}>
                            {Math.abs(summary.totalExpected - summary.totalCollected).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-500">AED</p>
                    </div>
                </div>

                {/* Discrepancy indicator */}
                {hasDiscrepancy && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mt-3 flex items-center gap-3">
                        <span className="material-symbols-rounded text-red-400">warning</span>
                        <span className="text-sm text-red-300 font-medium">
                            Discrepancy: {summary.discrepancy > 0 ? '+' : ''}{summary.discrepancy} AED
                        </span>
                    </div>
                )}

                {!hasDiscrepancy && summary.totalCollected > 0 && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mt-3 flex items-center gap-3">
                        <span className="material-symbols-rounded text-green-400">check_circle</span>
                        <span className="text-sm text-green-300 font-medium">Amounts Match Perfectly</span>
                    </div>
                )}
            </div>

            {/* Transaction Ledger */}
            <div className="flex-1 px-5 mt-2">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Ledger</h3>
                    <span className="text-xs text-gray-600">{summary.orders.length} orders</span>
                </div>

                {summary.orders.length === 0 ? (
                    <div className="text-center py-12 text-gray-600 bg-card rounded-xl border border-dashed border-gray-800">
                        <span className="material-symbols-rounded text-3xl mb-2 block">receipt_long</span>
                        No COD orders found for this shift
                    </div>
                ) : (
                    <div className="space-y-2">
                        {summary.orders.map((order) => {
                            const isMismatch = order.collectedAmount !== order.expectedAmount;
                            const borderColor = isMismatch ? 'border-l-red-500' : (order.isDelivered ? 'border-l-green-500' : 'border-l-yellow-500');

                            return (
                                <div key={order.id} className={`bg-card rounded-xl p-4 border border-gray-800/50 border-l-4 ${borderColor}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-[10px] font-bold text-gray-600">{order.waybillNumber}</span>
                                            <h4 className="text-sm font-bold text-white">{order.customerName}</h4>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isMismatch ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {isMismatch ? 'Mismatch' : 'Verified'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="text-gray-500">
                                            Expected: <span className="font-medium text-gray-300">{order.expectedAmount} AED</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 mr-1">Collected:</span>
                                            <span className={`font-bold ${isMismatch ? 'text-red-400' : 'text-green-400'}`}>
                                                {order.collectedAmount} AED
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* End Shift Button */}
            <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-0 right-0 px-5 z-30">
                <button
                    onClick={handleEndShift}
                    disabled={isEndingShift}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 ${hasDiscrepancy ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-card border border-gray-700 text-white hover:bg-gray-800'
                        }`}
                >
                    {isEndingShift ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Ending Shift...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-rounded">logout</span>
                            {hasDiscrepancy ? 'Review & End Shift' : 'Reconcile & End Shift'}
                        </>
                    )}
                </button>
            </div>

            <TabBar currentTab="wallet" onNavigate={onNavigate} />
        </div>
    );
}
