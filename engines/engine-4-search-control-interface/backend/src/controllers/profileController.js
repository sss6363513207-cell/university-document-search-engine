export const profileController = {
  getProfile(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Authenticated user profile',
      data: {
        id: req.user.id,
        role: req.user.role,
      },
    })
  },
}