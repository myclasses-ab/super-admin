import { useEffect, useMemo, useState } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import {
  featuredPurchasesApi,
  institutesApi,
} from '@/api';
import type { FeaturedPurchase, Institute } from '@/types';
import { toast } from 'sonner';
import {
  Sparkles,
  Search,
  Filter,
  Calendar,
  Clock,
} from 'lucide-react';

export default function FeaturedPurchasesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [purchases, setPurchases] = useState<FeaturedPurchase[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [purchs, insts] = await Promise.all([
          featuredPurchasesApi.getAll(),
          institutesApi.getAll(),
        ]);
        setPurchases(purchs ?? []);
        setInstitutes(insts ?? []);
      } catch {
        toast.error('Failed to load featured purchases');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredPurchases = useMemo(() => {
    let result = [...purchases];
    if (statusFilter !== 'ALL') {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) => {
        const inst = institutes.find((i) => i.identifier === p.instituteIdentifier);
        return inst?.name.toLowerCase().includes(s);
      });
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [purchases, statusFilter, search, institutes]);

  const activeCount = useMemo(() => purchases.filter((p) => p.status === 'ACTIVE').length, [purchases]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Featured Purchases</h1>
          <p className="text-sm text-slate-500 mt-1">
            {activeCount} active purchase{activeCount !== 1 ? 's' : ''} currently running
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Sparkles size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Active Purchases</p>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
              <Calendar size={20} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Purchases</p>
              <p className="text-2xl font-bold text-slate-900">{purchases.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Clock size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Credits Spent</p>
              <p className="text-2xl font-bold text-slate-900">
                {purchases.reduce((sum, p) => sum + p.cost, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by institute..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {filteredPurchases.length === 0 ? (
          <EmptyState icon={Sparkles} title="No featured purchases found" description="Purchases will appear here when institutes buy featured badges" className="py-12" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Institute</th>
                  <th className="text-left px-5 py-3 font-medium">Duration</th>
                  <th className="text-left px-5 py-3 font-medium">Cost</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                  <th className="text-left px-5 py-3 font-medium">Expires At</th>
                  <th className="text-left px-5 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((purchase) => {
                  const inst = institutes.find((i) => i.identifier === purchase.instituteIdentifier);
                  const isExpired = purchase.status === 'EXPIRED' || new Date(purchase.expiresAt) < new Date();
                  return (
                    <tr key={purchase.identifier} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-slate-900">{inst?.name || 'Unknown'}</p>
                      </td>
                      <td className="px-5 py-3 text-slate-600">{purchase.durationDays} days</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{purchase.cost} credits</td>
                      <td className="px-5 py-3">
                        <PurchaseStatusBadge status={purchase.status} isExpired={isExpired} />
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {purchase.expiresAt ? new Date(purchase.expiresAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PurchaseStatusBadge({ status, isExpired }: { status: string; isExpired: boolean }) {
  const styles: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700',
    EXPIRED: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-red-50 text-red-700',
  };
  const label = status === 'ACTIVE' && isExpired ? 'EXPIRED' : status;
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[label] || 'bg-slate-100 text-slate-600'}`}>
      {label}
    </span>
  );
}
