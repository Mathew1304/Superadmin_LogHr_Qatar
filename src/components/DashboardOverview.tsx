import { useEffect, useState } from 'react';
import { Clock, Users, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RecentCompany {
    id: string;
    company_name: string;
    created_at: string;
}

interface RecentError {
    id: string;
    error_message: string;
    severity: string;
    organization_name: string;
    created_at: string;
}

export function DashboardOverview() {
    const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
    const [recentErrors, setRecentErrors] = useState<RecentError[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRecentData();
    }, []);

    const fetchRecentData = async () => {
        try {
            const { data: companies } = await supabase
                .from('organizations')
                .select('id, name, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            const { data: errors } = await supabase
                .from('error_logs')
                .select('id, error_message, severity, organization_name, created_at')
                .order('created_at', { ascending: false })
                .limit(3);

            setRecentCompanies((companies || []).map((c: any) => ({
                id: c.id,
                company_name: c.name,
                created_at: c.created_at
            })));
            setRecentErrors(errors || []);
        } catch (error) {
            console.error('Error fetching recent data:', error);
        } finally {
            setLoading(false);
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
        if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;
        return date.toLocaleDateString();
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-red-100 text-red-800 border-red-200';
            case 'error': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Latest Registered Companies */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <h3 className="text-xs font-bold text-gray-900">Latest Registered</h3>
                    </div>
                </div>
                <div className="p-2">
                    {recentCompanies.length === 0 ? (
                        <div className="text-center py-3 text-gray-500">
                            <p className="text-xs">No companies yet</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentCompanies.map((company, index) => (
                                <div
                                    key={company.id}
                                    className="flex items-center gap-2 p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-gray-900 truncate">
                                            {company.company_name}
                                        </p>
                                        <p className="text-xs text-gray-500">{formatDate(company.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Latest Errors */}
            <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-orange-50 px-3 py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <h3 className="text-xs font-bold text-gray-900">Latest Errors</h3>
                    </div>
                </div>
                <div className="p-2">
                    {recentErrors.length === 0 ? (
                        <div className="text-center py-3 text-gray-500">
                            <p className="text-xs">No errors logged</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {recentErrors.map((error) => (
                                <div
                                    key={error.id}
                                    className="p-1.5 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${getSeverityColor(error.severity)}`}>
                                            {error.severity?.toUpperCase() || 'ERROR'}
                                        </span>
                                        <p className="text-xs text-gray-500">{formatDate(error.created_at)}</p>
                                    </div>
                                    <p className="text-xs text-gray-900 font-medium truncate">
                                        {error.error_message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
