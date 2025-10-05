// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Check if user has roles array (Keycloak) or single role (legacy)
    const userRoles = req.user.roles || [req.user.role];
    
    // Check if any of the user's roles match the required roles
    const hasPermission = roles.some(role => userRoles.includes(role));
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `User roles [${userRoles.join(', ')}] are not authorized to access this resource`
      });
    }
    next();
  };
};

// Check if user is admin
exports.adminOnly = (req, res, next) => {
  const userRoles = req.user.roles || [req.user.role];
  
  if (!userRoles.includes('admin')) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};
