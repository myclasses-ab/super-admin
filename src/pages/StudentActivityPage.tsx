import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { activityLogsApi, usersApi } from '@/api';
import ActivityTimeline from '@/components/activity/ActivityTimeline';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import type { ActivityLog, User } from '@/types';
import { ActivityActionType } from '@/types';
import { ArrowLeft, Search, Eye, Calendar, Send, Heart, Star, User as UserIcon, Phone, MapPin, GraduationCap } from 'lucide-react';

function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****';
  return '****' + phone.slice(-4);
}

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

export default function StudentActivityPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) return;

    const load = async () => {
      setLoading(true);
      try {
        const [u, timeline] = await Promise.all([
          usersApi.getById(identifier).catch(() => null),
          activityLogsApi.getStudentTimeline(identifier),
        ]);
        setUser(u);
        setLogs(timeline);
      } catch {
        toast.error('Failed to load student activity');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [identifier]);

  const stats = useMemo(() => {
    return {
      searches: logs.filter((l) => l.actionType === ActivityActionType.SEARCHED_INSTITUTES).length,
      viewed: logs.filter((l) => l.actionType === ActivityActionType.VIEWED_INSTITUTE).length,
      demos: logs.filter((l) => l.actionType === ActivityActionType.BOOKED_DEMO).length,
      inquiries: logs.filter((l) => l.actionType === ActivityActionType.SUBMITTED_INQUIRY).length,
      bookmarks: logs.filter((l) => l.actionType === ActivityActionType.BOOKMARKED).length,
      reviews: logs.filter((l) => l.actionType === ActivityActionType.SUBMITTED_REVIEW).length,
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
        onClick={() => navigate('/activity-logs/students')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Students
      </button>

      {user ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <UserIcon size={28} className="text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{user.fullName}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
                {user.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={13} />
                    {maskPhone(user.phone)}
                  </span>
                )}
                {user.cityIdentifier && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} />
                    {user.cityIdentifier}
                  </span>
                )}
                {user.currentStandard && (
                  <span className="flex items-center gap-1">
                    <GraduationCap size={13} />
                    {user.currentStandard.replace(/_/g, ' ')}
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
          <h1 className="text-xl font-bold text-slate-900">Student Activity</h1>
          <p className="text-sm text-slate-500 mt-1">{logs.length} event{logs.length === 1 ? '' : 's'} found</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatItem label="Searches" value={stats.searches} icon={Search} />
        <StatItem label="Institutes Viewed" value={stats.viewed} icon={Eye} />
        <StatItem label="Demos Booked" value={stats.demos} icon={Calendar} />
        <StatItem label="Inquiries" value={stats.inquiries} icon={Send} />
        <StatItem label="Bookmarks" value={stats.bookmarks} icon={Heart} />
        <StatItem label="Reviews" value={stats.reviews} icon={Star} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Activity Timeline</h2>
        <ActivityTimeline
          logs={logs}
          emptyTitle="No activity yet"
          emptyDescription="This student has not performed any tracked actions."
        />
      </div>
    </div>
  );
}
