const { SystemRoles } = require('librechat-data-provider');

const ADMIN_EMAILS = [
  'cristhian@mauricioposadac.com',
  'mauricioposadac@gmail.com',
];

function checkAdmin(req, res, next) {
  try {
    const userEmail = req.user?.email?.toLowerCase();
    if (
      req.user?.role === SystemRoles.ADMIN ||
      req.user?.role === 'ADMIN' ||
      (userEmail && ADMIN_EMAILS.includes(userEmail))
    ) {
      return next();
    }
    return res.status(403).json({ message: 'Forbidden' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

module.exports = { requireAdmin: checkAdmin, ADMIN_EMAILS };

