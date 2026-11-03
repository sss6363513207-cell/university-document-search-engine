import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Wifi,
  AlertCircle,
  Clock,
  RefreshCw,
} from 'lucide-react'

const services = [
  { name: 'Engine 1 — Document Processing', description: 'Document extraction and worker processes', icon: Server },
  { name: 'Engine 2 — Search Retrieval', description: 'Boolean, TF-IDF and BM25 retrieval', icon: Activity },
  { name: 'Engine 3 — Persistent Index', description: 'Index storage and version management', icon: Database },
  { name: 'PostgreSQL Database', description: 'Database connectivity and queries', icon: Database },
  { name: 'E4 Backend API', description: 'Authentication and API services', icon: Wifi },
]

const metrics = [
  { name: 'CPU Usage', value: 'Unavailable', icon: Cpu },
  { name: 'Memory Usage', value: 'Unavailable', icon: HardDrive },
  { name: 'Disk Usage', value: 'Unavailable', icon: Database },
  { name: 'API Response Time', value: 'Unavailable', icon: Activity },
]

export default function SystemHealth() {
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            ADMINISTRATION
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            System Health
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor application services, engines and infrastructure.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Live monitoring will be enabled after backend integration"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white opacity-50"
        >
          <RefreshCw size={17} />
          Refresh Status
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ name, value, icon: Icon }) => (
          <article
            key={name}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {name}
              </p>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                <Icon size={20} />
              </div>
            </div>

            <p className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Server size={20} className="text-blue-600" />
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Service Status
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Services have not yet been connected to live health endpoints.
          </p>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {services.map(({ name, description, icon: Icon }) => (
            <div
              key={name}
              className="flex flex-wrap items-center justify-between gap-4 p-5"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 p-2.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Icon size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">
                    {name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {description}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                Not Connected
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <Clock size={19} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Recent System Events
          </h2>
        </div>

        <div className="mt-6 flex flex-col items-center py-8 text-center">
          <AlertCircle size={30} className="text-slate-400" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            No live events available
          </p>
          <p className="mt-1 text-xs text-slate-500">
            System logs and events will appear here after backend integration.
          </p>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Monitoring values are unavailable until the E4 backend exposes health
        and metrics endpoints.
      </p>
    </div>
  )
}