import { useEffect, useState, useMemo } from 'react';
import DataTable from '@/components/shared/DataTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { branchesApi, institutesApi } from '@/api';
import type { Branch, Institute } from '@/types';
import { toast } from 'sonner';
import { MapPin, AlertTriangle, ExternalLink } from 'lucide-react';

export default function BranchCoordinatesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [b, i] = await Promise.all([
          branchesApi.getUnresolvedCoordinates(),
          institutesApi.getAll(),
        ]);
        setBranches(b ?? []);
        setInstitutes(i ?? []);
      } catch {
        toast.error('Failed to load unresolved branch coordinates');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const instituteByIdentifier = useMemo(() => {
    const map = new Map<string, Institute>();
    institutes.forEach((institute) => map.set(institute.identifier, institute));
    return map;
  }, [institutes]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'instituteName',
        header: 'Institute',
        cell: ({ row }: { row: { original: Branch } }) => {
          const institute = instituteByIdentifier.get(row.original.instituteIdentifier);
          return (
            <div>
              <span className="font-medium text-slate-900">
                {institute?.name || 'Unknown Institute'}
              </span>
              {institute?.email && (
                <p className="text-xs text-slate-500">{institute.email}</p>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'name',
        header: 'Branch',
        cell: ({ row }: { row: { original: Branch } }) => (
          <span className="font-medium text-slate-700">{row.original.name || '—'}</span>
        ),
      },
      {
        accessorKey: 'cityName',
        header: 'City',
        cell: ({ row }: { row: { original: Branch } }) => row.original.cityName || '—',
      },
      {
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row }: { row: { original: Branch } }) => {
          const address = [row.original.addressLine1, row.original.addressLine2]
            .filter(Boolean)
            .join(', ');
          return (
            <span className="text-sm text-slate-600 line-clamp-2">
              {address || '—'}
            </span>
          );
        },
      },
      {
        accessorKey: 'googleMapsUrl',
        header: 'Google Maps URL',
        cell: ({ row }: { row: { original: Branch } }) => {
          const url = row.original.googleMapsUrl;
          if (!url) return <span className="text-slate-400">—</span>;
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              Open Map <ExternalLink size={14} />
            </a>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: { row: { original: Branch } }) =>
          row.original.createdAt
            ? new Date(row.original.createdAt).toLocaleDateString('en-IN')
            : '—',
      },
    ],
    [instituteByIdentifier]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Branch Coordinate Failures</h1>
          <p className="text-sm text-slate-500 mt-1">
            Branches whose Google Maps URL could not be resolved to latitude/longitude.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium">
          <AlertTriangle size={16} />
          {branches.length} unresolved
        </div>
      </div>

      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <EmptyState
            icon={MapPin}
            title="All branches resolved"
            description="Every branch currently has valid coordinates."
          />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <DataTable columns={columns} data={branches} />
        </div>
      )}
    </div>
  );
}
