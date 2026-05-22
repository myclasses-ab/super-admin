import { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { leadsApi, leadDistributionApi, institutesApi } from '@/api';
import type { User, Institute } from '@/types';
import { toast } from 'sonner';
import { Search, Send, Users, Check } from 'lucide-react';

export default function DistributePage() {
  const { clearLeadSelection } = useAdminStore();
  const [leads, setLeads] = useState<User[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [selectedInstitute, setSelectedInstitute] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [searchLeads, setSearchLeads] = useState('');
  const [searchInstitutes, setSearchInstitutes] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [l, i] = await Promise.all([
          leadsApi.getAll(),
          institutesApi.getAll(),
        ]);
        setLeads(l ?? []);
        setInstitutes(i ?? []);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredLeads = useMemo(() => {
    if (!searchLeads) return leads;
    const s = searchLeads.toLowerCase();
    return leads.filter((l) =>
      (l.fullName && l.fullName.toLowerCase().includes(s)) || (l.phone && l.phone.includes(s))
    );
  }, [leads, searchLeads]);

  const filteredInstitutes = useMemo(() => {
    if (!searchInstitutes) return institutes;
    const s = searchInstitutes.toLowerCase();
    return institutes.filter(
      (i) => i.name.toLowerCase().includes(s) || (i.cityIdentifier || '').toLowerCase().includes(s)
    );
  }, [institutes, searchInstitutes]);

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSend = async () => {
    if (!selectedInstitute) {
      toast.error('Please select an institute');
      return;
    }
    if (selectedLeadIds.length === 0) {
      toast.error('Please select at least one lead');
      return;
    }
    setIsSending(true);
    try {
      await leadDistributionApi.create({
        userIdentifiers: selectedLeadIds,
        instituteIdentifier: selectedInstitute,
        notes,
      });
      toast.success(`${selectedLeadIds.length} lead(s) sent successfully`);
      setSelectedLeadIds([]);
      setSelectedInstitute('');
      setNotes('');
      clearLeadSelection();
      const updated = await leadsApi.getAll();
      setLeads(updated);
    } catch {
      toast.error('Failed to send leads');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Lead Distribution</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Leads */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Users size={18} /> Available Leads
              </h2>
              <span className="text-xs text-slate-500">{selectedLeadIds.length} selected</span>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchLeads}
                onChange={(e) => setSearchLeads(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredLeads.length === 0 ? (
              <EmptyState icon={Users} title="No leads available" description="All leads have been distributed" className="py-12" />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <button
                    key={lead.identifier}
                    onClick={() => toggleLead(lead.identifier)}
                    className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                      selectedLeadIds.includes(lead.identifier) ? 'bg-primary-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        selectedLeadIds.includes(lead.identifier)
                          ? 'bg-primary-600 border-primary-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedLeadIds.includes(lead.identifier) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{lead.fullName || 'Student'}</p>
                      <p className="text-xs text-slate-500">{lead.phone || '—'} • {lead.searchedExams?.join(', ') || '—'}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Institutes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-180px)]">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Send size={18} /> Select Institute
              </h2>
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search institutes..."
                value={searchInstitutes}
                onChange={(e) => setSearchInstitutes(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredInstitutes.length === 0 ? (
              <EmptyState icon={Send} title="No institutes found" description="" className="py-12" />
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredInstitutes.map((inst) => (
                  <button
                    key={inst.identifier}
                    onClick={() => setSelectedInstitute(inst.identifier)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      selectedInstitute === inst.identifier ? 'bg-primary-50 border-l-4 border-primary-600' : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <p className="text-sm font-medium text-slate-900">{inst.name}</p>
                    <p className="text-xs text-slate-500">{inst.cityIdentifier || '—'} • {inst.subscriptionTier} • {inst.totalStudentsEnrolled || 0} students</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={isSending || selectedLeadIds.length === 0 || !selectedInstitute}
              className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              {isSending ? 'Sending...' : `Send ${selectedLeadIds.length} Lead${selectedLeadIds.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
