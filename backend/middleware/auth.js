// Simple authentication middleware for flashcards
// This is a basic implementation - in production, you'd want proper JWT validation

export function authenticateUser(req, res, next) {
  // For now, we'll use a simple approach with a user ID from query params or headers
  // In a real app, you'd validate JWT tokens from Firebase
  
  const userId = req.query.userId || req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ 
      error: 'unauthorized', 
      message: 'User authentication required. Please provide userId.' 
    });
  }
  
  // Add user info to request object
  req.user = { uid: userId };
  next();
}

// Alternative: Mock authentication for development
export function mockAuth(req, res, next) {
  // For development/testing, we can use a mock user ID
  req.user = { uid: 'mock-user-123' };
  next();
}
