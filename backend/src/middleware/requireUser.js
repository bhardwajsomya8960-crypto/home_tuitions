// Requires a parent or tutor session token for the given role. The role always comes from the
// signed token, never from the request. Sets req.user = { role, id }.
function requireUser(role) {
  return (req, res, next) => {
    const match = /^Bearer\s+(\S+)$/.exec(req.headers.authorization || '')
    if (!match) return res.status(401).json({ error: 'Sign in required', code: 'UNAUTHENTICATED' })
    let user
    try {
      user = req.app.locals.authService.verifySession(match[1])
    } catch (err) {
      if (err.status) return next(err)
      return res.status(401).json({ error: 'Your session is invalid or has expired', code: 'UNAUTHENTICATED' })
    }
    if (user.role !== role) return res.status(403).json({ error: 'This area is not available for your account', code: 'FORBIDDEN' })
    req.user = user
    return next()
  }
}

module.exports = { requireUser }
