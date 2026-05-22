import { useEffect, useState } from 'react';
import { X, Send, Clock, MapPin, BookOpen, Phone } from 'lucide-react';
import type { User, LeadDistribution, Institute } from '@/types';
import { leadDistributionApi, institutesApi } from '@/api';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

interface LeadDetailDrawerProps {
  lead: User | null;
  onClose: () => void;
  onDistribute: () => void;
}

export default function LeadDetailDrawer({ lead, onClose, onDistribute }: LeadDetailDrawerProps) {
  const [distributions, setDistributions] = useState<LeadDistribution[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!lead) return;
    const load = async () => {
      setLoading(true);
      try {
        const all = await leadDistributionApi.getAll();
        setDistributions(all.filter((d) => d.userIdentifier === lead.identifier));
        const inst = await institutesApi.getAll();
        setInstitutes(inst);
      } catch {
        toast.error('Failed to load distributions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lead]);

  if (!lead) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Lead Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Lead Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{lead.fullName || 'Student'}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">Phone</p>
                <p className="font-medium text-slate-900">{lead.phone || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">Email</p>
                <p className="font-medium text-slate-900">{lead.email || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">Searched Cities</p>
                <p className="font-medium text-slate-900">{lead.searchedCities?.join(', ') || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-0.5">Searched Exams</p>
                <p className="font-medium text-slate-900">{lead.searchedExams?.join(', ') || '—'}</p>
              </div>
            </div>

            {lead.visitedInstituteNames && lead.visitedInstituteNames.length > 0 && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">Visited Institutes</p>
                <div className="flex flex-wrap gap-1">
                  {lead.visitedInstituteNames.map((name, i) => (
                    <span key={i} className="px-2 py-0.5 bg-white rounded text-xs text-slate-700 border border-slate-200">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs text-slate-500 mb-0.5">Created</p>
              <p className="font-medium text-slate-900">{formatDateTime(lead.createdAt)}</p>
            </div>
          </div>

          {/* Distribution History */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Distribution History</h3>
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : distributions.length === 0 ? (
              <p className="text-sm text-slate-500">Not distributed yet</p>
            ) : (
              <div className="space-y-2">
                {distributions.map((d) => {
                  const inst = institutes.find((i) => i.identifier === d.instituteIdentifier);
                  return (
                    <div key={d.identifier} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{inst?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock size={12} /> {formatDateTime(d.createdAt)}
                        </p>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100">
          <button
            onClick={onDistribute}
            className="w-full py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
          >
            <Send size={16} /> Distribute to Institute
          </button>
        </div>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-blue-50 text-blue-700',
    VIEWED: 'bg-amber-50 text-amber-700',
    CONTACTED: 'bg-purple-50 text-purple-700',
    CONVERTED: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-red-50 text-red-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}
