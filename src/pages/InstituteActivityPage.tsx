import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { activityLogsApi, institutesApi } from '@/api';
import ActivityTimeline from '@/components/activity/ActivityTimeline';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { ActivityLog, Institute } from '@/types';
import { ActivityActionType } from '@/types';
import {
  ArrowLeft,
  Building2,
  Pencil,
  Plus,
  Unlock,
  MinusCircle,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

function StatItem({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

const EDIT_ACTIONS = new Set([
  ActivityActionType.INSTITUTE_UPDATED,
  ActivityActionType.COURSE_UPDATED,
  ActivityActionType.BRANCH_UPDATED,
  ActivityActionType.FACULTY_UPDATED,
  ActivityActionType.RESULT_UPDATED,
  ActivityActionType.FAQ_UPDATED,
  ActivityActionType.FACILITY_UPDATED,
  ActivityActionType.STAFF_ROLE_CHANGED,
]);

export default function InstituteActivityPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) return;

    const load = async () => {
      setLoading(true);
      try {
        const [i, timeline] = await Promise.all([
          institutesApi.getById(identifier).catch(() => null),
          activityLogsApi.getInstituteTimeline(identifier),
        ]);
        setInstitute(i);
        setLogs(timeline);
      } catch {
        toast.error('Failed to load institute activity');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [identifier]);

  const stats = useMemo(() => {
    return {
      edits: logs.filter((l) => EDIT_ACTIONS.has(l.actionType)).length,
      coursesAdded: logs.filter((l) => l.actionType === ActivityActionType.COURSE_CREATED).length,
      leadsUnlocked: logs.filter((l) => l.actionType === ActivityActionType.UNLOCKED_LEAD).length,
      creditsSpent: logs.filter((l) => l.actionType === ActivityActionType.CREDITS_DEDUCTED).length,
      featuredPurchases: logs.filter((l) => l.actionType === ActivityActionType.FEATURED_PURCHASED).length,
      staffChanges: logs.filter(
        (l) =>
          l.actionType === ActivityActionType.STAFF_ADDED ||
          l.actionType === ActivityActionType.STAFF_REMOVED ||
          l.actionType === ActivityActionType.STAFF_ROLE_CHANGED
      ).length,
    };
  }, [logs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      <button
        onClick={() => navigate('/activity-logs')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Activity Logs
      </button>

      {institute ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <Building2 size={28} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{institute.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {institute.subscriptionTier}
                </span>
                {institute.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                    <CheckCircle2 size={11} />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    <XCircle size={11} />
                    Unverified
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-slate-500">
              {logs.length} event{logs.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h1 className="text-xl font-bold text-slate-900">Institute Activity</h1>
          <p className="text-sm text-slate-500 mt-1">{logs.length} event{logs.length === 1 ? '' : 's'} found</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatItem label="Total Edits" value={stats.edits} icon={Pencil} />
        <StatItem label="Courses Added" value={stats.coursesAdded} icon={Plus} />
        <StatItem label="Leads Unlocked" value={stats.leadsUnlocked} icon={Unlock} />
        <StatItem label="Credits Spent" value={stats.creditsSpent} icon={MinusCircle} />
        <StatItem label="Featured Purchases" value={stats.featuredPurchases} icon={Sparkles} />
        <StatItem label="Staff Changes" value={stats.staffChanges} icon={Users} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Activity Timeline</h2>
        <ActivityTimeline
          logs={logs}
          emptyTitle="No activity yet"
          emptyDescription="This institute has no logged activity."
          highlightMonetization
        />
      </div>
    </div>
  );
}
