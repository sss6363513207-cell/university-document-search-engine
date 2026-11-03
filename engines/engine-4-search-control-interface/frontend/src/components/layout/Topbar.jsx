import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

export default function Topbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={21} />
        </button>

        <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
          <span>University</span>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">
            Academic Workspace
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Search"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Search size={19} />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Bell size={19} />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block dark:bg-slate-800" />

        <button
          type="button"
          className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
            U
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-white">
              University User
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Account
            </p>
          </div>

          <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
        </button>
      </div>
    </header>
  )
}