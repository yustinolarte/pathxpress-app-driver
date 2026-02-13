import { useState, useEffect } from 'react';
import { ArrowLeft, Wallet, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { timeTracker } from '../services/timeTracker';

interface DriverWalletProps {
    onNavigate: (screen: 'dashboard' | 'route' | 'delivery' | 'profile' | 'settings' | 'wallet') => void;
    authToken: string;
    onLogout: () => void;
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

export function DriverWallet({ onNavigate, authToken, onLogout }: DriverWalletProps) {
    const [summary, setSummary] = useState<WalletSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEndingShift, setIsEndingShift] = useState(false);

    useEffect(() => {
        loadSummary();
    }, []);

    const loadSummary = async () => {
        try {
            setLoading(true);
            const data = await api.getWalletSummary(authToken);
            setSummary(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load wallet summary:', err);
            setError('Failed to load wallet data');
        } finally {
            setLoading(false);
        }
    };

    const handleEndShift = async () => {
        if (!summary) return;

        // Validation warning if discrepancy exists
        if (summary.discrepancy !== 0) {
            const confirmed = window.confirm(
                `Warning: There is a discrepancy of ${summary.discrepancy > 0 ? '+' : ''}${summary.discrepancy} AED. Are you sure you want to end your shift?`
            );
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Wallet</h3>
                <p className="text-gray-500 mb-6">{error || 'Unknown error occurred'}</p>
                <button
                    onClick={() => onNavigate('dashboard')}
                    className="px-6 py-3 bg-white border border-gray-200 rounded-xl font-bold text-gray-700 shadow-sm"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const hasDiscrepancy = summary.discrepancy !== 0;

    return (
        <div className="min-h-screen bg-background pb-32 font-sans flex flex-col">
            {/* Header */}
            <div className="bg-white px-6 pt-[calc(2rem+env(safe-area-inset-top))] pb-6 shadow-sm z-10">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => onNavigate('dashboard')}
                        className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold font-heading text-gray-900">Driver Wallet</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>
                <p className="text-center text-gray-500 text-sm">Shift Reconciliation</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Summary Card */}
                <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-6 text-white shadow-lg shadow-primary/20">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-white/20 p-2 rounded-xl">
                            <Wallet className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-medium text-white/90">Today's Collection</span>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <p className="text-primary-foreground/70 text-xs uppercase tracking-wider font-bold mb-1">Collected</p>
                            <p className="text-3xl font-bold font-heading">
                                <span className="text-lg opacity-70 align-top mr-1">AED</span>
                                {summary.totalCollected}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-primary-foreground/70 text-xs uppercase tracking-wider font-bold mb-1">Expected</p>
                            <p className="text-2xl font-bold font-heading opacity-90">
                                {summary.totalExpected}
                            </p>
                        </div>
                    </div>

                    {/* Discrepancy Indicator */}
                    <div className={`mt-6 p-3 rounded-xl flex items-center gap-3 ${hasDiscrepancy ? 'bg-red-500/20 border border-white/20' : 'bg-green-500/20 border border-white/20'}`}>
                        {hasDiscrepancy ? (
                            <AlertCircle className="w-5 h-5 text-white" />
                        ) : (
                            <CheckCircle className="w-5 h-5 text-white" />
                        )}
                        <span className="font-medium text-sm">
                            {hasDiscrepancy
                                ? `Discrepancy: ${summary.discrepancy > 0 ? '+' : ''}${summary.discrepancy} AED`
                                : 'Amounts Match Perfectly'}
                        </span>
                    </div>
                </div>

                {/* Orders List */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-4 px-2">COD Orders</h3>
                    {summary.orders.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 bg-white rounded-3xl border border-gray-100 border-dashed">
                            No COD orders found for this shift
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {summary.orders.map((order) => {
                                const isMismatch = order.collectedAmount !== order.expectedAmount;

                                return (
                                    <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <span className="text-xs font-bold text-gray-400">{order.waybillNumber}</span>
                                                <h4 className="font-bold text-gray-900">{order.customerName}</h4>
                                            </div>
                                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isMismatch ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                {isMismatch ? 'Mismatch' : 'Verified'}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <div className="text-gray-500">
                                                Expected: <span className="font-medium text-gray-900">{order.expectedAmount}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-gray-500 mr-2">Collected:</span>
                                                <span className={`font-bold ${isMismatch ? 'text-red-600' : 'text-green-600'}`}>
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
            </div>

            {/* End Shift Button */}
            <div className="fixed bottom-[calc(2rem+env(safe-area-inset-bottom))] left-0 right-0 px-6 z-30">
                <button
                    onClick={handleEndShift}
                    disabled={isEndingShift}
                    className={`w-full py-5 rounded-[2rem] font-bold text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${hasDiscrepancy
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-black text-white hover:bg-gray-900'
                        }`}
                >
                    {isEndingShift ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Ending Shift...
                        </>
                    ) : (
                        <>
                            <Clock className="w-6 h-6" />
                            {hasDiscrepancy ? 'Review & End Shift' : 'Reconcile & End Shift'}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
