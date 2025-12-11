import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Eye, RefreshCw, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ErrorLog {
    id: string;
    organization_id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    organization_name: string;
    error_message: string;
    error_stack: string;
    error_type: string;
    page_url: string;
    user_agent: string;
    severity: 'error' | 'warning' | 'critical';
    is_resolved: boolean;
    resolved_at: string;
    resolved_by: string;
    notes: string;
    created_at: string;
    metadata: any;
}

export function ErrorLogsTable() {
    const [logs, setLogs] = useState<ErrorLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [severityFilter, setSeverityFilter] = useState<'all' | 'error' | 'warning' | 'critical'>('all');
    const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');
    const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);

    const filteredLogs = logs.filter((log) => {
        const matchesSearch = log.error_message.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user_email?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter;

        return matchesSearch && matchesSeverity;
    });

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            console.log('🔍 Fetching error logs with filter:', filter);

            let query = supabase
                .from('error_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (filter === 'unresolved') {
                query = query.eq('is_resolved', false);
            }

            const { data, error } = await query;

            console.log('📊 Error logs query result:', {
                success: !error,
                error: error,
                count: data?.length || 0,
                data: data
            });

            if (error) {
                console.error('❌ Error fetching error logs:', error);
                throw error;
            }

            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsResolved = async (logId: string) => {
        try {
            const { error } = await supabase
                .from('error_logs')
                .update({
                    is_resolved: true,
                    resolved_at: new Date().toISOString()
                })
                .eq('id', logId);

            if (error) throw error;
            fetchLogs();
        } catch (error) {
            console.error('Error marking as resolved:', error);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'error': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                <AlertTriangle className="w-6 h-6 text-orange-600" />
                                Error Console Logs
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Real-time errors from all organizations
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchLogs}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </button>
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                All ({logs.length})
                            </button>
                            <button
                                onClick={() => setFilter('unresolved')}
                                className={`px-4 py-2 rounded-lg transition-colors ${filter === 'unresolved' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Unresolved
                            </button>
                        </div>
                    </div>

                    {/* Severity Filter Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSeverityFilter('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${severityFilter === 'all'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setSeverityFilter('error')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${severityFilter === 'error'
                                ? 'bg-orange-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Error
                        </button>
                        <button
                            onClick={() => setSeverityFilter('warning')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${severityFilter === 'warning'
                                ? 'bg-yellow-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Warning
                        </button>
                        <button
                            onClick={() => setSeverityFilter('critical')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${severityFilter === 'critical'
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Critical
                        </button>
                    </div>

                    {/* Search Box */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search errors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                        Loading error logs...
                    </div>
                ) : logs.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                        <p className="text-lg font-medium">No errors found!</p>
                        <p className="text-sm">All systems running smoothly</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Severity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Organization
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Error
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(log.severity)}`}>
                                            {log.severity?.toUpperCase() || 'ERROR'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {log.organization_name || 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{log.user_name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-500">{log.user_email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 truncate max-w-md" title={log.error_message}>
                                            {log.error_message}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">{log.error_type}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedLog(log)}
                                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                            {!log.is_resolved && (
                                                <button
                                                    onClick={() => markAsResolved(log.id)}
                                                    className="text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                    Resolve
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Error Detail Modal */}
            {
                selectedLog && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                        onClick={() => setSelectedLog(null)}
                    >
                        <div
                            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <XCircle className="w-6 h-6 text-red-600" />
                                    Error Details
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {formatDate(selectedLog.created_at)}
                                </p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {/* Organization & User Info */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Organization</label>
                                        <p className="text-sm text-gray-900 mt-1">{selectedLog.organization_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">User</label>
                                        <p className="text-sm text-gray-900 mt-1">{selectedLog.user_name || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{selectedLog.user_email}</p>
                                    </div>
                                </div>

                                {/* Error Info */}
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Error Type</label>
                                    <p className="text-sm text-gray-900 mt-1">{selectedLog.error_type}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase">Error Message</label>
                                    <p className="text-sm text-gray-900 mt-1 bg-red-50 p-4 rounded-lg border border-red-200">
                                        {selectedLog.error_message}
                                    </p>
                                </div>

                                {selectedLog.error_stack && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Stack Trace</label>
                                        <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto mt-1 max-h-64">
                                            {selectedLog.error_stack}
                                        </pre>
                                    </div>
                                )}

                                {selectedLog.page_url && (
                                    <div>
                                        <label className="text-xs font-semibold text-gray-500 uppercase">Page URL</label>
                                        <p className="text-sm text-blue-600 mt-1 break-all">{selectedLog.page_url}</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
                                {!selectedLog.is_resolved && (
                                    <button
                                        onClick={() => {
                                            markAsResolved(selectedLog.id);
                                            setSelectedLog(null);
                                        }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                    >
                                        Mark as Resolved
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
