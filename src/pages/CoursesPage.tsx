import { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '@/store/adminStore';
import DataTable from '@/components/shared/DataTable';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import { coursesApi, institutesApi } from '@/api';
import type { InstituteCourse, Institute } from '@/types';
import { toast } from 'sonner';
import { BookOpen } from 'lucide-react';

export default function CoursesPage() {
  const [courses, setCourses] = useState<InstituteCourse[]>([]);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [c, i] = await Promise.all([
          coursesApi.getAll(),
          institutesApi.getAll(),
        ]);
        setCourses(c ?? []);
        setInstitutes(i ?? []);
      } catch {
        toast.error('Failed to load courses');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return courses;
    const s = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.courseName.toLowerCase().includes(s) ||
        c.description.toLowerCase().includes(s)
    );
  }, [courses, search]);

  const columns = useMemo(
    () => [
      {
        accessorKey: 'courseName',
        header: 'Course Name',
        cell: ({ row }: { row: { original: InstituteCourse } }) => (
          <span className="font-medium text-slate-900">{row.original.courseName}</span>
        ),
      },
      {
        accessorKey: 'instituteIdentifier',
        header: 'Institute',
        cell: ({ row }: { row: { original: InstituteCourse } }) => {
          const inst = institutes.find((i) => i.identifier === row.original.instituteIdentifier);
          return inst?.name || '—';
        },
      },
      {
        accessorKey: 'feeMin',
        header: 'Fee Range',
        cell: ({ row }: { row: { original: InstituteCourse } }) => (
          <span className="text-sm text-slate-700">
            ₹{row.original.feeMin} - ₹{row.original.feeMax}
          </span>
        ),
      },
      {
        accessorKey: 'durationMonths',
        header: 'Duration',
        cell: ({ row }: { row: { original: InstituteCourse } }) =>
          `${row.original.durationMonths} months`,
      },
      {
        accessorKey: 'admissionOpen',
        header: 'Admission',
        cell: ({ row }: { row: { original: InstituteCourse } }) =>
          row.original.admissionOpen ? (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">Open</span>
          ) : (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">Closed</span>
          ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }: { row: { original: InstituteCourse } }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    [institutes]
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
        <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No courses found" description="Courses will appear here" />
      ) : (
        <DataTable data={filtered} columns={columns} pageSize={20} />
      )}
    </div>
  );
}
