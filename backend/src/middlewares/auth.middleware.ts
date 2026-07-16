import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
// Note: Server will crash at startup (index.ts) if JWT_SECRET is missing — no fallback.

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: string;
    branchId: string | null;
    permissions?: string[];
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(403).json({ success: false, error: 'Forbidden: Invalid Token' });
        return;
      }
      req.user = decoded as AuthRequest['user'];
      next();
    });
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized: Missing Token' });
  }
};

export const authorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
      return;
    }
    
    // Super Admin can access everything
    if (req.user.role === 'Super Admin') {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: 'Forbidden: Insufficient Permissions' });
      return;
    }
    
    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
      return;
    }
    
    // System Admins override
    if (req.user.role === 'Super Admin' || req.user.role === 'Owner') {
      next();
      return;
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      res.status(403).json({ success: false, error: `Forbidden: Missing Permission (${permission})` });
      return;
    }
    
    next();
  };
};
