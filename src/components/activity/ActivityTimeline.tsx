import { cn, formatDateTime } from '@/lib/utils';
import EmptyState from '@/components/shared/EmptyState';
import type { ActivityLog } from '@/types';
import { ActivityActionType } from '@/types';
import {
  ActionBadge,
  getActionIcon,
  getActionColor,
  isMonetizationAction,
  relativeTime,
} from './activity-log-helpers';
import { Activity } from 'lucide-react';

interface ActivityTimelineProps {
  logs: ActivityLog[];
  emptyTitle: string;
  emptyDescription: string;
  highlightMonetization?: boolean;
}

function groupByDate(logs: ActivityLog[]): { label: string; logs: ActivityLog[] }[] {
  const groups = new Map<string, ActivityLog[]>();

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  for (const log of logs) {
    const date = new Date(log.createdAt).toDateString();
    let label: string;
    if (date === today) label = 'Today';
    else if (date === yesterday) label = 'Yesterday';
    else label = new Date(log.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(log);
  }

  return Array.from(groups.entries()).map(([label, logs]) => ({ label, logs }));
}

function TimelineItem({
  log,
  highlightMonetization,
}: {
  log: ActivityLog;
  highlightMonetization?: boolean;
}) {
  const Icon = getActionIcon(log.actionType);
  const isMonetization = highlightMonetization && isMonetizationAction(log.actionType);

  return (
    <div className="relative pl-8 sm:pl-10">
      {/* connector line */}
      <div className="absolute left-[11px] sm:left-[13px] top-8 bottom-[-24px] w-px bg-slate-200" />

      {/* icon bubble */}
      <div
        className={cn(
          'absolute left-0 top-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border',
          isMonetization
            ? 'bg-amber-50 border-amber-200 text-amber-600'
            : 'bg-white border-slate-200 text-slate-500'
        )}
      >
        <Icon size={14} />
      </div>

      <div
        className={cn(
          'bg-white rounded-2xl border p-4 shadow-sm',
          isMonetization ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <ActionBadge type={log.actionType} />
            <span className="text-xs text-slate-500">{log.entityType}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span title={formatDateTime(log.createdAt)}>{relativeTime(log.createdAt)}</span>
          </div>
        </div>

        <p className="text-sm text-slate-800 mb-2">{log.description || '-'}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          {log.actorName && <span>by {log.actorName}</span>}
          {log.entityName && <span className="truncate max-w-[200px]">on {log.entityName}</span>}
        </div>
      </div>
    </div>
  );
}

export default function ActivityTimeline({
  logs,
  emptyTitle,
  emptyDescription,
  highlightMonetization,
}: ActivityTimelineProps) {
  if (logs.length === 0) {
    return <EmptyState icon={Activity} title={emptyTitle} description={emptyDescription} className="py-12" />;
  }

  const groups = groupByDate(logs);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.label}>
          <h3 className="text-sm font-semibold text-slate-500 mb-4 sticky top-0 bg-slate-50/95 py-2 px-1 rounded-lg z-10">
            {group.label}
          </h3>
          <div className="space-y-6">
            {group.logs.map((log) => (
              <TimelineItem key={log.identifier} log={log} highlightMonetization={highlightMonetization} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
