import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { activityLogsApi, institutesApi } from '@/api';
import DataTable from '@/components/shared/DataTable';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ActivityActionType, type ActivityLog, type Institute } from '@/types';
import { ArrowLeft, Calendar, ChevronRight, Phone, Search, Send, User } from 'lucide-react';

interface DemoRow extends ActivityLog {
  instituteName: string;
}

function getMetadataValue(log: ActivityLog, key: string): string | undefined {
  if (!log.metadata || typeof log.metadata !== 'object') return undefined;
  const value = (log.metadata as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : undefined;
}

function getRowLabel(actionType: ActivityActionType): string {
  return actionType === ActivityActionType.BOOKED_DEMO ? 'Demo Booking' : 'Inquiry';
}

export default function DemoBookingsPage() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [demos, inquiries, i] = await Promise.all([
          activityLogsApi.search({ actionType: ActivityActionType.BOOKED_DEMO, size: 1000 }).catch(() => null),
          activityLogsApi.search({ actionType: ActivityActionType.SUBMITTED_INQUIRY, size: 1000 }).catch(() => null),
          institutesApi.getAll().catch(() => []),
        ]);
        const merged = [...(demos?.content ?? []), ...(inquiries?.content ?? [])];
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setLogs(merged);
        setInstitutes(i ?? []);
      } catch {
        toast.error('Failed to load demo bookings and inquiries');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const instituteMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const i of institutes) {
      map.set(i.identifier, i.name);
    }
    return map;
  }, [institutes]);

  const rows: DemoRow[] = useMemo(() => {
    return logs.map((log) => ({
      ...log,
      instituteName: instituteMap.get(log.instituteIdentifier) || log.instituteIdentifier || 'Unknown',
    }));
  }, [logs, instituteMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const studentName = r.actorName || getMetadataValue(r, 'studentName') || '';
      const phone = getMetadataValue(r, 'phone') || '';
      const typeLabel = getRowLabel(r.actionType).toLowerCase();
      return (
        studentName.toLowerCase().includes(q) ||
        r.instituteName.toLowerCase().includes(q) ||
        phone.toLowerCase().includes(q) ||
        typeLabel.includes(q)
      );
    });
  }, [rows, search]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'actionType',
        header: 'Type',
        cell: ({ row }: { row: { original: DemoRow } }) => {
          const isDemo = row.original.actionType === ActivityActionType.BOOKED_DEMO;
          return (
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                isDemo ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'
              }`}
            >
              {isDemo ? <Calendar size={12} /> : <Send size={12} />}
              {getRowLabel(row.original.actionType)}
            </span>
          );
        },
      },
      {
        accessorKey: 'actorName',
        header: 'By',
        cell: ({ row }: { row: { original: DemoRow } }) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <User size={14} className="text-emerald-600" />
            </div>
            <span className="font-medium text-slate-900">
              {row.original.actorName || getMetadataValue(row.original, 'studentName') || 'Unknown'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }: { row: { original: DemoRow } }) => {
          const phone = getMetadataValue(row.original, 'phone');
          return (
            <span className="flex items-center gap-1 text-sm text-slate-600">
              <Phone size={12} />
              {phone || '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'instituteName',
        header: 'Institute',
        cell: ({ row }: { row: { original: DemoRow } }) => (
          <span className="font-medium text-slate-700">{row.original.instituteName}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Submitted On',
        cell: ({ row }: { row: { original: DemoRow } }) => (
          <span className="flex items-center gap-1 text-sm text-slate-600">
            <Calendar size={12} />
            {row.original.createdAt
              ? new Date(row.original.createdAt).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: DemoRow } }) => (
          <button
            onClick={() => navigate(`/activity-logs/demos/${row.original.identifier}`)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            View Details
            <ChevronRight size={14} />
          </button>
        ),
      },
    ],
    [navigate]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      <button
        onClick={() => navigate('/activity-logs')}
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} />
        Back to Activity
      </button>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Demo Bookings & Inquiries</h1>
        <p className="text-sm text-slate-500">
          Every demo booking and inquiry logged across the platform.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, institute, phone, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No demo bookings or inquiries found"
          description={search ? 'Try a different search term' : 'No demo bookings or inquiries have been logged yet'}
        />
      ) : (
        <DataTable data={filtered} columns={columns} pageSize={20} />
      )}
    </div>
  );
}
