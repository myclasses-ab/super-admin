import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { activityLogsApi, institutesApi } from '@/api';
import DataTable from '@/components/shared/DataTable';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import type { Institute, InstituteActivitySummary } from '@/types';
import { ArrowLeft, Building2, ChevronRight, Search } from 'lucide-react';

interface InstituteRow extends Institute {
  eventCount: number;
  lastActiveAt: string | null;
}

export default function InstituteActivityListPage() {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [summaries, setSummaries] = useState<InstituteActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [i, s] = await Promise.all([
          institutesApi.getAll().catch(() => []),
          activityLogsApi.getInstituteSummaries().catch(() => []),
        ]);
        setInstitutes(i ?? []);
        setSummaries(s ?? []);
      } catch {
        toast.error('Failed to load institutes');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const summaryMap = useMemo(() => {
    const map = new Map<string, InstituteActivitySummary>();
    for (const s of summaries) {
      map.set(s.identifier, s);
    }
    return map;
  }, [summaries]);

  const rows: InstituteRow[] = useMemo(() => {
    return institutes.map((i) => {
      const s = summaryMap.get(i.identifier);
      return {
        ...i,
        eventCount: s?.eventCount ?? 0,
        lastActiveAt: s?.lastActiveAt ?? null,
      };
    });
  }, [institutes, summaryMap]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.cityIdentifier ?? '').toLowerCase().includes(q) ||
        (r.subscriptionTier ?? '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Institute',
        cell: ({ row }: { row: { original: InstituteRow } }) => (
          <span className="font-medium text-slate-900">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'cityIdentifier',
        header: 'City',
        cell: ({ row }: { row: { original: InstituteRow } }) => row.original.cityIdentifier || '—',
      },
      {
        accessorKey: 'subscriptionTier',
        header: 'Tier',
        cell: ({ row }: { row: { original: InstituteRow } }) => (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {row.original.subscriptionTier}
          </span>
        ),
      },
      {
        accessorKey: 'isVerified',
        header: 'Verified',
        cell: ({ row }: { row: { original: InstituteRow } }) =>
          row.original.isVerified ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Yes</span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">No</span>
          ),
      },
      {
        accessorKey: 'eventCount',
        header: 'Events',
        cell: ({ row }: { row: { original: InstituteRow } }) => (
          <span className="text-sm text-slate-600">{row.original.eventCount}</span>
        ),
      },
      {
        accessorKey: 'lastActiveAt',
        header: 'Last Active',
        cell: ({ row }: { row: { original: InstituteRow } }) =>
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
        cell: ({ row }: { row: { original: InstituteRow } }) => (
          <button
            onClick={() => navigate(`/activity-logs/institute/${row.original.identifier}`)}
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
        <h1 className="text-2xl font-bold text-slate-900">Institute Activity</h1>
        <p className="text-sm text-slate-500">
          Select an institute to view its complete activity timeline.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="relative max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, city, or tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No institutes found"
          description={search ? 'Try a different search term' : 'No institutes available'}
        />
      ) : (
        <DataTable data={filtered} columns={columns} pageSize={20} />
      )}
    </div>
  );
}
