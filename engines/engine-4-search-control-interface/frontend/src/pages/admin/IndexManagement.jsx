import {
  Database,
  FileText,
  Layers,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Upload,
} from 'lucide-react'

const versions = [
  {
    version: 'v1',
    status: 'READY',
    documents: '—',
    terms: '—',
    created: '—',
    active: true,
  },
  {
    version: 'v2',
    status: 'BUILDING',
    documents: '—',
    terms: '—',
    created: '—',
    active: false,
  },
]

const statusStyles = {
  READY: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  BUILDING: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400',
}

export default function IndexManagement() {
  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            ADMINISTRATION
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            Index Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor persistent index versions and publication status.
          </p>
        </div>

        <button
          type="button"
          disabled
          title="Available after E3 integration"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white opacity-50"
        >
          <RefreshCw size={17} />
          Build New Index
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active Version', value: '—', icon: Database },
          { label: 'Total Versions', value: '—', icon: Layers },
          { label: 'Indexed Documents', value: '—', icon: FileText },
          { label: 'Index Status', value: '—', icon: CheckCircle2 },
        ].map(({ label, value, icon: Icon }) => (
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

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Current Published Index
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Version</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              Not Connected
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Publication Status</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              Not Available
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Last Published</p>
            <p className="mt-1 font-semibold text-slate-900 dark:text-white">
              —
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Index Version History
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Demonstration records. Actual versions will come from E3.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4">Version</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Documents</th>
                <th className="px-5 py-4">Terms</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {versions.map((item) => (
                <tr key={item.version}>
                  <td className="px-5 py-4 font-semibold text-slate-800 dark:text-white">
                    {item.version}
                    {item.active && (
                      <span className="ml-2 text-xs font-normal text-blue-600">
                        Active
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[item.status]}`}>
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {item.documents}
                  </td>
                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {item.terms}
                  </td>
                  <td className="px-5 py-4 text-slate-500">
                    {item.created}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled
                        title="Publish after E3 integration"
                        className="rounded-lg p-2 text-slate-400 opacity-50"
                      >
                        <Upload size={17} />
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Rollback after E3 integration"
                        className="rounded-lg p-2 text-slate-400 opacity-50"
                      >
                        <RotateCcw size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
        <AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
            Index operations are not connected
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
            Build, publish and rollback operations will be enabled only after
            the E4 backend integrates with E3's persistent index interfaces.
          </p>
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Clock size={14} />
        Index statistics are placeholders until backend integration.
      </p>
    </div>
  )
}