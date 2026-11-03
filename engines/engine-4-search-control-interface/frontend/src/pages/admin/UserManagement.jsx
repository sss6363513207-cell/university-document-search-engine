import { useMemo, useState } from 'react'
import {
  Users,
  Search,
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Building2,
  MoreHorizontal,
} from 'lucide-react'

const initialUsers = [
  {
    id: 1,
    name: 'Student User',
    email: 'student@university.edu',
    role: 'STUDENT',
    department: 'Computer Science',
    status: 'ACTIVE',
  },
  {
    id: 2,
    name: 'Faculty User',
    email: 'faculty@university.edu',
    role: 'FACULTY',
    department: 'Information Science',
    status: 'ACTIVE',
  },
  {
    id: 3,
    name: 'Administrator',
    email: 'admin@university.edu',
    role: 'ADMIN',
    department: 'Administration',
    status: 'ACTIVE',
  },
]

const roleStyles = {
  STUDENT: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  FACULTY: 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  ADMIN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
}

const statusStyles = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  INACTIVE: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

export default function UserManagement() {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'STUDENT',
    department: '',
  })

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        `${user.name} ${user.email} ${user.department}`
          .toLowerCase()
          .includes(search.toLowerCase())

      const matchesRole =
        roleFilter === 'ALL' || user.role === roleFilter

      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  function handleCreateUser(event) {
    event.preventDefault()

    const user = {
      id: Date.now(),
      ...newUser,
      status: 'ACTIVE',
    }

    setUsers((current) => [...current, user])
    setNewUser({
      name: '',
      email: '',
      role: 'STUDENT',
      department: '',
    })
    setShowCreateForm(false)
  }

  function updateRole(id, role) {
    setUsers((current) =>
      current.map((user) =>
        user.id === id ? { ...user, role } : user,
      ),
    )
  }

  function toggleStatus(id) {
    setUsers((current) =>
      current.map((user) =>
        user.id === id
          ? {
              ...user,
              status: user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            }
          : user,
      ),
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            ADMINISTRATION
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            User & Role Management
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage university accounts, roles and department assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((value) => !value)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <UserPlus size={17} />
          Add User
        </button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Students', value: users.filter((u) => u.role === 'STUDENT').length, icon: GraduationCap },
          { label: 'Faculty', value: users.filter((u) => u.role === 'FACULTY').length, icon: Building2 },
          { label: 'Administrators', value: users.filter((u) => u.role === 'ADMIN').length, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {label}
              </p>
              <Icon size={20} className="text-blue-600" />
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
              {value}
            </p>
          </article>
        ))}
      </section>

      {showCreateForm && (
        <form
          onSubmit={handleCreateUser}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
        >
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Create University User
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              required
              placeholder="Full name"
              value={newUser.name}
              onChange={(event) =>
                setNewUser({ ...newUser, name: event.target.value })
              }
              className="rounded-lg border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white"
            />

            <input
              required
              type="email"
              placeholder="University email"
              value={newUser.email}
              onChange={(event) =>
                setNewUser({ ...newUser, email: event.target.value })
              }
              className="rounded-lg border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white"
            />

            <select
              value={newUser.role}
              onChange={(event) =>
                setNewUser({ ...newUser, role: event.target.value })
              }
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="ADMIN">Admin</option>
            </select>

            <input
              required
              placeholder="Department"
              value={newUser.department}
              onChange={(event) =>
                setNewUser({ ...newUser, department: event.target.value })
              }
              className="rounded-lg border border-slate-300 bg-transparent px-4 py-3 text-sm dark:border-slate-700 dark:text-white"
            />
          </div>

          <p className="text-xs text-slate-500">
            Demonstration only. No account or login credentials will be created.
          </p>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-700 dark:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white"
            >
              Add User
            </button>
          </div>
        </form>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-slate-200 px-3 dark:border-slate-700">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email or department..."
              className="w-full bg-transparent py-3 text-sm outline-none dark:text-white"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-200 p-5 dark:border-slate-800">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            University Users
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Local demonstration records. Backend RBAC is not connected.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Department</th>
                <th className="px-5 py-4">Role</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                    {user.department}
                  </td>

                  <td className="px-5 py-4">
                    <select
                      value={user.role}
                      onChange={(event) =>
                        updateRole(user.id, event.target.value)
                      }
                      className={`rounded-full border-0 px-3 py-1.5 text-xs font-semibold outline-none ${roleStyles[user.role]}`}
                    >
                      <option value="STUDENT">Student</option>
                      <option value="FACULTY">Faculty</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.status]}`}>
                      {user.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => toggleStatus(user.id)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <MoreHorizontal
                      size={18}
                      className="ml-2 inline text-slate-400"
                    />
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="flex items-center gap-2 text-xs text-slate-400">
        <Users size={14} />
        User creation, role changes and account status are local demonstrations only.
        Actual authorization must be enforced by the backend.
      </p>
    </div>
  )
}