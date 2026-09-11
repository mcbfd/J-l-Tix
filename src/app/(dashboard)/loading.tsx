export default function DashboardLoading() {
  return (
    <div className="flex flex-col w-full gap-8 animate-pulse">
      {/* 4 Stat Cards Row Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#0B1936] rounded-2xl p-5 shadow-xs border border-slate-200/80 dark:border-white/10 flex flex-col justify-between h-[130px]"
          >
            <div className="flex justify-between items-start">
              <div className="h-3 w-24 bg-slate-200 dark:bg-white/10 rounded" />
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10" />
            </div>
            <div>
              <div className="h-7 w-32 bg-slate-200 dark:bg-white/10 rounded mb-2" />
              <div className="h-2.5 w-16 bg-slate-100 dark:bg-white/10 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics & Feed Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#0B1936] rounded-2xl p-6 shadow-xs h-[420px] border border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="h-4 w-44 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-20 bg-slate-100 dark:bg-white/10 rounded" />
          </div>
          <div className="flex-1 flex items-end justify-between gap-3 pt-8 pb-4">
            {[40, 65, 30, 85, 55, 70, 90].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-slate-200/70 dark:bg-white/10 rounded-t-lg"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between pt-2">
            {[1, 2, 3, 4, 5, 6, 7].map((d) => (
              <div key={d} className="h-2 w-8 bg-slate-100 dark:bg-white/10 rounded" />
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-white dark:bg-[#0B1936] rounded-2xl p-6 shadow-xs h-[420px] border border-slate-200/80 dark:border-white/10 flex flex-col">
          <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100 dark:border-white/5">
            <div className="h-4 w-36 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-10 bg-slate-100 dark:bg-white/10 rounded-full" />
          </div>
          <div className="space-y-3 flex-1">
            {[1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-white/10 rounded" />
                  <div className="h-2 w-1/2 bg-slate-100 dark:bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((k) => (
          <div
            key={k}
            className="bg-white dark:bg-[#0B1936] rounded-2xl p-6 shadow-xs h-[180px] border border-slate-200/80 dark:border-white/10 flex flex-col justify-between"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-white/10 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-slate-200 dark:bg-white/10 rounded" />
                <div className="h-3 w-full bg-slate-100 dark:bg-white/10 rounded" />
              </div>
            </div>
            <div className="self-end h-8 w-28 bg-slate-200 dark:bg-white/10 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
