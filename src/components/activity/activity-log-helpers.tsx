import { cn } from '@/lib/utils';
import { ActivityActionType, ActivityActorType } from '@/types';
import {
  ArrowUpCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Coins,
  Eye,
  GitCompare,
  Heart,
  HeartOff,
  LogIn,
  LogOut,
  MinusCircle,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  Unlock,
  User,
  UserCog,
  UserMinus,
  UserPen,
  UserPlus,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export const actorColors: Record<ActivityActorType, string> = {
  [ActivityActorType.STUDENT]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  [ActivityActorType.INSTITUTE_ADMIN]: 'bg-blue-50 text-blue-700 border-blue-100',
  [ActivityActorType.INSTITUTE_STAFF]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  [ActivityActorType.SUPER_ADMIN]: 'bg-purple-50 text-purple-700 border-purple-100',
  [ActivityActorType.SYSTEM]: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const actionColors: Record<ActivityActionType, string> = {
  [ActivityActionType.LOGIN]: 'bg-slate-100 text-slate-700',
  [ActivityActionType.LOGIN_OTP]: 'bg-slate-100 text-slate-700',
  [ActivityActionType.LOGOUT]: 'bg-slate-100 text-slate-700',
  [ActivityActionType.TOKEN_REFRESH]: 'bg-slate-100 text-slate-700',
  [ActivityActionType.STUDENT_REGISTERED]: 'bg-emerald-50 text-emerald-700',
  [ActivityActionType.STUDENT_PROFILE_UPDATED]: 'bg-amber-50 text-amber-700',

  [ActivityActionType.INSTITUTE_CREATED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.INSTITUTE_ACTIVATED]: 'bg-green-50 text-green-700',
  [ActivityActionType.INSTITUTE_DEACTIVATED]: 'bg-red-50 text-red-700',
  [ActivityActionType.INSTITUTE_UPDATED]: 'bg-amber-50 text-amber-700',
  [ActivityActionType.INSTITUTE_DELETED]: 'bg-red-50 text-red-700',
  [ActivityActionType.INSTITUTE_VERIFIED]: 'bg-green-50 text-green-700',
  [ActivityActionType.INSTITUTE_UNVERIFIED]: 'bg-orange-50 text-orange-700',
  [ActivityActionType.INSTITUTE_FEATURED]: 'bg-pink-50 text-pink-700',
  [ActivityActionType.INSTITUTE_UNFEATURED]: 'bg-slate-100 text-slate-700',

  [ActivityActionType.COURSE_CREATED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.COURSE_UPDATED]: 'bg-amber-50 text-amber-700',
  [ActivityActionType.COURSE_DELETED]: 'bg-red-50 text-red-700',

  [ActivityActionType.SUBMITTED_INQUIRY]: 'bg-cyan-50 text-cyan-700',
  [ActivityActionType.BOOKED_DEMO]: 'bg-violet-50 text-violet-700',
  [ActivityActionType.UNLOCKED_LEAD]: 'bg-teal-50 text-teal-700',

  [ActivityActionType.BRANCH_CREATED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.BRANCH_UPDATED]: 'bg-amber-50 text-amber-700',
  [ActivityActionType.BRANCH_DELETED]: 'bg-red-50 text-red-700',

  [ActivityActionType.FACULTY_CREATED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.FACULTY_UPDATED]: 'bg-amber-50 text-amber-700',
  [ActivityActionType.FACULTY_DELETED]: 'bg-red-50 text-red-700',

  [ActivityActionType.RESULT_CREATED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.RESULT_UPDATED]: 'bg-amber-50 text-amber-700',
  [ActivityActionType.RESULT_DELETED]: 'bg-red-50 text-red-700',

  [ActivityActionType.FACILITY_CREATED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.FACILITY_UPDATED]: 'bg-amber-50 text-amber-700',

  [ActivityActionType.FAQ_CREATED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.FAQ_UPDATED]: 'bg-amber-50 text-amber-700',
  [ActivityActionType.FAQ_DELETED]: 'bg-red-50 text-red-700',

  [ActivityActionType.MEDIA_UPLOADED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.MEDIA_DELETED]: 'bg-red-50 text-red-700',

  [ActivityActionType.SUBMITTED_REVIEW]: 'bg-cyan-50 text-cyan-700',
  [ActivityActionType.REVIEW_VOTED]: 'bg-cyan-50 text-cyan-700',

  [ActivityActionType.BOOKMARKED]: 'bg-rose-50 text-rose-700',
  [ActivityActionType.REMOVED_BOOKMARK]: 'bg-slate-100 text-slate-700',
  [ActivityActionType.COMPARED_INSTITUTES]: 'bg-indigo-50 text-indigo-700',
  [ActivityActionType.SEARCHED_INSTITUTES]: 'bg-cyan-50 text-cyan-700',
  [ActivityActionType.VIEWED_INSTITUTE]: 'bg-sky-50 text-sky-700',
  [ActivityActionType.VIEWED_COURSE]: 'bg-sky-50 text-sky-700',

  [ActivityActionType.STAFF_ADDED]: 'bg-blue-50 text-blue-700',
  [ActivityActionType.STAFF_REMOVED]: 'bg-red-50 text-red-700',
  [ActivityActionType.STAFF_ROLE_CHANGED]: 'bg-amber-50 text-amber-700',

  [ActivityActionType.CREDITS_GRANTED]: 'bg-emerald-50 text-emerald-700',
  [ActivityActionType.CREDITS_DEDUCTED]: 'bg-orange-50 text-orange-700',

  [ActivityActionType.TOP_UP_REQUESTED]: 'bg-amber-50 text-amber-700',
  [ActivityActionType.TOP_UP_APPROVED]: 'bg-green-50 text-green-700',
  [ActivityActionType.TOP_UP_REJECTED]: 'bg-red-50 text-red-700',

  [ActivityActionType.FEATURED_PURCHASED]: 'bg-pink-50 text-pink-700',
  [ActivityActionType.SUBSCRIPTION_CHANGED]: 'bg-purple-50 text-purple-700',
};

export const actionIcons: Record<ActivityActionType, LucideIcon> = {
  [ActivityActionType.LOGIN]: LogIn,
  [ActivityActionType.LOGIN_OTP]: LogIn,
  [ActivityActionType.LOGOUT]: LogOut,
  [ActivityActionType.TOKEN_REFRESH]: RefreshCw,
  [ActivityActionType.STUDENT_REGISTERED]: UserPlus,
  [ActivityActionType.STUDENT_PROFILE_UPDATED]: UserPen,

  [ActivityActionType.INSTITUTE_CREATED]: Plus,
  [ActivityActionType.INSTITUTE_ACTIVATED]: Power,
  [ActivityActionType.INSTITUTE_DEACTIVATED]: Power,
  [ActivityActionType.INSTITUTE_UPDATED]: Pencil,
  [ActivityActionType.INSTITUTE_DELETED]: Trash2,
  [ActivityActionType.INSTITUTE_VERIFIED]: CheckCircle2,
  [ActivityActionType.INSTITUTE_UNVERIFIED]: XCircle,
  [ActivityActionType.INSTITUTE_FEATURED]: Star,
  [ActivityActionType.INSTITUTE_UNFEATURED]: XCircle,

  [ActivityActionType.COURSE_CREATED]: Plus,
  [ActivityActionType.COURSE_UPDATED]: Pencil,
  [ActivityActionType.COURSE_DELETED]: Trash2,

  [ActivityActionType.SUBMITTED_INQUIRY]: Send,
  [ActivityActionType.BOOKED_DEMO]: Calendar,
  [ActivityActionType.UNLOCKED_LEAD]: Unlock,

  [ActivityActionType.BRANCH_CREATED]: Plus,
  [ActivityActionType.BRANCH_UPDATED]: Pencil,
  [ActivityActionType.BRANCH_DELETED]: Trash2,

  [ActivityActionType.FACULTY_CREATED]: Plus,
  [ActivityActionType.FACULTY_UPDATED]: Pencil,
  [ActivityActionType.FACULTY_DELETED]: Trash2,

  [ActivityActionType.RESULT_CREATED]: Plus,
  [ActivityActionType.RESULT_UPDATED]: Pencil,
  [ActivityActionType.RESULT_DELETED]: Trash2,

  [ActivityActionType.FACILITY_CREATED]: Plus,
  [ActivityActionType.FACILITY_UPDATED]: Pencil,

  [ActivityActionType.FAQ_CREATED]: Plus,
  [ActivityActionType.FAQ_UPDATED]: Pencil,
  [ActivityActionType.FAQ_DELETED]: Trash2,

  [ActivityActionType.MEDIA_UPLOADED]: Plus,
  [ActivityActionType.MEDIA_DELETED]: Trash2,

  [ActivityActionType.SUBMITTED_REVIEW]: Send,
  [ActivityActionType.REVIEW_VOTED]: ThumbsUp,

  [ActivityActionType.BOOKMARKED]: Heart,
  [ActivityActionType.REMOVED_BOOKMARK]: HeartOff,
  [ActivityActionType.COMPARED_INSTITUTES]: GitCompare,
  [ActivityActionType.SEARCHED_INSTITUTES]: Search,
  [ActivityActionType.VIEWED_INSTITUTE]: Eye,
  [ActivityActionType.VIEWED_COURSE]: BookOpen,

  [ActivityActionType.STAFF_ADDED]: UserPlus,
  [ActivityActionType.STAFF_REMOVED]: UserMinus,
  [ActivityActionType.STAFF_ROLE_CHANGED]: UserCog,

  [ActivityActionType.CREDITS_GRANTED]: Coins,
  [ActivityActionType.CREDITS_DEDUCTED]: MinusCircle,

  [ActivityActionType.TOP_UP_REQUESTED]: ArrowUpCircle,
  [ActivityActionType.TOP_UP_APPROVED]: CheckCircle2,
  [ActivityActionType.TOP_UP_REJECTED]: XCircle,

  [ActivityActionType.FEATURED_PURCHASED]: Sparkles,
  [ActivityActionType.SUBSCRIPTION_CHANGED]: RefreshCw,
};

export function getActionColor(actionType: ActivityActionType): string {
  return actionColors[actionType] || 'bg-slate-100 text-slate-700';
}

export function getActionIcon(actionType: ActivityActionType): LucideIcon {
  return actionIcons[actionType] || Pencil;
}

export function getActionLabel(actionType: ActivityActionType): string {
  return actionType.replace(/_/g, ' ');
}

export function relativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function isMonetizationAction(actionType: ActivityActionType): boolean {
  return (
    actionType === ActivityActionType.CREDITS_GRANTED ||
    actionType === ActivityActionType.CREDITS_DEDUCTED ||
    actionType === ActivityActionType.TOP_UP_REQUESTED ||
    actionType === ActivityActionType.TOP_UP_APPROVED ||
    actionType === ActivityActionType.TOP_UP_REJECTED ||
    actionType === ActivityActionType.FEATURED_PURCHASED ||
    actionType === ActivityActionType.SUBSCRIPTION_CHANGED
  );
}

export function ActorBadge({ type }: { type: ActivityActorType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        actorColors[type] || 'bg-slate-100 text-slate-700 border-slate-200'
      )}
    >
      <User size={10} />
      {type.replace(/_/g, ' ')}
    </span>
  );
}

export function ActionBadge({ type }: { type: ActivityActionType }) {
  const Icon = getActionIcon(type);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        getActionColor(type)
      )}
    >
      <Icon size={10} />
      {getActionLabel(type)}
    </span>
  );
}
