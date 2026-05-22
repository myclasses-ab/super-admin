import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import StatCard from '@/components/shared/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { inquiryApi, leadDistributionApi, institutesApi } from '@/api';
import type { Inquiry, LeadDistribution, Institute } from '@/types';
import { toast } from 'sonner';
import {
  Users,
  Mail,
  Send,
  Building2,
  TrendingUp,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [leads, setLeads] = useState<Inquiry[]>([]);
  const [distributions, setDistributions] = useState<LeadDistribution[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [l, d, i] = await Promise.all([
          inquiryApi.getAll(),
          leadDistributionApi.getAll(),
          institutesApi.getAll(),
        ]);
        setLeads(l ?? []);
        setDistributions(d ?? []);
        setInstitutes(i ?? []);
      } catch (err) {
        console.error('Dashboard load error', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const leadsToday = leads.filter((l) => new Date(l.createdAt) >= startOfDay).length;
  const leadsWeek = leads.filter((l) => new Date(l.createdAt) >= startOfWeek).length;
  const leadsMonth = leads.filter((l) => new Date(l.createdAt) >= startOfMonth).length;
  const sentLeads = distributions.length;
  const totalStudents = institutes.reduce((sum, i) => sum + (i.totalStudentsEnrolled || 0), 0);

  // Lead trend last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const leadsByDate = last30Days.map((date) => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    count: leads.filter((l) => l.createdAt.startsWith(date)).length,
  }));

  // Leads by source (top 10)
  const sourceCounts: Record<string, number> = {};
  leads.forEach((l) => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });
  const leadsByCity = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Leads by target exam
  const examCounts: Record<string, number> = {};
  leads.forEach((l) => {
    if (l.targetExam) {
      examCounts[l.targetExam] = (examCounts[l.targetExam] || 0) + 1;
    }
  });
  const leadsByExam = Object.entries(examCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const recentDistributions = [...distributions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {user?.fullName?.split(' ')[0] || 'Super Admin'}!
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening across the platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Leads Today" value={leadsToday} icon={Mail} />
        <StatCard title="Leads This Week" value={leadsWeek} icon={Users} />
        <StatCard title="Leads This Month" value={leadsMonth} icon={TrendingUp} />
        <StatCard title="Leads Sent" value={sentLeads} icon={Send} onClick={() => navigate('/distribute')} />
        <StatCard title="Total Institutes" value={institutes.length} icon={Building2} onClick={() => navigate('/institutes')} />
        <StatCard title="Active Students" value={totalStudents} icon={UserCheck} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Leads Over Time (Last 30 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={leadsByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Leads by Exam Type</h2>
          <div className="h-72">
            {leadsByExam.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data" description="Leads will appear here" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={leadsByExam} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {leadsByExam.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Leads by Source</h2>
          <div className="h-64">
            {leadsByCity.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data" description="Leads will appear here" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadsByCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Lead Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'New', value: leads.filter((l) => l.status === 'NEW').length },
                  { name: 'Contacted', value: leads.filter((l) => l.status === 'CONTACTED').length },
                  { name: 'Follow Up', value: leads.filter((l) => l.status === 'FOLLOW_UP').length },
                  { name: 'Enrolled', value: leads.filter((l) => l.status === 'ENROLLED').length },
                  { name: 'Dropped', value: leads.filter((l) => l.status === 'DROPPED').length },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Recent Leads</h2>
            <button
              onClick={() => navigate('/leads')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState icon={Mail} title="No leads yet" description="New leads will appear here" className="py-8" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Name</th>
                    <th className="text-left px-5 py-3 font-medium">Phone</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLeads.map((lead) => (
                    <tr key={lead.identifier} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{lead.name}</td>
                      <td className="px-5 py-3 text-slate-600">{lead.phone}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">{new Date(lead.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Distributions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Recent Distributions</h2>
            <button
              onClick={() => navigate('/distribute')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </button>
          </div>
          {recentDistributions.length === 0 ? (
            <EmptyState icon={Send} title="No distributions yet" description="Distributions will appear here" className="py-8" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium">Institute</th>
                    <th className="text-left px-5 py-3 font-medium">Status</th>
                    <th className="text-left px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentDistributions.map((d) => (
                    <tr key={d.identifier} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{d.instituteName || 'Unknown'}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-5 py-3 text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-700',
    CONTACTED: 'bg-amber-50 text-amber-700',
    FOLLOW_UP: 'bg-purple-50 text-purple-700',
    ENROLLED: 'bg-green-50 text-green-700',
    NOT_INTERESTED: 'bg-slate-100 text-slate-600',
    DROPPED: 'bg-red-50 text-red-700',
    PENDING: 'bg-blue-50 text-blue-700',
    VIEWED: 'bg-amber-50 text-amber-700',
    CONVERTED: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
