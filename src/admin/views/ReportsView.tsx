import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle, MapPin, Image, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface Report {
    id: number;
    driverId: number;
    issueType: string;
    description?: string;
    photoUrl?: string;
    latitude?: number;
    longitude?: number;
    status: string;
    createdAt: string;
    resolvedAt?: string;
    driver?: { id: number; fullName: string; phone?: string };
}

export function ReportsView() {
    const [reports, setReports] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);

    useEffect(() => {
        loadReports();
    }, [statusFilter]);

    const loadReports = async () => {
        try {
            setIsLoading(true);
            const data = await adminApi.getReports({
                status: statusFilter || undefined
            });
            setReports(data);
        } catch (error) {
            console.error('Failed to load reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            await adminApi.updateReportStatus(id, status);
            loadReports();
            if (selectedReport?.id === id) {
                setSelectedReport(null);
            }
        } catch (error: any) {
            alert(error.message);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PENDING': return <Clock className="w-5 h-5 text-amber-400" />;
            case 'IN_REVIEW': return <AlertTriangle className="w-5 h-5 text-blue-400" />;
            case 'RESOLVED': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
            case 'REJECTED': return <XCircle className="w-5 h-5 text-red-400" />;
            default: return <Clock className="w-5 h-5 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'IN_REVIEW': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'RESOLVED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    const getIssueTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'vehicle': return 'from-blue-500 to-blue-600';
            case 'accident': return 'from-red-500 to-red-600';
            case 'customer': return 'from-amber-500 to-amber-600';
            case 'package': return 'from-purple-500 to-purple-600';
            default: return 'from-gray-500 to-gray-600';
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Reports</h1>
                    <p className="text-white/50 mt-1">Manage driver issue reports</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <span className="text-amber-400 font-semibold">
                            {reports.filter(r => r.status === 'PENDING').length}
                        </span>
                        <span className="text-amber-400/60 text-sm">pending</span>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#16161f] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#e10600]/50 transition-colors min-w-[150px]"
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Reports List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white/5 rounded-2xl animate-pulse" />
                    ))
                ) : reports.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-white/40">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No reports found</p>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div
                            key={report.id}
                            className={`bg-[#16161f]/80 backdrop-blur-sm border rounded-2xl p-5 cursor-pointer hover:border-white/20 transition-all ${getStatusColor(report.status)}`}
                            onClick={() => setSelectedReport(report)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getIssueTypeColor(report.issueType)} flex items-center justify-center`}>
                                        <AlertTriangle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold capitalize">{report.issueType}</p>
                                        <p className="text-white/40 text-sm">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {getStatusIcon(report.status)}
                            </div>

                            <p className="text-white/60 text-sm line-clamp-2 mb-4">
                                {report.description || 'No description provided'}
                            </p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-xs font-medium">
                                        {report.driver?.fullName?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-white/50 text-sm">{report.driver?.fullName || 'Unknown'}</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    {report.photoUrl && (
                                        <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center">
                                            <Image className="w-4 h-4 text-white/50" />
                                        </div>
                                    )}
                                    {report.latitude && (
                                        <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center">
                                            <MapPin className="w-4 h-4 text-white/50" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Report Detail Modal */}
            {selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedReport(null)} />
                    <div className="relative w-full max-w-2xl bg-[#16161f] border border-white/10 rounded-2xl shadow-2xl animate-fadeIn max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-[#16161f]">
                            <h2 className="text-white font-semibold text-lg">Report Details</h2>
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-5 space-y-6">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIssueTypeColor(selectedReport.issueType)} flex items-center justify-center`}>
                                        <AlertTriangle className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-white font-semibold text-lg capitalize">{selectedReport.issueType}</p>
                                        <p className="text-white/40 text-sm">
                                            {new Date(selectedReport.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(selectedReport.status)}`}>
                                    {selectedReport.status.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Driver */}
                            <div className="bg-white/5 rounded-xl p-4">
                                <h3 className="text-white/50 text-sm font-medium uppercase mb-3">Reported By</h3>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e10600] to-[#ff4d4d] flex items-center justify-center text-white font-bold">
                                        {selectedReport.driver?.fullName?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{selectedReport.driver?.fullName || 'Unknown'}</p>
                                        <p className="text-white/40 text-sm">{selectedReport.driver?.phone || 'No phone'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <h3 className="text-white/50 text-sm font-medium uppercase mb-2">Description</h3>
                                <p className="text-white/80 bg-white/5 rounded-xl p-4">
                                    {selectedReport.description || 'No description provided'}
                                </p>
                            </div>

                            {/* Photo */}
                            {selectedReport.photoUrl && (
                                <div>
                                    <h3 className="text-white/50 text-sm font-medium uppercase mb-2">Photo Evidence</h3>
                                    <div className="rounded-xl overflow-hidden border border-white/10">
                                        <img
                                            src={selectedReport.photoUrl}
                                            alt="Report"
                                            className="w-full h-auto"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Location */}
                            {selectedReport.latitude && selectedReport.longitude && (
                                <div>
                                    <h3 className="text-white/50 text-sm font-medium uppercase mb-2">Location</h3>
                                    <a
                                        href={`https://maps.google.com/?q=${selectedReport.latitude},${selectedReport.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-[#e10600] hover:underline"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        View on Google Maps
                                    </a>
                                </div>
                            )}

                            {/* Actions */}
                            {selectedReport.status !== 'RESOLVED' && selectedReport.status !== 'REJECTED' && (
                                <div className="flex gap-3 pt-4 border-t border-white/5">
                                    {selectedReport.status === 'PENDING' && (
                                        <button
                                            onClick={() => updateStatus(selectedReport.id, 'IN_REVIEW')}
                                            className="flex-1 py-3 rounded-xl bg-blue-500/20 text-blue-400 font-medium hover:bg-blue-500/30 transition-colors"
                                        >
                                            Mark In Review
                                        </button>
                                    )}
                                    <button
                                        onClick={() => updateStatus(selectedReport.id, 'RESOLVED')}
                                        className="flex-1 py-3 rounded-xl bg-emerald-500/20 text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors"
                                    >
                                        Resolve
                                    </button>
                                    <button
                                        onClick={() => updateStatus(selectedReport.id, 'REJECTED')}
                                        className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 font-medium hover:bg-red-500/30 transition-colors"
                                    >
                                        Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
