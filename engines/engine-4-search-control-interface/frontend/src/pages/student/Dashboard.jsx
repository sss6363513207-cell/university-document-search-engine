import {
  FileText,
  Search,
  Upload,
  Database,
  ArrowUpRight,
  Clock3,
} from 'lucide-react'

const statistics = [
  {
    label: 'Available Documents',
    value: '—',
    description: 'Documents you can access',
    icon: FileText,
  },
  {
    label: 'Searches Performed',
    value: '—',
    description: 'Your search activity',
    icon: Search,
  },
  {
    label: 'Recent Uploads',
    value: '—',
    description: 'Recently indexed documents',
    icon: Upload,
  },
  {
    label: 'Active Index Version',
    value: '—',
    description: 'Current published index',
    icon: Database,
  },
]

export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          ACADEMIC WORKSPACE
        </p>

        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Search, discover and access academic documents.
            </p>
          </div>

          <a
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Search size={17} />
            Search Documents
          </a>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((stat) => {
          const Icon = stat.icon

          return (
            <article
              key={stat.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </span>

                <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <Icon size={19} />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {stat.description}
              </p>
            </article>
          )
        })}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">
                Academic Document Search
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Find research papers, reports and university documents.
              </p>
            </div>

            <Search className="text-blue-600 dark:text-blue-400" size={22} />
          </div>

          <div className="mt-6">
            <a
              href="/search"
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500 transition hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:hover:border-blue-500"
            >
              <span>Explore academic documents...</span>
              <ArrowUpRight size={17} />
            </a>
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Clock3 size={19} className="text-blue-600 dark:text-blue-400" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Recent Activity
            </h2>
          </div>

          <p className="mt-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Your recent searches and document activity will appear here when
            activity tracking is integrated.
          </p>
        </article>
      </section>

      <p className="text-xs text-slate-400">
        Dashboard statistics are placeholders until backend integration.
      </p>
    </div>
  )
}