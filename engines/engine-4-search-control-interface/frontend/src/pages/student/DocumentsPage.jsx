import { useState } from 'react'
import {
  FileText,
  Search,
  Eye,
  Download,
  Filter,
  Lock,
  Globe,
  Building2,
} from 'lucide-react'

const documents = [
  {
    id: 1,
    title: 'Research Paper — Machine Learning',
    filename: 'machine_learning.pdf',
    department: 'Computer Science',
    type: 'PDF',
    access: 'PUBLIC',
    date: '—',
  },
  {
    id: 2,
    title: 'University Academic Report',
    filename: 'academic_report.pdf',
    department: 'Administration',
    type: 'PDF',
    access: 'UNIVERSITY',
    date: '—',
  },
]

const accessStyles = {
  PUBLIC: 'bg-green-100 text-green-700',
  UNIVERSITY: 'bg-blue-100 text-blue-700',
  DEPARTMENT: 'bg-amber-100 text-amber-700',
  RESTRICTED: 'bg-red-100 text-red-700',
  PRIVATE: 'bg-slate-200 text-slate-700',
}

function AccessIcon({ access }) {
  if (access === 'PUBLIC') return <Globe size={14} />
  if (access === 'UNIVERSITY') return <Building2 size={14} />
  return <Lock size={14} />
}

export default function DocumentsPage() {
  const [search, setSearch] = useState('')

  const filteredDocuments = documents.filter((document) =>
    `${document.title} ${document.department}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Documents
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Browse and manage accessible academic documents.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 px-3 dark:border-slate-700">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search documents..."
              className="w-full bg-transparent py-3 text-sm outline-none dark:text-white"
            />
          </div>

          <button
            type="button"
            disabled
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-500 opacity-60 dark:border-slate-700"
          >
            <Filter size={17} />
            Filters
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Academic Documents
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Demonstration records — backend data not connected.
            </p>
          </div>
          <FileText size={21} className="text-blue-600" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4">Document</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Access</th>
                <th className="px-5 py-4">Format</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredDocuments.map((document) => (
                <tr key={document.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <FileText className="shrink-0 text-blue-600" size={20} />
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white">
                          {document.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {document.filename}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {document.department}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${accessStyles[document.access]}`}>
                      <AccessIcon access={document.access} />
                      {document.access}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-slate-500">
                    {document.type}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled
                        title="Preview unavailable until backend integration"
                        className="rounded-lg p-2 text-slate-400 opacity-50"
                      >
                        <Eye size={17} />
                      </button>
                      <button
                        type="button"
                        disabled
                        title="Download unavailable until backend integration"
                        className="rounded-lg p-2 text-slate-400 opacity-50"
                      >
                        <Download size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-500">
                    No matching documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}