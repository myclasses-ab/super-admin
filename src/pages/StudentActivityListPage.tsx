import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { activityLogsApi, usersApi } from '@/api';
import DataTable from '@/components/shared/DataTable';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { UserRole, type StudentActivitySummary, type User } from '@/types';
import { ArrowLeft, ChevronRight, Search, Users } from 'lucide-react';

interface StudentRow extends User {
  eventCount: number;
  lastActiveAt: string | null;
}

function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****';
  return '****' + phone.slice(-4);
}

export default function StudentActivityListPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [summaries, setSummaries] = useState<StudentActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [u, s] = await Promise.all([
          usersApi.getAll().catch(() => []),
          activityLogsApi.getStudentSummaries().catch(() => []),
        ]);
        setUsers((u ?? []).filter((user) => user.role === UserRole.STUDENT));
        setSummaries(s ?? []);
      } catch {
        toast.error('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summaryMap = useMemo(() => {
    const map = new Map<string, StudentActivitySummary>();
    for (const s of summaries) {
      map.set(s.identifier, s);
    }
    return map;
  }, [summaries]);

  const rows: StudentRow[] = useMemo(() => {
    return users.map((u) => {
      const s = summaryMap.get(u.identifier);
      return {
        ...u,
        eventCount: s?.eventCount ?? 0,
        lastActiveAt: s?.lastActiveAt ?? null,
      };
    });
  }, [users, summaryMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.fullName?.toLowerCase().includes(q) ||
        (r.phone ?? '').toLowerCase().includes(q) ||
        (r.cityIdentifier ?? '').toLowerCase().includes(q) ||
        (r.currentStandard ?? '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'fullName',
        header: 'Student',
        cell: ({ row }: { row: { original: StudentRow } }) => (
          <span className="font-medium text-slate-900">{row.original.fullName || 'Unnamed'}</span>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }: { row: { original: StudentRow } }) => maskPhone(row.original.phone),
      },
      {
        accessorKey: 'cityIdentifier',
        header: 'City',
        cell: ({ row }: { row: { original: StudentRow } }) => row.original.cityIdentifier || '—',
      },
      {
        accessorKey: 'currentStandard',
        header: 'Standard',
        cell: ({ row }: { row: { original: StudentRow } }) =>
          row.original.currentStandard
            ? row.original.currentStandard.replace(/_/g, ' ')
            : '—',
      },
      {
        accessorKey: 'eventCount',
        header: 'Events',
        cell: ({ row }: { row: { original: StudentRow } }) => (
          <span className="text-sm text-slate-600">{row.original.eventCount}</span>
        ),
      },
      {
        accessorKey: 'lastActiveAt',
        header: 'Last Active',
        cell: ({ row }: { row: { original: StudentRow } }) =>
          row.original.lastActiveAt
            ? new Date(row.original.lastActiveAt).toLocaleString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '—',
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: StudentRow } }) => (
          <button
            onClick={() => navigate(`/activity-logs/student/${row.original.identifier}`)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            View Activity
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
        <h1 className="text-2xl font-bold text-slate-900">Student Activity</h1>
        <p className="text-sm text-slate-500">
          Select a student to view their complete activity timeline.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, city, or standard..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No students found"
          description={search ? 'Try a different search term' : 'No students available'}
        />
      ) : (
        <DataTable data={filtered} columns={columns} pageSize={20} />
      )}
    </div>
  );
}
