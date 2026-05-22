import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function StatCard({ title, value, icon: Icon, trend, trendUp, className, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-slate-200 p-5 shadow-sm',
        onClick && 'cursor-pointer hover:border-primary-300 hover:shadow-md transition-all',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium mt-1', trendUp ? 'text-green-600' : 'text-red-600')}>
              {trendUp ? '↑' : '↓'} {trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
          <Icon size={20} className="text-primary-600" />
        </div>
      </div>
    </div>
  );
}
