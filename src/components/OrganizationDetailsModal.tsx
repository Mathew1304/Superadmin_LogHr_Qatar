import { useEffect, useState } from 'react';
import { X, Building2, Mail, Phone, Globe, Users, Shield, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Company } from '../types';

interface OrganizationDetailsModalProps {
    company: Company | null;
    onClose: () => void;
}

interface OrganizationStats {
    employeeCount: number;
    activeUserCount: number;
    enabledFeatures: string[];
}

export function OrganizationDetailsModal({
    company,
    onClose,
}: OrganizationDetailsModalProps) {
    const [stats, setStats] = useState<OrganizationStats>({
        employeeCount: 0,
        activeUserCount: 0,
        enabledFeatures: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (company) {
            fetchStats();
        }
    }, [company]);

    const fetchStats = async () => {
        if (!company) return;

        try {
            setLoading(true);

            console.log('Fetching employee count for organization:', company.id);

            // Fetch employee count
            const { count: employeeCount, error: empError } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('organization_id', company.id);

            console.log('Employee count query result:', {
                count: employeeCount,
                error: empError,
                organizationId: company.id
            });

            if (empError) {
                console.error('Error fetching employee count:', empError);
            }

            // Fetch active user count
            const { count: activeUserCount, error: userError } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true })
                .eq('current_organization_id', company.id)
                .eq('is_active', true);

            console.log('Active user count query result:', {
                count: activeUserCount,
                error: userError,
                organizationId: company.id
            });

            if (userError) {
                console.error('Error fetching user count:', userError);
            }

            // Fetch enabled features from organization_features table
            const { data: orgFeatures, error: featuresError } = await supabase
                .from('organization_features')
                .select('feature_key')
                .eq('organization_id', company.id)
                .eq('is_enabled', true);

            console.log('Enabled features query result:', {
                features: orgFeatures,
                error: featuresError,
                organizationId: company.id
            });

            if (featuresError) {
                console.error('Error fetching features:', featuresError);
            }

            // Extract feature keys from the result
            const enabledFeatureKeys = orgFeatures?.map(f => f.feature_key) || [];

            setStats({
                employeeCount: employeeCount || 0,
                activeUserCount: activeUserCount || 0,
                enabledFeatures: enabledFeatureKeys,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!company) return null;

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const featureNames: { [key: string]: string } = {
        dashboard: 'Dashboard',
        employees: 'Employees',
        attendance: 'Attendance',
        leave: 'Leave Management',
        payroll: 'Payroll',
        reports: 'Reports',
        settings: 'Settings'
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Organization Details
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Complete information for {company.company_name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Organization Info */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-blue-600" />
                            Organization Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <Building2 className="w-5 h-5 text-gray-600 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Company Name</p>
                                    <p className="text-sm font-medium text-gray-900">{company.company_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="text-sm font-medium text-gray-900">{company.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{company.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <Globe className="w-5 h-5 text-gray-600 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Website</p>
                                    <p className="text-sm font-medium text-gray-900">{company.website || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subscription Info */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            Subscription Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-xs text-blue-600 font-medium">Plan</p>
                                <p className="text-lg font-bold text-blue-900">{company.subscription_plans?.name || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <p className="text-xs text-green-600 font-medium">Status</p>
                                <p className="text-lg font-bold text-green-900 capitalize">{company.status}</p>
                            </div>
                            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <p className="text-xs text-purple-600 font-medium">Registered</p>
                                <p className="text-sm font-bold text-purple-900">{formatDate(company.registered_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Activity Stats */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Activity & Usage
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-gray-600" />
                                    <p className="text-xs text-gray-600 font-medium">Total Employees</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.employeeCount}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-gray-600" />
                                    <p className="text-xs text-gray-600 font-medium">Active Users</p>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.activeUserCount}</p>
                            </div>
                        </div>
                    </div>

                    {/* Enabled Features */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">
                            Enabled Features
                        </h3>
                        {loading ? (
                            <p className="text-sm text-gray-500">Loading...</p>
                        ) : stats.enabledFeatures.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {stats.enabledFeatures.map(feature => (
                                    <div
                                        key={feature}
                                        className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-900">
                                            {featureNames[feature] || feature}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                                <p className="text-sm text-gray-500">No features enabled</p>
                                <p className="text-xs text-gray-400 mt-1">Click Edit to enable features for this organization</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
