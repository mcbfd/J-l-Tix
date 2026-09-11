export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#050D1E] flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-3 border-[#0038A8]/20 dark:border-white/10 border-t-[#4EED15] animate-spin" />
        </div>
        <p className="text-xs font-mono font-bold text-slate-400 dark:text-white/40 tracking-wider uppercase animate-pulse">
          Chargement Jël Tix...
        </p>
      </div>
    </div>
  );
}
