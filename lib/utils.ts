import type { ActivityType, Deur } from './types';

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}.${String(minutes).padStart(1, '0')}h`;
  return `${minutes}m`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function getActivityTotals(deur: Deur): Record<ActivityType, number> {
  const totals: Record<ActivityType, number> = { Operating: 0, Waiting: 0, Breakdown: 0, 'Meal Break': 0 };
  for (const a of deur.activities) {
    const dur = a.endTime !== null ? a.durationMs : Date.now() - new Date(a.startTime).getTime();
    if (a.activity in totals) totals[a.activity] += dur;
  }
  return totals;
}

export function getNetOperatingTime(deur: Deur): number {
  return getActivityTotals(deur).Operating;
}

export function getGrossProductiveTime(deur: Deur): number {
  const t = getActivityTotals(deur);
  return t.Operating + t.Waiting;
}

export function getGrossTime(deur: Deur): number {
  return getTotalShiftTime(deur);
}

export function getTotalShiftTime(deur: Deur): number {
  const t = getActivityTotals(deur);
  return t.Operating + t.Waiting + t.Breakdown + t['Meal Break'];
}

export function getCurrentActivity(deur: Deur) {
  return deur.activities.find((a) => a.endTime === null) ?? null;
}

export function getActivityColor(activity: string): string {
  switch (activity) {
    case 'Operating': return '#10b981';
    case 'Waiting': return '#f59e0b';
    case 'Breakdown': return '#ef4444';
    case 'Meal Break': return '#6366f1';
    default: return '#cbd5e1';
  }
}

export function getStatusVariant(status: string): 'blue' | 'emerald' | 'amber' | 'red' | 'slate' {
  switch (status) {
    case 'Active': return 'emerald';
    case 'Submitted':
    case 'Waiting Acknowledgement':
    case 'Acknowledged': return 'blue';
    case 'Rejected': return 'red';
    case 'Ended':
    case 'Draft': return 'amber';
    default: return 'slate';
  }
}
