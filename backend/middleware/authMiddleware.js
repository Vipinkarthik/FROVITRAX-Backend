import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    console.log('Auth header missing or invalid format:', authHeader);
    return res.status(401).json({ message: 'Unauthorized: Token missing or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('JWT decoded successfully:', { id: decoded.id, role: decoded.role });
    req.user = decoded;
    next();
  } catch (err) {
    console.log('JWT verification failed:', err.message);
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Forbidden: Access denied' });
    }
    next();
  };
};
