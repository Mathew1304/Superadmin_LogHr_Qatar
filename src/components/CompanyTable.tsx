import { useEffect, useState } from 'react';
import { Edit, Eye, Search, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Company } from '../types';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface CompanyTableProps {
  onManageFeatures: (company: Company) => void;
  onViewDetails: (company: Company) => void;
}

export function CompanyTable({ onManageFeatures, onViewDetails }: CompanyTableProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            phone: org.phone || 'N/A',
            subscription_plan: plan?.name || 'Free', // Map plan name here
            subscription_status: subscription?.status || 'active', // Default or mapped status
            status: org.is_active ? 'active' : 'suspended', // Map correctly
            created_at: org.created_at,
            subscription_details: plan ? {
              plan_name: plan.name,
              status: subscription.status
            } : undefined
            // removed manager_name, registered_at (use created_at), last_login, subscription_plans
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

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!companyToDelete) return;

    setIsDeleting(true);
    try {
      // Use Edge Function for secure full deletion (Auth + DB)
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { organizationId: companyToDelete.id }
      });

      if (error) {
        // Try to parse the error body if available
        let errorMessage = 'Failed to delete company.';
        try {
          // If it's a FunctionsHttpError, the body might be in the response
          if ('context' in error && (error as any).context instanceof Response) {
            const body = await (error as any).context.json();
            errorMessage = body.error || errorMessage;
          } else {
            errorMessage = error.message;
          }
        } catch (e) {
          errorMessage = error.message;
        }

        console.error('Delete error details:', error);
        alert(`Error: ${errorMessage}`);
        throw error;
      }

      // Remove from local state to update UI immediately
      setCompanies(companies.filter(c => c.id !== companyToDelete.id));
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('Error deleting company:', error);
      alert('Failed to delete company. Please check console for details.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCompanies = companies.filter(
    (company) =>
      company.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
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
                    <div className="text-xs text-gray-400">{company.phone}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanColor(
                      company.subscription_plan || 'Free'
                    )}`}
                  >
                    {company.subscription_plan || 'Free'}
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
                  {formatDate(company.created_at)}
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
                    <button
                      onClick={() => handleDeleteClick(company)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded"
                      title="Delete Company"
                    >
                      <Trash className="w-5 h-5" />
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

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Organization"
        message="Are you sure you want to delete this organization? This will remove all employees, payroll data, and settings associated with:"
        itemName={companyToDelete?.company_name}
        isLoading={isDeleting}
      />
    </div>
  );
}
