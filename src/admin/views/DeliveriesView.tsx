import { useState, useEffect } from 'react';
import { Search, Package, MapPin, Phone, Image, X, Eye } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface Delivery {
    id: number;
    routeId: string;
    customerName: string;
    customerPhone?: string;
    address: string;
    type: string;
    codAmount: number;
    status: string;
    proofPhotoUrl?: string;
    notes?: string;
    deliveredAt?: string;
    attemptedAt?: string;
    route?: {
        driver?: { id: number; fullName: string };
    };
}

export function DeliveriesView() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

    useEffect(() => {
        loadDeliveries();
    }, [statusFilter, dateFilter]);

    const loadDeliveries = async () => {
        try {
            setIsLoading(true);
            const data = await adminApi.getDeliveries({
                status: statusFilter || undefined,
                date: dateFilter || undefined
            });
            setDeliveries(data);
        } catch (error) {
            console.error('Failed to load deliveries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-emerald-500/20 text-emerald-400';
            case 'PENDING': return 'bg-blue-500/20 text-blue-400';
            case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400';
            case 'ATTEMPTED': return 'bg-amber-500/20 text-amber-400';
            case 'RETURNED': return 'bg-purple-500/20 text-purple-400';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const filteredDeliveries = deliveries.filter(d =>
        d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.routeId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Deliveries</h1>
                <p className="text-white/50 mt-1">Track all deliveries and proof of delivery</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by customer, address, or route..."
                        className="w-full bg-[#16161f] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                    />
                </div>
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="bg-[#16161f] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e10600]/50 transition-colors"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#16161f] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e10600]/50 transition-colors min-w-[150px]"
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="ATTEMPTED">Attempted</option>
                    <option value="RETURNED">Returned</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: deliveries.length, color: 'text-white' },
                    { label: 'Delivered', value: deliveries.filter(d => d.status === 'DELIVERED').length, color: 'text-emerald-400' },
                    { label: 'Pending', value: deliveries.filter(d => d.status === 'PENDING').length, color: 'text-blue-400' },
                    { label: 'Attempted', value: deliveries.filter(d => d.status === 'ATTEMPTED').length, color: 'text-amber-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-[#16161f]/80 border border-white/5 rounded-xl p-4 text-center">
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-white/40 text-sm">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-[#16161f]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Customer</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Route</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Type</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Amount</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Status</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">POD</th>
                                <th className="text-right text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-white/5 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredDeliveries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-white/40">
                                        No deliveries found
                                    </td>
                                </tr>
                            ) : (
                                filteredDeliveries.map((delivery) => (
                                    <tr key={delivery.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-white font-medium">{delivery.customerName}</p>
                                                <p className="text-white/40 text-sm flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {delivery.address.substring(0, 30)}...
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-white text-sm">{delivery.routeId}</p>
                                            <p className="text-white/40 text-sm">{delivery.route?.driver?.fullName || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${delivery.type === 'COD' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                                }`}>
                                                {delivery.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white text-sm">
                                            {delivery.codAmount > 0 ? `AED ${delivery.codAmount}` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                                {delivery.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {delivery.proofPhotoUrl ? (
                                                <button
                                                    onClick={() => setSelectedDelivery(delivery)}
                                                    className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                                                >
                                                    <Image className="w-5 h-5" />
                                                </button>
                                            ) : (
                                                <span className="text-white/30 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end">
                                                <button
                                                    onClick={() => setSelectedDelivery(delivery)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delivery Detail Modal */}
            {selectedDelivery && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDelivery(null)} />
                    <div className="relative w-full max-w-2xl bg-[#16161f] border border-white/10 rounded-2xl shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#16161f]">
                            <h2 className="text-white font-semibold text-lg">Delivery Details</h2>
                            <button
                                onClick={() => setSelectedDelivery(null)}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedDelivery.status)}`}>
                                    {selectedDelivery.status}
                                </span>
                                <span className={`px-3 py-1 rounded text-sm font-medium ${selectedDelivery.type === 'COD' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                                    }`}>
                                    {selectedDelivery.type}
                                </span>
                            </div>

                            {/* Customer Info */}
                            <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                <h3 className="text-white/50 text-sm font-medium uppercase">Customer</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#e10600] to-[#ff4d4d] flex items-center justify-center text-white font-bold">
                                        {selectedDelivery.customerName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{selectedDelivery.customerName}</p>
                                        {selectedDelivery.customerPhone && (
                                            <p className="text-white/40 text-sm flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {selectedDelivery.customerPhone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-start gap-2 text-white/60">
                                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm">{selectedDelivery.address}</p>
                                </div>
                            </div>

                            {/* COD Amount */}
                            {selectedDelivery.codAmount > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                                    <p className="text-amber-400/60 text-sm">COD Amount</p>
                                    <p className="text-amber-400 text-2xl font-bold">AED {selectedDelivery.codAmount}</p>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedDelivery.notes && (
                                <div>
                                    <h3 className="text-white/50 text-sm font-medium uppercase mb-2">Notes</h3>
                                    <p className="text-white/80 bg-white/5 rounded-xl p-4">{selectedDelivery.notes}</p>
                                </div>
                            )}

                            {/* POD Photo */}
                            {selectedDelivery.proofPhotoUrl && (
                                <div>
                                    <h3 className="text-white/50 text-sm font-medium uppercase mb-2">Proof of Delivery</h3>
                                    <div className="rounded-xl overflow-hidden border border-white/10">
                                        <img
                                            src={selectedDelivery.proofPhotoUrl}
                                            alt="POD"
                                            className="w-full h-auto"
                                        />
                                    </div>
                                    {selectedDelivery.deliveredAt && (
                                        <p className="text-white/40 text-sm mt-2">
                                            Delivered: {new Date(selectedDelivery.deliveredAt).toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
