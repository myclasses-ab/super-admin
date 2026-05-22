import { useEffect, useState, useMemo } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import LeadTrendChart from '@/components/charts/LeadTrendChart';
import LeadByCityChart from '@/components/charts/LeadByCityChart';
import { leadsApi, leadDistributionApi, institutesApi } from '@/api';
import type { User, LeadDistribution, Institute } from '@/types';
import { toast } from 'sonner';
import { TrendingUp, MapPin, Target, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#4f46e5', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'];

export default function AnalyticsPage() {
  const [leads, setLeads] = useState<User[]>([]);
  const [distributions, setDistributions] = useState<LeadDistribution[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [l, d, i] = await Promise.all([
          leadsApi.getAll(),
          leadDistributionApi.getAll(),
          institutesApi.getAll(),
        ]);
        setLeads(l ?? []);
        setDistributions(d ?? []);
        setInstitutes(i ?? []);
      } catch {
        toast.error('Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

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

  // Top cities
  const cityCounts: Record<string, number> = {};
  leads.forEach((l) => {
    (l.searchedCities || []).forEach((city) => {
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
  });
  const topCities = Object.entries(cityCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  // Top exams
  const examCounts: Record<string, number> = {};
  leads.forEach((l) => {
    (l.searchedExams || []).forEach((exam) => {
      examCounts[exam] = (examCounts[exam] || 0) + 1;
    });
  });
  const topExams = Object.entries(examCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  // Institute conversion rates
  const instLeads = useMemo(() => {
    const map: Record<string, { name: string; total: number; enrolled: number }> = {};
    distributions.forEach((d) => {
      if (!map[d.instituteIdentifier]) {
        const inst = institutes.find((i) => i.identifier === d.instituteIdentifier);
        map[d.instituteIdentifier] = { name: inst?.name || d.instituteName || 'Unknown', total: 0, enrolled: 0 };
      }
      map[d.instituteIdentifier].total++;
      if (d.status === 'CONVERTED') {
        map[d.instituteIdentifier].enrolled++;
      }
    });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((i) => ({
        name: i.name,
        value: i.total > 0 ? Math.round((i.enrolled / i.total) * 100) : 0,
      }));
  }, [distributions, institutes]);

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
            <TrendingUp size={18} /> Lead Acquisition Trend
          </h2>
          <LeadTrendChart data={leadsByDate} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <MapPin size={18} /> Top Cities
          </h2>
          {topCities.length === 0 ? (
            <EmptyState icon={MapPin} title="No data" description="" className="py-8" />
          ) : (
            <LeadByCityChart data={topCities} />
          )}
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Target size={18} /> Top Exams
          </h2>
          <div className="h-64">
            {topExams.length === 0 ? (
              <EmptyState icon={Target} title="No data" description="" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topExams} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {topExams.map((_, index) => (
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
            {instLeads.length === 0 ? (
              <EmptyState icon={Building2} title="No data" description="Distributions will appear here" className="py-8" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={instLeads} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                    {instLeads.map((_, index) => (
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
