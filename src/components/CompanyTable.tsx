import { useEffect, useState } from 'react';
import { Edit, Eye, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Company } from '../types';

interface CompanyTableProps {
  onManageFeatures: (company: Company) => void;
  onViewDetails: (company: Company) => void;
}

export function CompanyTable({ onManageFeatures, onViewDetails }: CompanyTableProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      // Fetch organizations for the super admin dashboard
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          organization_subscriptions (
            status,
            plan:subscription_plans (*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Fetched organizations data:', data);

      if (data) {
        // Map the organizations data to match the Company interface
        const mappedCompanies: Company[] = data.map((org: any) => {
          // Get the active subscription
          const subscription = org.organization_subscriptions?.[0];
          const plan = subscription?.plan;

          console.log('Org:', org.name, 'Subscription:', subscription);

          return {
            id: org.id,
            company_name: org.name,
            email: org.email || 'N/A',
            manager_name: 'Admin', // We'll enhance this later
            phone: org.phone || 'N/A',
            website: org.website || '',
            subscription_plan_id: subscription?.plan_id || '',
            status: org.is_active ? 'active' : 'inactive',
            registered_at: org.created_at,
            last_login: null, // We can fetch this separately if needed
            created_at: org.created_at,
            updated_at: org.updated_at,
            subscription_plans: plan ? {
              id: plan.id,
              name: plan.name,
              description: plan.description,
              price: plan.price,
              created_at: plan.created_at
            } : undefined
          };
        });

        console.log('Mapped companies:', mappedCompanies);
        setCompanies(mappedCompanies);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.manager_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'Pro':
        return 'bg-blue-100 text-blue-800';
      case 'Basic':
        return 'bg-green-100 text-green-800';
      case 'Free':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const loginDate = new Date(date);
    const diffMs = now.getTime() - loginDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Registered Companies
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manager
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCompanies.map((company) => (
              <tr
                key={company.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {company.company_name}
                    </div>
                    <div className="text-sm text-gray-500">{company.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {company.manager_name}
                  </div>
                  <div className="text-sm text-gray-500">{company.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanColor(
                      company.subscription_plans?.name || ''
                    )}`}
                  >
                    {company.subscription_plans?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                      company.status
                    )}`}
                  >
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(company.registered_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLastLogin(company.last_login)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        console.log('Edit button clicked for company:', company);
                        onManageFeatures(company);
                      }}
                      className="text-blue-600 hover:text-blue-900 transition-colors p-1 hover:bg-blue-50 rounded"
                      title="Manage Features"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        console.log('View Details clicked for company:', company);
                        onViewDetails(company);
                      }}
                      className="text-gray-600 hover:text-gray-900 transition-colors p-1 hover:bg-gray-50 rounded"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No companies found</p>
        </div>
      )}
    </div>
  );
}
