import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  FileText,
  Upload,
  Layers,
  Users,
  Activity,
  Settings,
  GraduationCap,
  X,
} from 'lucide-react'

const navigation = [
  {
    title: 'WORKSPACE',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { label: 'Search Documents', path: '/search', icon: Search },
      { label: 'Documents', path: '/documents', icon: FileText },
      { label: 'Upload Documents', path: '/upload', icon: Upload },
    ],
  },
  {
    title: 'ADMINISTRATION',
    items: [
      { label: 'Index Management', path: '/indexes', icon: Layers },
      { label: 'User Management', path: '/users', icon: Users },
      { label: 'System Health', path: '/system-health', icon: Activity },
    ],
  },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <GraduationCap size={21} />
            </div>

            <div>
              <h1 className="text-sm font-bold text-slate-900 dark:text-white">
                UniSearch
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Academic Platform
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-6">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="mb-3 px-3 text-xs font-semibold tracking-wider text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900'
                        }`
                      }
                    >
                      <Icon size={18} />
                      {item.label}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <NavLink
            to="/settings"
            onClick={onClose}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900"
          >
            <Settings size={18} />
            Settings
          </NavLink>
        </div>
      </aside>
    </>
  )
}