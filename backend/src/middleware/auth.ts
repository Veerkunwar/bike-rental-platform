import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken } from '../utils/generateToken';
import { User } from '../models/User';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'user' | 'admin';
      };
    }
  }
}

/**
 * Verifies the JWT (from Authorization header OR httpOnly cookie) and
 * attaches { id, role } to req.user. Never trust a role sent by the client.
 */
export const protect = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) throw ApiError.unauthorized('Authentication required. Please log in.');

  const payload = verifyAccessToken(token);

  const user = await User.findById(payload.id).select('_id role isSuspended');
  if (!user) throw ApiError.unauthorized('Account no longer exists.');
  if (user.isSuspended) throw ApiError.forbidden('Your account has been suspended.');

  req.user = { id: user.id, role: user.role };
  next();
});

/** Restrict a route to specific roles. Role always comes from the verified DB record, never the request body. */
export function authorize(...roles: Array<'user' | 'admin'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action.');
    }
    next();
  };
}
