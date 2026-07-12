/** Loading skeleton shown while legal dashboard pages are being fetched. */
export default function LegalLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse" aria-label="Carregando..." aria-busy="true">
      {/* Page header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-[#0d1f3c]" />
        <div className="h-4 w-72 rounded-md bg-[#0d1f3c]" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-[#1a2d52]/60 bg-[#0a1628] p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-24 rounded bg-[#0d1f3c]" />
              <div className="h-8 w-8 rounded-lg bg-[#0d1f3c]" />
            </div>
            <div className="h-7 w-20 rounded bg-[#0d1f3c]" />
          </div>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-[#1a2d52]/60 bg-[#0a1628] p-5 space-y-4">
          <div className="h-5 w-36 rounded bg-[#0d1f3c]" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-[#0d1f3c] flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-3/4 rounded bg-[#0d1f3c]" />
                <div className="h-3 w-1/2 rounded bg-[#0d1f3c]" />
              </div>
              <div className="h-6 w-16 rounded-full bg-[#0d1f3c]" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[#1a2d52]/60 bg-[#0a1628] p-5 space-y-4">
          <div className="h-5 w-28 rounded bg-[#0d1f3c]" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3.5 w-full rounded bg-[#0d1f3c]" />
              <div className="h-3 w-2/3 rounded bg-[#0d1f3c]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
