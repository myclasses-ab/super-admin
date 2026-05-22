import { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import DataTable from '@/components/shared/DataTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import InstituteFiltersPanel from '@/components/institutes/InstituteFilters';
import InstituteDetailModal from '@/components/institutes/InstituteDetailModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { institutesApi, masterApi } from '@/api';
import type { Institute } from '@/types';
import { toast } from 'sonner';
import { Building2, Trash2, Eye } from 'lucide-react';

export default function InstitutesPage() {
  const { institutes, setInstitutes, instituteFilters, setCities } = useAdminStore();
  const [isLoading, setIsLoading] = useState(true);
  const [detailInstitute, setDetailInstitute] = useState<Institute | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Institute | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [i, c] = await Promise.all([
          institutesApi.getAll(),
          masterApi.getCities(),
        ]);
        setInstitutes(i ?? []);
        setCities(c ?? []);
      } catch {
        toast.error('Failed to load institutes');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [setInstitutes, setCities]);

  const filtered = useMemo(() => {
    let result = [...institutes];
    if (instituteFilters.search) {
      const s = instituteFilters.search.toLowerCase();
      result = result.filter((i) => i.name.toLowerCase().includes(s));
    }
    if (instituteFilters.isVerified !== '' && instituteFilters.isVerified !== undefined) {
      result = result.filter((i) => i.isVerified === instituteFilters.isVerified);
    }
    if (instituteFilters.isFeatured !== '' && instituteFilters.isFeatured !== undefined) {
      result = result.filter((i) => i.isFeatured === instituteFilters.isFeatured);
    }
    if (instituteFilters.subscriptionTier) {
      result = result.filter((i) => i.subscriptionTier === instituteFilters.subscriptionTier);
    }
    if (instituteFilters.cityIdentifier) {
      result = result.filter((i) => i.cityIdentifier === instituteFilters.cityIdentifier);
    }
    return result;
  }, [institutes, instituteFilters]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await institutesApi.delete(deleteTarget.identifier);
      setInstitutes(institutes.filter((i) => i.identifier !== deleteTarget.identifier));
      toast.success('Institute deleted');
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete institute');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }: { row: { original: Institute } }) => (
          <span className="font-medium text-slate-900">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'cityIdentifier',
        header: 'City',
        cell: ({ row }: { row: { original: Institute } }) => row.original.cityIdentifier || '—',
      },
      { accessorKey: 'type', header: 'Type' },
      {
        accessorKey: 'averageRating',
        header: 'Rating',
        cell: ({ row }: { row: { original: Institute } }) => {
          const val = typeof row.original.averageRating === 'string'
            ? parseFloat(row.original.averageRating)
            : (row.original.averageRating || 0);
          return val.toFixed(1);
        },
      },
      {
        accessorKey: 'totalStudentsEnrolled',
        header: 'Students',
      },
      {
        accessorKey: 'subscriptionTier',
        header: 'Tier',
        cell: ({ row }: { row: { original: Institute } }) => (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
            {row.original.subscriptionTier}
          </span>
        ),
      },
      {
        accessorKey: 'isVerified',
        header: 'Verified',
        cell: ({ row }: { row: { original: Institute } }) =>
          row.original.isVerified ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Yes</span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">No</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: { row: { original: Institute } }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }: { row: { original: Institute } }) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDetailInstitute(row.original)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              title="View"
            >
              <Eye size={16} />
            </button>
            <button
              onClick={() => setDeleteTarget(row.original)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Institutes</h1>
      <InstituteFiltersPanel />

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No institutes found" description="Try adjusting your filters" />
      ) : (
        <DataTable data={filtered} columns={columns} pageSize={20} />
      )}

      {detailInstitute && (
        <InstituteDetailModal
          institute={detailInstitute}
          onClose={() => setDetailInstitute(null)}
          onDelete={() => {
            setDetailInstitute(null);
            setDeleteTarget(detailInstitute);
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Institute"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
