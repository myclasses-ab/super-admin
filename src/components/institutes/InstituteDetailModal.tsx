import { useEffect, useState } from 'react';
import { X, Star, Users, MapPin, Globe, Phone, Mail, Trash2, BookOpen, MapPinned } from 'lucide-react';
import type { Institute, InstituteCourse } from '@/types';
import { coursesApi } from '@/api';


interface InstituteDetailModalProps {
  institute: Institute | null;
  onClose: () => void;
  onDelete: () => void;
}

export default function InstituteDetailModal({ institute, onClose, onDelete }: InstituteDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses'>('overview');
  const [courses, setCourses] = useState<InstituteCourse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!institute) return;
    setActiveTab('overview');
    const load = async () => {
      setLoading(true);
      try {
        const c = await coursesApi.getByInstitute(institute.identifier);
        setCourses(c ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [institute]);

  if (!institute) return null;

  const avgRating = typeof institute.averageRating === 'string'
    ? parseFloat(institute.averageRating)
    : (institute.averageRating || 0);

  const tabs = [
    { key: 'overview' as const, label: 'Overview', icon: MapPinned },
    { key: 'courses' as const, label: 'Courses', icon: BookOpen },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 text-lg font-bold">
                {institute.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{institute.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-0.5"><Star size={12} className="text-amber-500" fill="currentColor" /> {avgRating.toFixed(1)}</span>
                  <span>•</span>
                  <span>{institute.type}</span>
                  <span>•</span>
                  <span>{institute.subscriptionTier}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 px-5 pt-3 border-b border-slate-100 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : activeTab === 'overview' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem icon={MapPin} label="City" value={institute.cityIdentifier || '—'} />
                  <InfoItem icon={Globe} label="Website" value={institute.websiteUrl || '—'} />
                  <InfoItem icon={Phone} label="Phone" value={institute.phonePrimary || '—'} />
                  <InfoItem icon={Mail} label="Email" value={institute.email || '—'} />
                  <InfoItem icon={Users} label="Students" value={String(institute.totalStudentsEnrolled || 0)} />
                  <InfoItem icon={Star} label="Reviews" value={String(institute.totalReviews || 0)} />
                </div>
                {institute.description && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-800">{institute.description}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {institute.isVerified && <Badge color="green">Verified</Badge>}
                  {institute.isFeatured && <Badge color="amber">Featured</Badge>}
                  <Badge color="blue">{institute.subscriptionTier}</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {courses.length === 0 ? (
                  <p className="text-sm text-slate-500">No courses</p>
                ) : (
                  courses.map((c) => (
                    <div key={c.identifier} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-sm font-medium text-slate-900">{c.courseName}</p>
                      <p className="text-xs text-slate-500">Fee: ₹{c.feeMin} - ₹{c.feeMax} • {c.durationMonths} months</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 flex justify-end">
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <Trash2 size={14} /> Delete Institute
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-0.5 flex items-center gap-1">
        <Icon size={12} /> {label}
      </p>
      <p className="text-sm font-medium text-slate-900 truncate">{value}</p>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const map: Record<string, string> = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[color] || 'bg-slate-100 text-slate-600'}`}>
      {children}
    </span>
  );
}
