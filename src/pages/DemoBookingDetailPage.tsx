import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { activityLogsApi, institutesApi, usersApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ActivityActionType, type ActivityLog, type Institute, type User } from '@/types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  MapPin,
  Phone,
  School,
  User as UserIcon,
} from 'lucide-react';

function DetailItem({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon: React.ElementType }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        <Icon size={20} className="text-primary-600" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <div className="text-sm font-medium text-slate-900 mt-0.5 break-words">{value}</div>
      </div>
    </div>
  );
}

function getMetadataValue(log: ActivityLog, key: string): string | undefined {
  if (!log.metadata || typeof log.metadata !== 'object') return undefined;
  const value = (log.metadata as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

export default function DemoBookingDetailPage() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [log, setLog] = useState<ActivityLog | null>(null);
  const [institute, setInstitute] = useState<Institute | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!identifier) return;

    const load = async () => {
      setLoading(true);
      try {
        const found = await activityLogsApi.getById(identifier).catch(() => null);
        if (!found) {
          toast.error('Demo booking not found');
          setLoading(false);
          return;
        }
        setLog(found);

        const [inst, usr] = await Promise.all([
          found.instituteIdentifier ? institutesApi.getById(found.instituteIdentifier).catch(() => null) : null,
          found.actorIdentifier ? usersApi.getById(found.actorIdentifier).catch(() => null) : null,
        ]);
        setInstitute(inst);
        setUser(usr);
      } catch {
        toast.error('Failed to load details');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [identifier]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!log) {
    return (
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6">
        <button
          onClick={() => navigate('/activity-logs/demos')}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft size={16} />
          Back to Demo Bookings
        </button>
        <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <p className="text-slate-600">Demo booking or inquiry not found.</p>
        </div>
      </div>
    );
  }

  const bookedAt = log.createdAt
    ? new Date(log.createdAt).toLocaleString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

  const phone = getMetadataValue(log, 'phone');
  const standard = getMetadataValue(log, 'standard');
  const targetExam = getMetadataValue(log, 'targetExam');
  const isDemo = log.actionType === ActivityActionType.BOOKED_DEMO;
  const pageTitle = isDemo ? 'Demo Booking' : 'Inquiry';
  const submittedAtLabel = isDemo ? 'Booked on' : 'Submitted on';

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      <button
        onClick={() => navigate('/activity-logs/demos')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Demo Bookings
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
              isDemo ? 'bg-violet-50' : 'bg-blue-50'
            }`}
          >
            <Calendar size={28} className={isDemo ? 'text-violet-600' : 'text-blue-600'} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{pageTitle}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {submittedAtLabel} {bookedAt}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DetailItem
          label="Student Name"
          value={log.actorName || user?.fullName || getMetadataValue(log, 'studentName') || '—'}
          icon={UserIcon}
        />
        <DetailItem
          label="Phone"
          value={phone || user?.phone || '—'}
          icon={Phone}
        />
        <DetailItem
          label="Email"
          value={user?.email || '—'}
          icon={Mail}
        />
        <DetailItem
          label="Institute"
          value={institute?.name || log.instituteIdentifier || '—'}
          icon={School}
        />
        <DetailItem
          label="Standard"
          value={standard || '—'}
          icon={MapPin}
        />
        <DetailItem
          label="Target Exam"
          value={targetExam || '—'}
          icon={School}
        />
        <DetailItem
          label={isDemo ? 'Booked At' : 'Submitted At'}
          value={bookedAt}
          icon={Calendar}
        />
        <DetailItem
          label="Source"
          value={getMetadataValue(log, 'source') || log.source || '—'}
          icon={Clock}
        />
      </div>

      {log.description && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Activity Note</h2>
          <p className="text-sm text-slate-700">{log.description}</p>
        </div>
      )}
    </div>
  );
}
