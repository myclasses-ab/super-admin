import { useAdminStore } from '@/store/adminStore';
import { SubscriptionTier } from '@/types';
import { Search } from 'lucide-react';

export default function InstituteFiltersPanel() {
  const { instituteFilters, setInstituteFilters, cities } = useAdminStore();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Institute name..."
              value={instituteFilters.search || ''}
              onChange={(e) => setInstituteFilters({ ...instituteFilters, search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Verified</label>
          <select
            value={instituteFilters.isVerified === '' ? '' : String(instituteFilters.isVerified)}
            onChange={(e) => {
              const val = e.target.value;
              setInstituteFilters({ ...instituteFilters, isVerified: val === '' ? '' : val === 'true' });
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All</option>
            <option value="true">Verified</option>
            <option value="false">Not Verified</option>
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Featured</label>
          <select
            value={instituteFilters.isFeatured === '' ? '' : String(instituteFilters.isFeatured)}
            onChange={(e) => {
              const val = e.target.value;
              setInstituteFilters({ ...instituteFilters, isFeatured: val === '' ? '' : val === 'true' });
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All</option>
            <option value="true">Featured</option>
            <option value="false">Not Featured</option>
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">Tier</label>
          <select
            value={instituteFilters.subscriptionTier || ''}
            onChange={(e) => setInstituteFilters({ ...instituteFilters, subscriptionTier: e.target.value as SubscriptionTier })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Tiers</option>
            {Object.values(SubscriptionTier).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="min-w-[140px]">
          <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
          <select
            value={instituteFilters.cityIdentifier || ''}
            onChange={(e) => setInstituteFilters({ ...instituteFilters, cityIdentifier: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c.identifier} value={c.identifier}>{c.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setInstituteFilters({})}
          className="px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
