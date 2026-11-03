import {
  FileText,
  Users,
  Database,
  Activity,
  ShieldCheck,
  Server,
  Clock,
  ArrowUpRight,
} from 'lucide-react'

const statistics = [
  { label: 'Total Documents', value: '—', icon: FileText },
  { label: 'Registered Users', value: '—', icon: Users },
  { label: 'Index Versions', value: '—', icon: Database },
  { label: 'System Health', value: '—', icon: Activity },
]

const services = [
  { name: 'Document Processing Engine (E1)', status: 'Not Connected' },
  { name: 'Search Retrieval Engine (E2)', status: 'Not Connected' },
  { name: 'Persistent Index Engine (E3)', status: 'Not Connected' },
  { name: 'PostgreSQL Database', status: 'Not Connected' },
]

export default function AdminDashboard() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section>
        <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
          ADMINISTRATION
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Monitor university documents, users, indexing and system services.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Icon size={20} />
              </div>
            </div>
            <p className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <Server size={20} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Engine Status
            </h2>
          </div>

          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {services.map((service) => (
              <div
                key={service.name}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {service.name}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {service.status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Administration
            </h2>
          </div>

          <div className="mt-5 space-y-3">
            {[
              ['User & Role Management', Users],
              ['Index Management', Database],
              ['System Monitoring', Activity],
            ].map(([label, Icon]) => (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Icon size={19} className="text-blue-600" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                  </span>
                </div>
                <ArrowUpRight size={17} className="text-slate-400" />
              </div>
            ))}
          </div>
        </article>
      </section>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Clock size={14} />
        Statistics and service health will be populated through backend APIs.
      </p>
    </div>
  )
}