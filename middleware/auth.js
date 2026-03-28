// Simple authentication middleware
export const isAuthenticated = (req, res, next) => {
  if (req.session.customerId) {
    return next();
  }
  
  res.status(401).json({ error: 'Authentication required' });
};

// Admin authentication middleware (for future use)
export const isAdmin = (req, res, next) => {
  // This would check for admin role in a real application
  if (req.session.isAdmin) {
    return next();
  }
  
  res.status(403).json({ error: 'Admin access required' });
};