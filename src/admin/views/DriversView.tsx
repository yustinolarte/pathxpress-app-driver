import { useState, useEffect } from 'react';
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, X, UserPlus } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface Driver {
    id: number;
    username: string;
    fullName: string;
    email?: string;
    phone?: string;
    vehicleNumber?: string;
    status: string;
    createdAt: string;
    _count?: { routes: number; reports: number };
}

export function DriversView() {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        vehicleNumber: '',
        emiratesId: '',
        licenseNo: '',
        status: 'ACTIVE'
    });

    useEffect(() => {
        loadDrivers();
    }, [statusFilter]);

    const loadDrivers = async () => {
        try {
            setIsLoading(true);
            const data = await adminApi.getDrivers({
                status: statusFilter || undefined,
                search: searchQuery || undefined
            });
            setDrivers(data);
        } catch (error) {
            console.error('Failed to load drivers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        loadDrivers();
    };

    const openCreateModal = () => {
        setEditingDriver(null);
        setFormData({
            username: '',
            password: '',
            fullName: '',
            email: '',
            phone: '',
            vehicleNumber: '',
            emiratesId: '',
            licenseNo: '',
            status: 'ACTIVE'
        });
        setShowModal(true);
    };

    const openEditModal = (driver: Driver) => {
        setEditingDriver(driver);
        setFormData({
            username: driver.username,
            password: '',
            fullName: driver.fullName,
            email: driver.email || '',
            phone: driver.phone || '',
            vehicleNumber: driver.vehicleNumber || '',
            emiratesId: '',
            licenseNo: '',
            status: driver.status
        });
        setShowModal(true);
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            console.log('Submitting driver:', formData);
            if (editingDriver) {
                await adminApi.updateDriver(editingDriver.id, formData);
            } else {
                const result = await adminApi.createDriver(formData);
                console.log('Driver created:', result);
            }
            setShowModal(false);
            loadDrivers();
        } catch (error: any) {
            console.error('Error creating driver:', error);
            alert(error.message || 'Failed to create driver');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this driver?')) return;
        try {
            await adminApi.deleteDriver(id);
            loadDrivers();
        } catch (error: any) {
            alert(error.message);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-emerald-500/20 text-emerald-400';
            case 'INACTIVE': return 'bg-gray-500/20 text-gray-400';
            case 'SUSPENDED': return 'bg-red-500/20 text-red-400';
            default: return 'bg-gray-500/20 text-gray-400';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Drivers</h1>
                    <p className="text-white/50 mt-1">Manage your driver accounts</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white font-medium py-2.5 px-5 rounded-xl hover:shadow-lg hover:shadow-[#e10600]/20 transition-all"
                >
                    <UserPlus className="w-5 h-5" />
                    Add Driver
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search by name, username, or phone..."
                        className="w-full bg-[#16161f] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#16161f] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e10600]/50 transition-colors min-w-[150px]"
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="SUSPENDED">Suspended</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-[#16161f]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Driver</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Contact</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Vehicle</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Status</th>
                                <th className="text-left text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Routes</th>
                                <th className="text-right text-white/40 text-xs font-medium uppercase tracking-wider px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-white/5">
                                        {Array.from({ length: 6 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 bg-white/5 rounded animate-pulse" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : drivers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-12 text-white/40">
                                        No drivers found
                                    </td>
                                </tr>
                            ) : (
                                drivers.map((driver) => (
                                    <tr key={driver.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e10600] to-[#ff4d4d] flex items-center justify-center text-white font-bold text-sm">
                                                    {driver.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">{driver.fullName}</p>
                                                    <p className="text-white/40 text-sm">@{driver.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-white text-sm">{driver.phone || '-'}</p>
                                            <p className="text-white/40 text-sm">{driver.email || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-white text-sm">
                                            {driver.vehicleNumber || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                                                {driver.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-white text-sm">
                                            {driver._count?.routes || 0}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(driver)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(driver.id)}
                                                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/60 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-lg bg-[#16161f] border border-white/10 rounded-2xl shadow-2xl animate-fadeIn">
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <h2 className="text-white font-semibold text-lg">
                                {editingDriver ? 'Edit Driver' : 'Add New Driver'}
                            </h2>
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
                                    <label className="block text-white/60 text-sm mb-2">Username *</label>
                                    <input
                                        type="text"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                        required
                                        disabled={!!editingDriver}
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">
                                        Password {!editingDriver && '*'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                        required={!editingDriver}
                                        placeholder={editingDriver ? 'Leave blank to keep' : ''}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-white/60 text-sm mb-2">Full Name *</label>
                                <input
                                    type="text"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Vehicle Number</label>
                                    <input
                                        type="text"
                                        value={formData.vehicleNumber}
                                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#e10600]/50 transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-sm mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e10600]/50 transition-colors"
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="SUSPENDED">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#e10600] to-[#ff4d4d] text-white font-medium hover:shadow-lg hover:shadow-[#e10600]/20 transition-all disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Creating...' : (editingDriver ? 'Save Changes' : 'Create Driver')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
