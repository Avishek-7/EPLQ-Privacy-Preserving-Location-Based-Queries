import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase-admin';

interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    [key: string]: any
  };
}

export const verifyFirebaseToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
      return res.status(401).json({
        error: 'Unauthorized: No token provided'
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const decodedToken = await adminAuth.verifyIdToken(token);

    req.user = {
      ...decodedToken
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      error: 'Unauthorized: Invalid token'
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if(authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const decodedToken = await adminAuth.verifyIdToken(token);

      req.user = {
        ...decodedToken
      };
    }

    next();
  } catch (error) {
    next();
  }
};

export { AuthenticatedRequest };
