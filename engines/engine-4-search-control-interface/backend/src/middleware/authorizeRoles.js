
const validRoles = new Set(['STUDENT', 'FACULTY', 'ADMIN'])

export function authorizeRoles(...allowedRoles) {
  const invalidRoles = allowedRoles.filter(
    (role) => !validRoles.has(role),
  )

  if (invalidRoles.length > 0) {
    throw new Error(
      `Invalid role(s) in authorization middleware: ${invalidRoles.join(', ')}`,
    )
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource',
      })
    }

    return next()
  }
}
