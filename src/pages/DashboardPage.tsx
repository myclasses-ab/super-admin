import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import StatCard from '@/components/shared/StatCard';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { inquiryApi, institutesApi, creditsApi, featuredPurchasesApi, creditTopUpsApi, activityLogsApi } from '@/api';
import type { Inquiry, Institute, InstituteCredit, FeaturedPurchase, CreditTopUpRequest, ActivityLog, ActivityLogStatsResponse } from '@/types';
import { toast } from 'sonner';
import {
  Users,
  Mail,
  Building2,
  TrendingUp,
  UserCheck,
  ArrowRight,
  Coins,
  Sparkles,
  IndianRupee,
  Activity,
  Clock,
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
import { getActionIcon, relativeTime } from '@/components/activity/activity-log-helpers';

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [creditBalances, setCreditBalances] = useState<InstituteCredit[]>([]);
  const [featuredPurchases, setFeaturedPurchases] = useState<FeaturedPurchase[]>([]);
  const [creditTopUps, setCreditTopUps] = useState<CreditTopUpRequest[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityLogStatsResponse | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setActivityLoading(true);
      try {
        const [inq, i, fp, ctu] = await Promise.all([
          inquiryApi.getAll(),
          institutesApi.getAll(),
          featuredPurchasesApi.getAll().catch(() => []),
          creditTopUpsApi.getAll().catch(() => []),
        ]);
        setInquiries(inq ?? []);
        setInstitutes(i ?? []);
        setFeaturedPurchases(fp ?? []);
        setCreditTopUps(ctu ?? []);

        // Fetch credit balances
        const balances: InstituteCredit[] = [];
        await Promise.all(
          (i ?? []).map(async (inst: Institute) => {
            try {
              const credit = await creditsApi.getBalance(inst.identifier);
              balances.push(credit);
            } catch {
              // no credit record
            }
          })
        );
        setCreditBalances(balances);
      } catch (err) {
        console.error('Dashboard load error', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }

      try {
        const [stats, page] = await Promise.all([
          activityLogsApi.getStats(),
          activityLogsApi.search({ size: 10 }),
        ]);
        setActivityStats(stats);
        setRecentActivity(page.content);
      } catch (err) {
        console.error('Activity stats load error', err);
        toast.error('Failed to load activity data');
      } finally {
        setActivityLoading(false);
      }
    };
    load();
  }, []);

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const inquiriesToday = inquiries.filter((l) => new Date(l.createdAt) >= startOfDay).length;
  const inquiriesWeek = inquiries.filter((l) => new Date(l.createdAt) >= startOfWeek).length;
  const inquiriesMonth = inquiries.filter((l) => new Date(l.createdAt) >= startOfMonth).length;
  const totalStudents = institutes.reduce((sum, i) => sum + (i.totalStudentsEnrolled || 0), 0);

  // Inquiry trend last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const inquiriesByDate = last30Days.map((date) => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    count: inquiries.filter((l) => l.createdAt?.startsWith(date)).length,
  }));

  // Inquiries by source (top 10)
  const sourceCounts: Record<string, number> = {};
  inquiries.forEach((l) => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });
  const inquiriesBySource = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Inquiries by target exam
  const examCounts: Record<string, number> = {};
  inquiries.forEach((l) => {
    if (l.targetExam) {
      examCounts[l.targetExam] = (examCounts[l.targetExam] || 0) + 1;
    }
  });
  const inquiriesByExam = Object.entries(examCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const recentInquiries = [...inquiries]
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
        <StatCard title="Inquiries Today" value={inquiriesToday} icon={Mail} />
        <StatCard title="Inquiries This Week" value={inquiriesWeek} icon={Users} />
        <StatCard title="Inquiries This Month" value={inquiriesMonth} icon={TrendingUp} />
        <StatCard title="Total Institutes" value={institutes.length} icon={Building2} onClick={() => navigate('/institutes')} />
        <StatCard title="Active Students" value={totalStudents} icon={UserCheck} />
        <StatCard
          title="Total Credits"
          value={creditBalances.reduce((sum, c) => sum + c.balance, 0)}
          icon={Coins}
          onClick={() => navigate('/credits')}
        />
        <StatCard
          title="Active Featured"
          value={featuredPurchases.filter((p) => p.status === 'ACTIVE').length}
          icon={Sparkles}
          onClick={() => navigate('/featured-purchases')}
        />
        <StatCard
          title="Pending Top-Ups"
          value={creditTopUps.filter((t) => t.status === 'PENDING').length}
          icon={IndianRupee}
          onClick={() => navigate('/credits')}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Inquiries Over Time (Last 30 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inquiriesByDate}>
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Inquiries by Exam Type</h2>
          <div className="h-72">
            {inquiriesByExam.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data" description="Inquiries will appear here" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inquiriesByExam} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {inquiriesByExam.map((_, index) => (
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Inquiries by Source</h2>
          <div className="h-64">
            {inquiriesBySource.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data" description="Inquiries will appear here" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={inquiriesBySource}>
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
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Inquiry Status Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'New', value: inquiries.filter((l) => l.status === 'NEW').length },
                  { name: 'Contacted', value: inquiries.filter((l) => l.status === 'CONTACTED').length },
                  { name: 'Follow Up', value: inquiries.filter((l) => l.status === 'FOLLOW_UP').length },
                  { name: 'Enrolled', value: inquiries.filter((l) => l.status === 'ENROLLED').length },
                  { name: 'Dropped', value: inquiries.filter((l) => l.status === 'DROPPED').length },
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
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Recent Inquiries</h2>
        </div>
        {recentInquiries.length === 0 ? (
          <EmptyState icon={Mail} title="No inquiries yet" description="New inquiries will appear here" className="py-8" />
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
                {recentInquiries.map((inquiry) => (
                  <tr key={inquiry.identifier} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">{inquiry.name}</td>
                    <td className="px-5 py-3 text-slate-600">{inquiry.phone}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={inquiry.status} />
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Widgets */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-900">Platform Activity</h2>

        {activityLoading ? (
          <div className="flex items-center justify-center h-48">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard title="Events Today" value={activityStats?.totalToday ?? 0} icon={Activity} />
              <StatCard title="Events This Week" value={activityStats?.totalWeek ?? 0} icon={Clock} />
              <StatCard title="Events This Month" value={activityStats?.totalMonth ?? 0} icon={TrendingUp} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ActivityFeedWidget logs={recentActivity} />
              <TopActorsWidget
                title="Top Active Students"
                actors={activityStats?.topStudents ?? []}
                type="student"
              />
              <TopActorsWidget
                title="Top Active Institutes"
                actors={activityStats?.topInstitutes ?? []}
                type="institute"
              />
            </div>

            <ActionDistributionWidget actionCounts={activityStats?.actionCounts ?? []} />
          </>
        )}
      </div>
    </div>
  );
}

function ActivityFeedWidget({ logs }: { logs: ActivityLog[] }) {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
        <button
          onClick={() => navigate('/activity-logs')}
          className="text-xs text-primary-600 hover:underline inline-flex items-center gap-0.5"
        >
          Browse activity <ArrowRight size={12} />
        </button>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={Activity} title="No recent activity" description="Activity will appear here" className="py-6" />
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {logs.map((log) => {
            const Icon = getActionIcon(log.actionType);
            return (
              <div key={log.identifier} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 truncate">{log.description || log.actionType.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {log.actorName || log.actorType.replace(/_/g, ' ')} · {relativeTime(log.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TopActorsWidget({
  title,
  actors,
  type,
}: {
  title: string;
  actors: { identifier: string; name: string; count: number }[];
  type: 'student' | 'institute';
}) {
  const navigate = useNavigate();
  const max = Math.max(...actors.map((a) => a.count), 1);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-base font-semibold text-slate-900 mb-4">{title}</h3>
      {actors.length === 0 ? (
        <EmptyState icon={Users} title="No data" description="Activity will appear here" className="py-6" />
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {actors.map((actor) => (
            <button
              key={actor.identifier}
              onClick={() => navigate(`/activity-logs/${type}/${actor.identifier}`)}
              className="w-full text-left group"
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 truncate max-w-[70%] group-hover:text-primary-600">
                  {actor.name || actor.identifier}
                </span>
                <span className="text-slate-500">{actor.count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all"
                  style={{ width: `${(actor.count / max) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionDistributionWidget({ actionCounts }: { actionCounts: { actionType: string; count: number }[] }) {
  const data = actionCounts
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((ac) => ({ name: ac.actionType.replace(/_/g, ' '), value: ac.count }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 className="text-base font-semibold text-slate-900 mb-4">Activity by Action Type</h3>
      {data.length === 0 ? (
        <EmptyState icon={Activity} title="No data" description="Activity will appear here" className="py-8" />
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
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
