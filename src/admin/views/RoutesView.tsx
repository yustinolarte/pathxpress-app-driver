import { useState, useEffect, useRef } from 'react';
import { Plus, Search, MapPin, Package, Clock, X, Route as RouteIcon, Upload, FileText } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface Route {
    id: string;
    driverId?: number | null;
    date: string;
    zone?: string;
    vehicleInfo?: string;
    status: string;
    driver?: { id: number; fullName: string; vehicleNumber?: string } | null;
    deliveries?: { id: number; status: string; codAmount: number }[];
}

interface Driver {
    id: number;
    fullName: string;
    vehicleNumber?: string;
}

export function RoutesView() {
    const [routes, setRoutes] = useState<Route[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [deliveries, setDeliveries] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        id: '',
        date: new Date().toISOString().split('T')[0],
        zone: '',
        vehicleInfo: ''
    });

    useEffect(() => {
        loadData();
    }, [statusFilter, dateFilter]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [routesData, driversData] = await Promise.all([
                adminApi.getRoutes({
                    status: statusFilter || undefined,
                    date: dateFilter || undefined
                }),
                adminApi.getDrivers({ status: 'ACTIVE' })
            ]);
            console.log('Routes loaded:', routesData);
            setRoutes(routesData);
            setDrivers(driversData);
        } catch (error) {
            console.error('Failed to load routes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await adminApi.createRoute({
                ...formData,
                deliveries: deliveries
            });
            setShowModal(false);
            setDeliveries([]);
            loadData();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split('\n').filter(line => line.trim());

            if (lines.length < 2) {
                alert('CSV must have a header row and at least one data row');
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const parsedDeliveries = [];

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const delivery: any = {};

                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    // Map common CSV headers to our field names
                    if (header.includes('customer') && header.includes('name')) {
                        delivery.customerName = value;
                    } else if (header.includes('phone') || header.includes('mobile')) {
                        delivery.customerPhone = value;
                    } else if (header.includes('address')) {
                        delivery.address = value;
                    } else if (header.includes('ref') || header.includes('awb') || header.includes('tracking')) {
                        delivery.packageRef = value;
                    } else if (header.includes('type')) {
                        delivery.type = value.toUpperCase() === 'COD' ? 'COD' : 'PREPAID';
                    } else if (header.includes('cod') || header.includes('amount')) {
                        delivery.codAmount = parseFloat(value) || 0;
                    } else if (header.includes('weight')) {
                        delivery.weight = value;
                    }
                });

                if (delivery.customerName && delivery.address) {
                    parsedDeliveries.push(delivery);
                }
            }

            setDeliveries(parsedDeliveries);
            alert(`Loaded ${parsedDeliveries.length} deliveries from CSV`);
        };
        reader.readAsText(file);
    };

    const updateStatus = async (routeId: string, status: string) => {
        try {
            await adminApi.updateRouteStatus(routeId, status);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const openRouteDetails = async (routeId: string) => {
        setLoadingDetails(true);
        setShowDetails(true);
        try {
            const route = await adminApi.getRouteDetails(routeId);
            setSelectedRoute(route);
        } catch (error: any) {
            alert('Failed to load route details: ' + error.message);
            setShowDetails(false);
        } finally {
            setLoadingDetails(false);
        }
    };

    const getDeliveryStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-emerald-500/20 text-emerald-400';
            case 'ATTEMPTED': return 'bg-amber-500/20 text-amber-400';
            case 'RETURNED': return 'bg-red-500/20 text-red-400';
            case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-500/20 text-amber-400';
            case 'IN_PROGRESS': return 'bg-blue-500/20 text-blue-400';
            case 'COMPLETED': return 'bg-emerald-500/20 text-emerald-400';
            case 'CANCELLED': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getDeliveryStats = (deliveries: any[] = []) => {
        const total = deliveries.length;
        const delivered = deliveries.filter(d => d.status === 'DELIVERED').length;
        const pending = deliveries.filter(d => d.status === 'PENDING').length;
        const cod = deliveries.reduce((sum, d) => sum + (d.codAmount || 0), 0);
        return { total, delivered, pending, cod };
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Routes</h1>
                    <p className="text-white/50 mt-1">Manage delivery routes</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({
                            id: `R-${Date.now()}`,
                            date: new Date().toISOString().split('T')[0],
                            zone: '',
                            vehicleInfo: ''
                        });
                        setShowModal(true);
                    }}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white font-medium py-2.5 px-5 rounded-xl hover:shadow-lg hover:shadow-[#e10600]/20 transition-all"
                >
                    <Plus className="w-5 h-5" />
                    Create Route
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
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
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Routes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse" />
                    ))
                ) : routes.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-white/40">
                        No routes found
                    </div>
                ) : (
                    routes.map((route) => {
                        const stats = getDeliveryStats(route.deliveries);
                        return (
                            <div
                                key={route.id}
                                onClick={() => openRouteDetails(route.id)}
                                className="bg-[#16161f]/80 backdrop-blur-sm border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-[#16161f] transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-white font-semibold">{route.id}</p>
                                        <p className="text-white/40 text-sm mt-1">
                                            {new Date(route.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(route.status)}`}>
                                        {route.status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-white/60 text-sm">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                            {route.driver?.fullName?.charAt(0) || '?'}
                                        </div>
                                        <span>{route.driver?.fullName || 'Unassigned'}</span>
                                    </div>
                                    {route.zone && (
                                        <div className="flex items-center gap-2 text-white/40 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            <span>{route.zone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="text-center">
                                            <p className="text-white font-semibold">{stats.total}</p>
                                            <p className="text-white/40 text-xs">Stops</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-emerald-400 font-semibold">{stats.delivered}</p>
                                            <p className="text-white/40 text-xs">Done</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-amber-400 font-semibold">{stats.pending}</p>
                                            <p className="text-white/40 text-xs">Left</p>
                                        </div>
                                    </div>

                                    {route.status === 'PENDING' && (
                                        <button
                                            onClick={() => updateStatus(route.id, 'CANCELLED')}
                                            className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Route Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg bg-[#16161f] border border-white/10 rounded-2xl shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="text-white font-semibold text-lg">Create Route</h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Route ID</label>
                                    <input
                                        type="text"
                                        value={formData.id}
                                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e10600]/50 transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e10600]/50 transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Driver will be assigned when they scan the route */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                <p className="text-blue-400 text-sm font-medium">📱 Driver Assignment</p>
                                <p className="text-white/50 text-xs mt-1">The route will be assigned to the first driver who scans it in the app.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Zone</label>
                                    <input
                                        type="text"
                                        value={formData.zone}
                                        onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                                        placeholder="e.g. Dubai Marina"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Vehicle Info</label>
                                    <input
                                        type="text"
                                        value={formData.vehicleInfo}
                                        onChange={(e) => setFormData({ ...formData, vehicleInfo: e.target.value })}
                                        placeholder="e.g. Van - White"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                    />
                                </div>
                            </div>

                            {/* CSV Upload Section */}
                            <div className="space-y-3">
                                <label className="block text-white/60 text-sm">Deliveries (Upload CSV)</label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept=".csv"
                                    onChange={handleCSVUpload}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 border-dashed rounded-xl px-4 py-4 text-white/60 hover:bg-white/10 hover:border-white/20 transition-colors"
                                >
                                    <Upload className="w-5 h-5" />
                                    <span>Upload CSV with deliveries</span>
                                </button>

                                {deliveries.length > 0 && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-emerald-400" />
                                                <span className="text-emerald-400 text-sm font-medium">
                                                    {deliveries.length} deliveries loaded
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDeliveries([])}
                                                className="text-white/40 hover:text-white/60 text-xs"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        <div className="mt-2 max-h-24 overflow-y-auto">
                                            {deliveries.slice(0, 3).map((d, i) => (
                                                <p key={i} className="text-white/50 text-xs truncate">
                                                    {i + 1}. {d.customerName} - {d.address?.substring(0, 30)}...
                                                </p>
                                            ))}
                                            {deliveries.length > 3 && (
                                                <p className="text-white/40 text-xs">
                                                    ... and {deliveries.length - 3} more
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <p className="text-white/30 text-xs">
                                    CSV columns: customer_name, phone, address, package_ref, type (COD/PREPAID), cod_amount
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setDeliveries([]); }}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white font-medium hover:shadow-lg hover:shadow-[#e10600]/20 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : `Create Route${deliveries.length > 0 ? ` (${deliveries.length} stops)` : ''}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Route Details Modal */}
            {showDetails && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
                    <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#16161f] border border-white/10 rounded-2xl shadow-2xl animate-fadeIn overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <div>
                                <h2 className="text-white font-semibold text-lg">
                                    {loadingDetails ? 'Loading...' : selectedRoute?.id}
                                </h2>
                                {selectedRoute && (
                                    <p className="text-white/50 text-sm mt-1">
                                        {new Date(selectedRoute.date).toLocaleDateString()} • {selectedRoute.zone || 'No zone'}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {loadingDetails ? (
                            <div className="p-10 text-center text-white/50">Loading route details...</div>
                        ) : selectedRoute && (
                            <div className="p-5 overflow-y-auto max-h-[calc(90vh-100px)]">
                                {/* Route Summary */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-white">{selectedRoute.deliveries?.length || 0}</p>
                                        <p className="text-white/50 text-sm">Total Stops</p>
                                    </div>
                                    <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-emerald-400">
                                            {selectedRoute.deliveries?.filter((d: any) => d.status === 'DELIVERED').length || 0}
                                        </p>
                                        <p className="text-white/50 text-sm">Delivered</p>
                                    </div>
                                    <div className="bg-amber-500/10 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-amber-400">
                                            {selectedRoute.deliveries?.filter((d: any) => d.status === 'ATTEMPTED').length || 0}
                                        </p>
                                        <p className="text-white/50 text-sm">Attempted</p>
                                    </div>
                                    <div className="bg-blue-500/10 rounded-xl p-4 text-center">
                                        <p className="text-2xl font-bold text-blue-400">
                                            AED {selectedRoute.deliveries?.reduce((sum: number, d: any) => sum + (d.codAmount || 0), 0).toFixed(0)}
                                        </p>
                                        <p className="text-white/50 text-sm">COD Total</p>
                                    </div>
                                </div>

                                {/* Driver Info */}
                                {selectedRoute.driver && (
                                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                                        <p className="text-white/50 text-sm mb-2">Assigned Driver</p>
                                        <p className="text-white font-medium">{selectedRoute.driver.fullName}</p>
                                        {selectedRoute.driver.phone && <p className="text-white/50 text-sm">{selectedRoute.driver.phone}</p>}
                                    </div>
                                )}

                                {/* Deliveries List */}
                                <div className="space-y-3">
                                    <h3 className="text-white font-medium">Deliveries ({selectedRoute.deliveries?.length || 0})</h3>
                                    {selectedRoute.deliveries?.map((delivery: any, index: number) => (
                                        <div key={delivery.id} className="bg-white/5 rounded-xl p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-sm font-medium">
                                                        {index + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-white font-medium">{delivery.customerName}</p>
                                                        <p className="text-white/40 text-sm">{delivery.customerPhone || 'No phone'}</p>
                                                    </div>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDeliveryStatusColor(delivery.status)}`}>
                                                    {delivery.status}
                                                </span>
                                            </div>

                                            <p className="text-white/60 text-sm mb-3">{delivery.address}</p>

                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-4">
                                                    {delivery.packageRef && (
                                                        <span className="text-white/40">REF: {delivery.packageRef}</span>
                                                    )}
                                                    {delivery.codAmount > 0 && (
                                                        <span className="text-amber-400">COD: AED {delivery.codAmount}</span>
                                                    )}
                                                </div>
                                                {delivery.deliveredAt && (
                                                    <span className="text-white/40">
                                                        {new Date(delivery.deliveredAt).toLocaleTimeString()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* POD Photo */}
                                            {delivery.proofPhotoUrl && (
                                                <div className="mt-3 pt-3 border-t border-white/5">
                                                    <p className="text-white/50 text-xs mb-2">Proof of Delivery</p>
                                                    <img
                                                        src={delivery.proofPhotoUrl}
                                                        alt="POD"
                                                        className="w-full max-w-xs rounded-lg cursor-pointer hover:opacity-80"
                                                        onClick={() => window.open(delivery.proofPhotoUrl, '_blank')}
                                                    />
                                                </div>
                                            )}

                                            {/* Notes */}
                                            {delivery.notes && (
                                                <div className="mt-3 pt-3 border-t border-white/5">
                                                    <p className="text-white/50 text-xs mb-1">Notes</p>
                                                    <p className="text-white/70 text-sm">{delivery.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {(!selectedRoute.deliveries || selectedRoute.deliveries.length === 0) && (
                                        <div className="text-center py-8 text-white/40">
                                            No deliveries in this route
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
