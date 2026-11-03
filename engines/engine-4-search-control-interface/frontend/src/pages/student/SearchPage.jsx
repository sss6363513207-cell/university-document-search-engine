import { Search, SlidersHorizontal } from 'lucide-react'

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Search Documents
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Discover academic papers, research and university documents.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 px-4 dark:border-slate-700">
            <Search size={19} className="text-slate-400" />
            <input
              type="search"
              placeholder="Enter keywords, title or phrase..."
              className="w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>

          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 opacity-60 dark:border-slate-700 dark:text-slate-300"
          >
            <SlidersHorizontal size={17} />
            Filters
          </button>

          <button
            type="button"
            disabled
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white opacity-60"
          >
            Search
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          Search execution will be enabled after E2 and backend integration.
        </p>
      </section>

      <section className="rounded-xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
        <Search size={32} className="mx-auto text-slate-400" />
        <h2 className="mt-4 font-semibold text-slate-800 dark:text-white">
          Ready to search
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Search results will appear here once the retrieval API is connected.
        </p>
      </section>
    </div>
  )
}