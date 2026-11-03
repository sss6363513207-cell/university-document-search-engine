
import { authorizeRoles } from '../middleware/authorizeRoles.js'

function runMiddleware(role, allowedRoles) {
  const req = {
    user: role ? { role } : undefined,
  }

  const res = {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code
      return this
    },

    json(data) {
      this.body = data
      return this
    },
  }

  let nextCalled = false

  const next = () => {
    nextCalled = true
  }

  authorizeRoles(...allowedRoles)(req, res, next)

  return {
    statusCode: res.statusCode,
    body: res.body,
    nextCalled,
  }
}

console.log(
  'Student allowed:',
  runMiddleware('STUDENT', ['STUDENT']),
)

console.log(
  'Student denied:',
  runMiddleware('STUDENT', ['ADMIN']),
)

console.log(
  'Missing user:',
  runMiddleware(undefined, ['STUDENT']),
)
