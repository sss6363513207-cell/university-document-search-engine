export function checkAdminAccess(req, res) {
  return res.status(200).json({
    success: true,
    message: 'Admin access granted',
    data: {
      id: req.user.id,
      role: req.user.role,
    },
  })
}