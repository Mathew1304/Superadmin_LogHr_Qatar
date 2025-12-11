import { useState, useEffect } from 'react';
import { Shield, LogOut, LayoutDashboard, Building2, AlertTriangle, Headphones } from 'lucide-react';
import { supabase } from './lib/supabase';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { CompanyTable } from './components/CompanyTable';
import { FeatureManagementModal } from './components/FeatureManagementModal';
import { OrganizationDetailsModal } from './components/OrganizationDetailsModal';
import { ErrorLogsTable } from './components/ErrorLogsTable';
import { SupportTicketList } from './components/SupportTicketList';
import { DashboardOverview } from './components/DashboardOverview';
import { LoginForm } from './components/LoginForm';
import { Company } from './types';

type ActiveView = 'dashboard' | 'companies' | 'errors' | 'tickets';

function App() {
  const [selectedCompanyForFeatures, setSelectedCompanyForFeatures] = useState<Company | null>(null);
  const [selectedCompanyForDetails, setSelectedCompanyForDetails] = useState<Company | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleManageFeatures = (company: Company) => {
    setSelectedCompanyForFeatures(company);
  };

  const handleViewDetails = (company: Company) => {
    setSelectedCompanyForDetails(company);
  };

  const handleCloseFeaturesModal = () => {
    setSelectedCompanyForFeatures(null);
  };

  const handleCloseDetailsModal = () => {
    setSelectedCompanyForDetails(null);
  };

  const handleUpdateFeatures = () => {
    setRefreshKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const navItems = [
    { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'companies' as ActiveView, label: 'Registered Companies', icon: Building2 },
    { id: 'tickets' as ActiveView, label: 'Helpdesk & Support', icon: Headphones },
    { id: 'errors' as ActiveView, label: 'Error Console Logs', icon: AlertTriangle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl blur opacity-40"></div>
              <div className="relative p-3 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
              <p className="text-xs text-gray-600">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveView(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {navItems.find(item => item.id === activeView)?.label}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeView === 'dashboard' && 'Overview of latest activities and metrics'}
              {activeView === 'companies' && 'Manage all registered organizations'}
              {activeView === 'tickets' && 'Manage and resolve support requests'}
              {activeView === 'errors' && 'Monitor and resolve application errors'}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-8">
          {activeView === 'dashboard' && (
            <div className="space-y-8">
              <AnalyticsDashboard key={refreshKey} />
              <DashboardOverview />
            </div>
          )}

          {activeView === 'companies' && (
            <CompanyTable
              onManageFeatures={handleManageFeatures}
              onViewDetails={handleViewDetails}
            />
          )}

          {activeView === 'tickets' && (
            <SupportTicketList />
          )}

          {activeView === 'errors' && (
            <ErrorLogsTable />
          )}
        </main>
      </div>

      {/* Modals */}
      {selectedCompanyForFeatures && (
        <FeatureManagementModal
          company={selectedCompanyForFeatures}
          onClose={handleCloseFeaturesModal}
          onUpdate={handleUpdateFeatures}
        />
      )}

      {selectedCompanyForDetails && (
        <OrganizationDetailsModal
          company={selectedCompanyForDetails}
          onClose={handleCloseDetailsModal}
        />
      )}
    </div>
  );
}

export default App;
