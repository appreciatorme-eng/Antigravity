import Link from 'next/link';
import { History, MapPin, MessageSquare, Search } from 'lucide-react';
import { GlassBadge } from '@/components/glass/GlassBadge';
import { GlassButton } from '@/components/glass/GlassButton';
import { GlassCard } from '@/components/glass/GlassCard';
import { cn } from '@/lib/utils';
import type { ActivityItem } from './types';

interface AdminActivitySectionProps {
  loading: boolean;
  activities: ActivityItem[];
}

function formatActivityTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function AdminActivitySection({ loading, activities }: AdminActivitySectionProps) {
  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-secondary" />
            <h2 className="text-2xl font-serif tracking-tight text-secondary dark:text-white">
              Recent Activity
            </h2>
          </div>
          <Link href="/admin/operations">
            <GlassButton
              variant="ghost"
              className="h-8 rounded-lg border-gray-100 text-[10px] font-black uppercase tracking-widest"
            >
              View All History
            </GlassButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {loading ? (
            Array(4)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl border border-gray-100 bg-gray-50 dark:border-slate-800 dark:bg-slate-800/50"
                />
              ))
          ) : activities.length > 0 ? (
            activities.map((item) => (
              <GlassCard
                key={item.id}
                padding="md"
                className="group border-gray-100 transition-all hover:border-primary/20 hover:bg-primary/[0.01]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      'flex h-12 w-12 items-center justify-center rounded-2xl transition-transform group-hover:scale-105',
                      item.type === 'trip'
                        ? 'bg-emerald-50 text-emerald-600'
                        : item.type === 'inquiry'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                    )}
                  >
                    {item.type === 'trip' ? (
                      <MapPin className="h-5 w-5" />
                    ) : item.type === 'inquiry' ? (
                      <Search className="h-5 w-5" />
                    ) : (
                      <MessageSquare className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h4 className="truncate text-sm font-black uppercase tracking-tight text-secondary dark:text-white">
                        {item.title}
                      </h4>
                      <span className="whitespace-nowrap text-[10px] font-bold text-text-muted">
                        {formatActivityTime(item.timestamp)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs font-medium uppercase tracking-tighter text-text-muted">
                      {item.description}
                    </p>
                  </div>
                  <div className="pl-4">
                    <GlassBadge
                      variant={
                        item.status === 'confirmed' || item.status === 'sent' || item.status === 'new'
                          ? 'success'
                          : 'secondary'
                      }
                      className="text-[10px] font-black uppercase tracking-[0.1em]"
                    >
                      {item.status}
                    </GlassBadge>
                  </div>
                </div>
              </GlassCard>
            ))
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-text-muted">No recent activity</p>
            </div>
          )}
        </div>
    </div>
  );
}
