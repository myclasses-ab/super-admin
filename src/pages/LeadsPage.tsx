import { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import DataTable from '@/components/shared/DataTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import LeadFiltersPanel from '@/components/leads/LeadFilters';
import LeadDetailDrawer from '@/components/leads/LeadDetailDrawer';
import LeadDistributionModal from '@/components/leads/LeadDistributionModal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { leadsApi, leadDistributionApi, masterApi, institutesApi } from '@/api';
import { downloadCSV } from '@/lib/utils';
import type { User, Institute } from '@/types';
import { toast } from 'sonner';
import { Users, Download, Send, Trash2, MapPin, BookOpen } from 'lucide-react';

export default function LeadsPage() {
  const {
    leads,
    setLeads,
    leadFilters,
    selectedLeadIds,
    toggleLeadSelection,
    selectAllLeads,
    clearLeadSelection,
    setCities,
    setExamTypes,
  } = useAdminStore();

  const [isLoading, setIsLoading] = useState(true);
  const [detailLead, setDetailLead] = useState<User | null>(null);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [institutes, setInstitutes] = useState<Institute[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [l, c, e, i] = await Promise.all([
          leadsApi.getAll(leadFilters),
          masterApi.getCities(),
          masterApi.getExamTypes(),
          institutesApi.getAll(),
        ]);
        setLeads(l ?? []);
        setCities(c ?? []);
        setExamTypes(e ?? []);
        setInstitutes(i ?? []);
      } catch (err) {
        toast.error('Failed to load leads');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [leadFilters, setLeads, setCities, setExamTypes]);

  const filteredLeads = useMemo(() => {
    let result = [...leads];
    if (leadFilters.search) {
      const s = leadFilters.search.toLowerCase();
      result = result.filter(
        (l) => (l.fullName && l.fullName.toLowerCase().includes(s)) || (l.phone && l.phone.includes(s))
      );
    }
    return result;
  }, [leads, leadFilters]);

  const allSelected = filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l.identifier));

  const handleExport = () => {
    const rows = filteredLeads.map((l) => ({
      Name: l.fullName || '—',
      Phone: l.phone || '—',
      City: l.searchedCities?.join(', ') || '—',
      Exams: l.searchedExams?.join(', ') || '—',
      Visited: l.visitedInstituteNames?.join(', ') || '—',
      Created: l.createdAt,
    }));
    downloadCSV('leads.csv', rows);
    toast.success('CSV exported');
  };

  const handleDistribute = async (instituteIdentifier: string, notes: string) => {
    await leadDistributionApi.create({
      userIdentifiers: selectedLeadIds,
      instituteIdentifier,
      notes,
    });
    clearLeadSelection();
    const updated = await leadsApi.getAll(leadFilters);
    setLeads(updated);
  };

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() =>
              allSelected
                ? clearLeadSelection()
                : selectAllLeads(filteredLeads.map((l) => l.identifier))
            }
            className="w-4 h-4 rounded border-slate-300 text-primary-600"
          />
        ),
        cell: ({ row }: { row: { original: User } }) => (
          <input
            type="checkbox"
            checked={selectedLeadIds.includes(row.original.identifier)}
            onChange={() => toggleLeadSelection(row.original.identifier)}
            className="w-4 h-4 rounded border-slate-300 text-primary-600"
          />
        ),
      },
      {
        accessorKey: 'fullName',
        header: 'Name',
        cell: ({ row }: { row: { original: User } }) => (
          <span className="font-medium text-slate-900">{row.original.fullName || '—'}</span>
        ),
      },
      { accessorKey: 'phone', header: 'Phone' },
      {
        accessorKey: 'searchedCities',
        header: 'Cities',
        cell: ({ row }: { row: { original: User } }) => (
          <span className="text-xs">{row.original.searchedCities?.join(', ') || '—'}</span>
        ),
      },
      {
        accessorKey: 'searchedExams',
        header: 'Exams',
        cell: ({ row }: { row: { original: User } }) => (
          <span className="text-xs">{row.original.searchedExams?.join(', ') || '—'}</span>
        ),
      },
      {
        accessorKey: 'visitedInstituteNames',
        header: 'Visited',
        cell: ({ row }: { row: { original: User } }) => (
          <span className="text-xs">{row.original.visitedInstituteNames?.join(', ') || '—'}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created At',
        cell: ({ row }: { row: { original: User } }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    [allSelected, filteredLeads, selectedLeadIds, toggleLeadSelection, selectAllLeads, clearLeadSelection]
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
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-slate-900">All Leads</h1>
        <div className="flex items-center gap-2">
          {selectedLeadIds.length > 0 && (
            <>
              <span className="text-sm text-slate-500">{selectedLeadIds.length} selected</span>
              <button
                onClick={() => setShowDistributeModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                <Send size={14} /> Distribute
              </button>
              <button
                onClick={() => setShowConfirmClear(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Trash2 size={14} /> Clear
              </button>
            </>
          )}
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <LeadFiltersPanel />

      {filteredLeads.length === 0 ? (
        <EmptyState icon={Users} title="No leads found" description="Try adjusting your filters" />
      ) : (
        <DataTable
          data={filteredLeads}
          columns={columns}
          pageSize={20}
        />
      )}

      {detailLead && (
        <LeadDetailDrawer
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onDistribute={() => {
            setDetailLead(null);
            selectAllLeads([detailLead.identifier]);
            setShowDistributeModal(true);
          }}
        />
      )}

      <LeadDistributionModal
        open={showDistributeModal}
        onClose={() => setShowDistributeModal(false)}
        institutes={institutes}
        selectedLeadIds={selectedLeadIds}
        onDistribute={handleDistribute}
      />

      <ConfirmDialog
        open={showConfirmClear}
        title="Clear Selection"
        description="Are you sure you want to clear the selected leads?"
        confirmLabel="Clear"
        onConfirm={() => {
          clearLeadSelection();
          setShowConfirmClear(false);
        }}
        onCancel={() => setShowConfirmClear(false)}
      />
    </div>
  );
}
