import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  growth?: number;
  tag?: string;
  iconName: string;
  variant?: 'primary' | 'tertiary' | 'secondary' | 'neutral';
}

export function StatCard({
  title,
  value,
  unit,
  growth,
  tag,
  iconName,
  variant = 'primary',
}: StatCardProps) {
  const isTertiary = variant === 'tertiary';

  return (
    <div
      className="bg-white dark:bg-[#0B1936] rounded-2xl p-5 shadow-xs relative overflow-hidden group border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all duration-200"
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isTertiary
              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-[#4EED15]'
              : 'bg-blue-50 text-[#0038A8] dark:bg-blue-950/50 dark:text-[#4EED15]'
          }`}
        >
          <span className="material-symbols-outlined text-[22px]">{iconName}</span>
        </div>

        {growth !== undefined && (
          <span className="text-[#059669] dark:text-[#4EED15] font-extrabold text-xs flex items-center gap-1 bg-emerald-50 dark:bg-white/10 px-2.5 py-1 rounded-full">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            +{growth}%
          </span>
        )}

        {tag && (
          <span className="text-slate-600 dark:text-white/80 font-bold text-xs flex items-center gap-1 bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-full">
            {tag}
          </span>
        )}
      </div>

      <p className="text-xs font-mono font-extrabold text-slate-500 dark:text-white/60 uppercase tracking-wider mb-1 relative z-10">
        {title}
      </p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight relative z-10" suppressHydrationWarning>
        {value}{' '}
        {unit && (
          <span className="text-sm text-slate-500 dark:text-white/70 font-bold" suppressHydrationWarning>{unit}</span>
        )}
      </h3>
    </div>
  );
}
