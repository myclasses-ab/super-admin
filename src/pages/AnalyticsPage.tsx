import { useEffect, useState, useMemo } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { inquiryApi, institutesApi } from '@/api';
import type { Inquiry, Institute } from '@/types';
import { toast } from 'sonner';
import { TrendingUp, MapPin, Target, Building2 } from 'lucide-react';
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

export default function AnalyticsPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [inq, i] = await Promise.all([
          inquiryApi.getAll(),
          institutesApi.getAll(),
        ]);
        setInquiries(inq ?? []);
        setInstitutes(i ?? []);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Inquiry trend last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split('T')[0];
  });

  const inquiriesByDate = last30Days.map((date) => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    count: inquiries.filter((l) => l.createdAt.startsWith(date)).length,
  }));

  // Top target exams as proxy for interest areas
  const examCounts: Record<string, number> = {};
  inquiries.forEach((inq) => {
    if (inq.targetExam) {
      examCounts[inq.targetExam] = (examCounts[inq.targetExam] || 0) + 1;
    }
  });
  const topExams = Object.entries(examCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Top source channels
  const sourceCounts: Record<string, number> = {};
  inquiries.forEach((inq) => {
    if (inq.source) {
      sourceCounts[inq.source] = (sourceCounts[inq.source] || 0) + 1;
    }
  });
  const topSources = Object.entries(sourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Inquiries by institute
  const inquiriesByInstitute = useMemo(() => {
    const map: Record<string, { name: string; total: number; enrolled: number }> = {};
    inquiries.forEach((inq) => {
      if (!inq.instituteIdentifier) return;
      if (!map[inq.instituteIdentifier]) {
        const inst = institutes.find((i) => i.identifier === inq.instituteIdentifier);
        map[inq.instituteIdentifier] = { name: inst?.name || 'Unknown', total: 0, enrolled: 0 };
      }
      map[inq.instituteIdentifier].total++;
      if (inq.status === 'ENROLLED') {
        map[inq.instituteIdentifier].enrolled++;
      }
    });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((i) => ({
        name: i.name,
        value: i.total > 0 ? Math.round((i.enrolled / i.total) * 100) : 0,
      }));
  }, [inquiries, institutes]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>

      {/* Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={18} /> Inquiry Acquisition Trend
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inquiriesByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin size={18} /> Top Target Exams
          </h2>
          {topExams.length === 0 ? (
            <EmptyState icon={MapPin} title="No data" description="" className="py-8" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topExams}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={18} /> Top Sources
          </h2>
          <div className="h-64">
            {topSources.length === 0 ? (
              <EmptyState icon={Target} title="No data" description="" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {topSources.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={18} /> Institute Conversion Rates
          </h2>
          <div className="h-64">
            {inquiriesByInstitute.length === 0 ? (
              <EmptyState icon={Building2} title="No data" description="Inquiries will appear here" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={inquiriesByInstitute} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {inquiriesByInstitute.map((_, index) => (
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
    </div>
  );
}
