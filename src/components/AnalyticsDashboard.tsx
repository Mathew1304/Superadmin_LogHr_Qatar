import { useEffect, useState } from 'react';
import { Calendar, TrendingUp, PieChart, Building2, BarChart3, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Analytics {
  totalCompanies: number;
  todayRegistrations: number;
  monthlyRegistrations: { month: string; count: number }[];
  planDistribution: { plan: string; count: number }[];
  growthRate: number;
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalCompanies: 0,
    todayRegistrations: 0,
    monthlyRegistrations: [],
    planDistribution: [],
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { count: totalCompanies } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: todayRegistrations } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      const { data: orgs } = await supabase
        .from('organizations')
        .select('created_at')
        .order('created_at', { ascending: false });

      const monthlyData: { [key: string]: number } = {};
      orgs?.forEach((org) => {
        const month = new Date(org.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
        monthlyData[month] = (monthlyData[month] || 0) + 1;
      });

      const monthlyRegistrations = Object.entries(monthlyData)
        .slice(0, 6)
        .map(([month, count]) => ({ month, count }))
        .reverse();

      // Calculate growth rate
      const thisMonth = monthlyRegistrations[monthlyRegistrations.length - 1]?.count || 0;
      const lastMonth = monthlyRegistrations[monthlyRegistrations.length - 2]?.count || 1;
      const growthRate = ((thisMonth - lastMonth) / lastMonth) * 100;

      const { data: subscriptions } = await supabase
        .from('organization_subscriptions')
        .select('subscription_plans(name)');

      const planData: { [key: string]: number } = {};
      subscriptions?.forEach((sub: any) => {
        const plan = sub.subscription_plans?.name || 'Unknown';
        planData[plan] = (planData[plan] || 0) + 1;
      });

      const planDistribution = Object.entries(planData).map(([plan, count]) => ({
        plan,
        count,
      }));

      setAnalytics({
        totalCompanies: totalCompanies || 0,
        todayRegistrations: todayRegistrations || 0,
        monthlyRegistrations,
        planDistribution,
        growthRate: Math.round(growthRate),
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const maxMonthlyCount = Math.max(...analytics.monthlyRegistrations.map(m => m.count), 1);
  const totalSubscriptions = analytics.planDistribution.reduce((sum, p) => sum + p.count, 0);

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Grid with Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedStatCard
          title="Total Organizations"
          value={analytics.totalCompanies.toString()}
          icon={<Building2 className="w-7 h-7" />}
          gradient="from-blue-500 via-blue-600 to-indigo-600"
          iconBg="bg-blue-500/10"
          iconColor="text-blue-600"
          trend={`${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate}%`}
          trendPositive={analytics.growthRate >= 0}
        />
        <EnhancedStatCard
          title="New Today"
          value={analytics.todayRegistrations.toString()}
          icon={<Calendar className="w-7 h-7" />}
          gradient="from-emerald-500 via-green-600 to-teal-600"
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-600"
          subtitle="Last 24 hours"
        />
        <EnhancedStatCard
          title="This Month"
          value={(analytics.monthlyRegistrations[analytics.monthlyRegistrations.length - 1]?.count || 0).toString()}
          icon={<TrendingUp className="w-7 h-7" />}
          gradient="from-violet-500 via-purple-600 to-indigo-600"
          iconBg="bg-violet-500/10"
          iconColor="text-violet-600"
          subtitle="Current month"
        />
        <EnhancedStatCard
          title="Active Subscriptions"
          value={totalSubscriptions.toString()}
          icon={<Activity className="w-7 h-7" />}
          gradient="from-amber-500 via-orange-600 to-red-600"
          iconBg="bg-amber-500/10"
          iconColor="text-amber-600"
          subtitle="All plans"
        />
      </div>

      {/* Advanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Growth Chart - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Monthly Growth Trend</h3>
                <p className="text-sm text-gray-600 mt-1">Organization registrations over time</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.monthlyRegistrations.map((item, index) => {
                const percentage = (item.count / maxMonthlyCount) * 100;
                const isHighest = item.count === maxMonthlyCount;
                return (
                  <div key={item.month} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-700 min-w-[80px]">{item.month}</span>
                        {isHighest && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Peak
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{percentage.toFixed(0)}%</span>
                        <span className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full min-w-[50px] text-center">
                          {item.count}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out group-hover:from-indigo-600 group-hover:via-blue-600 group-hover:to-purple-600 ${isHighest ? 'shadow-lg shadow-indigo-300' : ''
                          }`}
                        style={{
                          width: `${percentage}%`,
                          animationDelay: `${index * 100}ms`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Plan Distribution - Donut Style */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Plans</h3>
                <p className="text-sm text-gray-600 mt-1">Distribution</p>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <PieChart className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.planDistribution.map((item, index) => {
                const percentage = totalSubscriptions > 0 ? (item.count / totalSubscriptions) * 100 : 0;
                const colors = [
                  { gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700' },
                  { gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700' },
                  { gradient: 'from-violet-500 to-purple-600', bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700' },
                  { gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700' },
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={item.plan} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${color.bg} ring-4 ring-${color.bg}/20`}></div>
                        <span className="text-sm font-semibold text-gray-700">{item.plan}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${color.text} ${color.light} px-2 py-1 rounded-full`}>
                          {percentage.toFixed(1)}%
                        </span>
                        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-full">
                          {item.count}
                        </span>
                      </div>
                    </div>
                    <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color.gradient} rounded-full transition-all duration-700 ease-out group-hover:shadow-lg`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface EnhancedStatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendPositive?: boolean;
  subtitle?: string;
}

function EnhancedStatCard({ title, value, icon, gradient, iconBg, iconColor, trend, trendPositive, subtitle }: EnhancedStatCardProps) {
  return (
    <div className="group relative bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`}></div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconBg} group-hover:scale-110 transition-transform duration-300`}>
            <div className={iconColor}>{icon}</div>
          </div>
          {trend && (
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${trendPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
              {trend}
            </span>
          )}
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-4xl font-bold text-gray-900 tracking-tight mb-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>

        {/* Subtle hover effect */}
        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
      </div>
    </div>
  );
}
