export function PostCardSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200/60 bg-white/50 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 animate-pulse">
      <div className="h-44 w-full rounded-xl bg-zinc-300 dark:bg-zinc-800 mb-4"></div>
      <div className="h-4 w-1/3 rounded bg-zinc-300 dark:bg-zinc-800 mb-3"></div>
      <div className="h-6 w-5/6 rounded bg-zinc-300 dark:bg-zinc-800 mb-2"></div>
      <div className="h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800 mb-1"></div>
      <div className="h-4 w-4/5 rounded bg-zinc-200 dark:bg-zinc-800 mb-4"></div>
      <div className="flex items-center gap-3 mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <div className="h-8 w-8 rounded-full bg-zinc-300 dark:bg-zinc-800"></div>
        <div className="flex-grow">
          <div className="h-3 w-1/4 rounded bg-zinc-300 dark:bg-zinc-800"></div>
        </div>
      </div>
    </div>
  );
}

export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-4 w-20 rounded bg-zinc-300 dark:bg-zinc-800 mb-6"></div>
      <div className="h-10 w-3/4 rounded bg-zinc-300 dark:bg-zinc-800 mb-4"></div>
      <div className="flex items-center gap-4 mb-8">
        <div className="h-12 w-12 rounded-full bg-zinc-300 dark:bg-zinc-800"></div>
        <div className="flex-grow">
          <div className="h-4 w-32 rounded bg-zinc-300 dark:bg-zinc-800 mb-2"></div>
          <div className="h-3 w-20 rounded bg-zinc-300 dark:bg-zinc-800"></div>
        </div>
      </div>
      <div className="h-96 w-full rounded-2xl bg-zinc-300 dark:bg-zinc-800 mb-8 animate-pulse"></div>
      <div className="space-y-4">
        <div className="h-4 w-full rounded bg-zinc-300 dark:bg-zinc-800"></div>
        <div className="h-4 w-full rounded bg-zinc-300 dark:bg-zinc-800"></div>
        <div className="h-4 w-5/6 rounded bg-zinc-300 dark:bg-zinc-800"></div>
        <div className="h-4 w-2/3 rounded bg-zinc-300 dark:bg-zinc-800"></div>
      </div>
    </div>
  );
}

export function StatsDashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
      {[1, 2, 3, 4].map(idx => (
        <div key={idx} className="rounded-2xl border border-zinc-200/60 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="h-4 w-20 rounded bg-zinc-300 dark:bg-zinc-800 mb-3"></div>
          <div className="h-8 w-1/2 rounded bg-zinc-300 dark:bg-zinc-800"></div>
        </div>
      ))}
    </div>
  );
}
