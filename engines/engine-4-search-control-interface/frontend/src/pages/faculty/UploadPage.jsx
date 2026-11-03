import { useRef, useState } from 'react'
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react'

const ACCEPTED_TYPES = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
  '.jpg',
  '.jpeg',
  '.png',
]

const MAX_FILE_SIZE = 25 * 1024 * 1024

export default function UploadPage() {
  const fileInputRef = useRef(null)

  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [department, setDepartment] = useState('')
  const [accessLevel, setAccessLevel] = useState('PRIVATE')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('idle')

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) return

    setError('')
    setStatus('idle')

    const extension = `.${selectedFile.name.split('.').pop().toLowerCase()}`

    if (!ACCEPTED_TYPES.includes(extension)) {
      setError('Unsupported file format.')
      return
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File size must not exceed 25 MB.')
      return
    }

    setFile(selectedFile)

    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!file) {
      setError('Please select a document.')
      return
    }

    if (!title.trim() || !department) {
      setError('Please provide a title and department.')
      return
    }

    setStatus('demo')
  }

  function removeFile() {
    setFile(null)
    setStatus('idle')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      <section>
        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
          FACULTY WORKSPACE
        </p>

        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
          Upload Documents
        </h1>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add academic documents to the university document platform.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Select Document
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            PDF, DOC, DOCX, PPT, PPTX, TXT, JPG and PNG. Maximum 25 MB.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-5 py-12 text-center transition hover:border-blue-500 hover:bg-blue-50/50 dark:border-slate-700 dark:hover:bg-blue-500/5"
            >
              <Upload size={30} className="text-blue-600 dark:text-blue-400" />

              <span className="mt-3 text-sm font-semibold text-slate-800 dark:text-white">
                Click to select a document
              </span>

              <span className="mt-1 text-xs text-slate-500">
                Select one file from your computer
              </span>
            </button>
          ) : (
            <div className="mt-5 flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="shrink-0 text-blue-600" size={25} />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={removeFile}
                aria-label="Remove selected file"
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              >
                <X size={18} />
              </button>
            </div>
          )}
        </section>

        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Document Information
          </h2>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Document Title *
            </label>

            <input
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Enter document title"
              className="w-full rounded-lg border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>

            <textarea
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the document..."
              className="w-full resize-y rounded-lg border border-slate-300 bg-transparent px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Department *
            </label>

            <select
              required
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Select department</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Information Science">Information Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
              <option value="Electrical">Electrical</option>
              <option value="Administration">Administration</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Document Access Level *
            </label>

            <select
              value={accessLevel}
              onChange={(event) => setAccessLevel(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="PRIVATE">Private</option>
              <option value="RESTRICTED">Restricted</option>
              <option value="DEPARTMENT">Department</option>
              <option value="UNIVERSITY">University</option>
              <option value="PUBLIC">Public</option>
            </select>

            <div className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-500/10 dark:text-blue-300">
              <ShieldCheck size={17} className="mt-0.5 shrink-0" />
              Uploaded documents are private by default. Select the appropriate
              access level. Actual permissions must be enforced by the backend.
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {status === 'demo' && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            Form validation successful. No file was uploaded or indexed because
            backend integration is not yet implemented.
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Upload size={17} />
            Validate Upload
          </button>
        </div>
      </form>
    </div>
  )
}
