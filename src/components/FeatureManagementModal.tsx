import { useEffect, useState } from 'react';
import { X, Save, Loader2, LayoutDashboard, Users, Calendar, FileText, DollarSign, BarChart3, Settings, CheckSquare, Receipt, BookOpen, ClipboardList } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Company } from '../types';
import { Toast } from './Toast';

interface FeatureManagementModalProps {
  company: Company | null;
  onClose: () => void;
  onUpdate: () => void;
}

interface SidebarFeature {
  key: string;
  name: string;
  icon: JSX.Element;
  description: string;
}

const SIDEBAR_FEATURES: SidebarFeature[] = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Main dashboard and analytics'
  },
  {
    key: 'employees',
    name: 'Employees',
    icon: <Users className="w-5 h-5" />,
    description: 'Employee management'
  },
  {
    key: 'attendance',
    name: 'Attendance',
    icon: <Calendar className="w-5 h-5" />,
    description: 'Attendance tracking'
  },
  {
    key: 'leave',
    name: 'Leave Management',
    icon: <FileText className="w-5 h-5" />,
    description: 'Leave requests and approvals'
  },
  {
    key: 'tasks',
    name: 'Tasks',
    icon: <CheckSquare className="w-5 h-5" />,
    description: 'Task management'
  },
  {
    key: 'expenses',
    name: 'Expenses',
    icon: <Receipt className="w-5 h-5" />,
    description: 'Expense tracking'
  },
  {
    key: 'payroll',
    name: 'Payroll',
    icon: <DollarSign className="w-5 h-5" />,
    description: 'Payroll processing'
  },
  {
    key: 'training',
    name: 'Training',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Training programs'
  },
  {
    key: 'work-reports',
    name: 'Work Reports',
    icon: <ClipboardList className="w-5 h-5" />,
    description: 'Work reports and logs'
  },
  {
    key: 'reports',
    name: 'Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Analytics and reports'
  },
  {
    key: 'settings',
    name: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    description: 'Organization settings'
  }
];

export function FeatureManagementModal({
  company,
  onClose,
  onUpdate,
}: FeatureManagementModalProps) {
  const [enabledFeatures, setEnabledFeatures] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (company) {
      loadFeatures();
    }
  }, [company]);

  const loadFeatures = async () => {
    if (!company) return;

    try {
      setLoading(true);

      // Fetch all feature rows for this organization
      const { data, error } = await supabase
        .from('organization_features')
        .select('feature_key, is_enabled')
        .eq('organization_id', company.id);

      if (error) {
        console.error('Error loading features:', error);
      }

      console.log('Fetched feature rows:', data);

      // Convert rows to feature map
      const featureMap: { [key: string]: boolean } = {};
      data?.forEach(row => {
        featureMap[row.feature_key] = row.is_enabled;
      });

      // Initialize all features (default to true if not in database)
      const initialFeatures: { [key: string]: boolean } = {};
      SIDEBAR_FEATURES.forEach(feature => {
        initialFeatures[feature.key] = featureMap[feature.key] !== undefined ? featureMap[feature.key] : true;
      });

      setEnabledFeatures(initialFeatures);
    } catch (error) {
      console.error('Error loading features:', error);
      // Set all to true by default on error
      const defaultFeatures: { [key: string]: boolean } = {};
      SIDEBAR_FEATURES.forEach(feature => {
        defaultFeatures[feature.key] = true;
      });
      setEnabledFeatures(defaultFeatures);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeature = (featureKey: string) => {
    setEnabledFeatures(prev => ({
      ...prev,
      [featureKey]: !prev[featureKey]
    }));
  };

  const handleSave = async () => {
    if (!company) return;

    try {
      setSaving(true);

      // Prepare rows for each feature
      const featureRows = Object.entries(enabledFeatures).map(([key, enabled]) => ({
        organization_id: company.id,
        feature_key: key,
        is_enabled: enabled,
        updated_at: new Date().toISOString()
      }));

      console.log('Saving features:', featureRows);

      // Upsert all feature rows
      const { data, error } = await supabase
        .from('organization_features')
        .upsert(featureRows, {
          onConflict: 'organization_id,feature_key'
        })
        .select();

      console.log('Upsert result:', { data, error });

      if (error) throw error;

      setToast({ message: 'Features updated successfully!', type: 'success' });

      // Close modal after a short delay to show the toast
      setTimeout(() => {
        onUpdate();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error updating features:', error);
      setToast({ message: 'Failed to update features. Please try again.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (!company) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Manage Sidebar Features
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {company.company_name} -{' '}
              <span className="font-medium text-gray-900">
                {company.subscription_plan || 'Free'}
              </span>
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Enable or disable sidebar features for this organization. Disabled features will not be visible to their users.
              </p>
              {SIDEBAR_FEATURES.map((feature) => (
                <label
                  key={feature.key}
                  className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={enabledFeatures[feature.key] || false}
                    onChange={() => handleToggleFeature(feature.key)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="ml-4 flex items-center gap-3 flex-1">
                    <div className="text-gray-600">
                      {feature.icon}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-900 block">
                        {feature.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {feature.description}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between bg-gray-50">
          <p className="text-sm text-gray-600">
            {Object.values(enabledFeatures).filter(Boolean).length} of{' '}
            {SIDEBAR_FEATURES.length} features enabled
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
