import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { activityLogsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { ActivityLogStatsResponse } from '@/types';
import { Activity, Building2, ChevronRight, Users } from 'lucide-react';

function HubCard({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-primary-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <Icon size={24} className="text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
              {title}
            </h2>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
        </div>
        <ChevronRight
          size={20}
          className="text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all shrink-0 mt-1"
        />
      </div>
    </button>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function ActivityLogsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ActivityLogStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await activityLogsApi.getStats();
        setStats(data);
      } catch {
        toast.error('Failed to load activity stats');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Activity</h1>
        <p className="text-sm text-slate-500">
          Pick an actor type to browse activity by institutes or students.
        </p>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatItem label="Events Today" value={stats?.totalToday ?? 0} />
          <StatItem label="Events This Week" value={stats?.totalWeek ?? 0} />
          <StatItem label="Events This Month" value={stats?.totalMonth ?? 0} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <HubCard
          title="Institute Activity"
          description="Browse all institutes and view their complete activity timeline."
          icon={Building2}
          onClick={() => navigate('/activity-logs/institutes')}
        />
        <HubCard
          title="Student Activity"
          description="Browse all students and view their complete activity timeline."
          icon={Users}
          onClick={() => navigate('/activity-logs/students')}
        />
      </div>

      <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 flex items-start gap-3">
        <Activity size={20} className="text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-900">Tip</p>
          <p className="text-sm text-blue-700 mt-0.5">
            Activity is organized around the actor. Select an institute or student from the list
            above to see everything that happened for that actor.
          </p>
        </div>
      </div>
    </div>
  );
}
