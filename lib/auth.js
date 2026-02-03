import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Authentication module for JWT-based access control
 * Supports role-based access with audit logging
 */
export class AuthManager {
  constructor(options = {}) {
    this.jwtSecret = options.jwtSecret || process.env.JWT_SECRET || this.generateSecret();
    this.tokenExpiration = options.tokenExpiration || '24h';
    this.roles = {
      'public': { terminal: false, chat: true }, // Chat only
      'team': { terminal: true, chat: true },    // Full access
      'admin': { terminal: true, chat: true, auth: true } // Can issue tokens
    };
  }

  /**
   * Generate a secure random JWT secret
   */
  generateSecret() {
    const secret = crypto.randomBytes(32).toString('hex');
    console.warn('[AUTH] Generated JWT secret. Set JWT_SECRET env var in production');
    return secret;
  }

  /**
   * Issue a token for a user
   * @param {string} userId - User identifier (e.g., 'nix', 'gregory')
   * @param {string} role - Role: 'public', 'team', or 'admin'
   * @param {string} expiresIn - Token expiration (e.g., '24h', '7d')
   * @returns {object} { token, expiresIn, userId, role }
   */
  issueToken(userId, role = 'team', expiresIn = this.tokenExpiration) {
    if (!this.roles[role]) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${Object.keys(this.roles).join(', ')}`);
    }

    if (!userId || typeof userId !== 'string') {
      throw new Error('userId is required and must be a string');
    }

    const payload = {
      userId,
      role,
      iat: Math.floor(Date.now() / 1000),
      type: 'access-token'
    };

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn });

    // Calculate actual expiration time for response
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000).toISOString();

    return {
      token,
      expiresIn,
      expiresAt,
      userId,
      role,
      message: `Token issued for ${userId} (${role})`
    };
  }

  /**
   * Verify and decode a token
   * @param {string} token - JWT token
   * @returns {object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error(`Token expired at ${error.expiredAt}`);
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error(`Invalid token: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if a user with given role can access a resource
   * @param {string} role - User's role
   * @param {string} resource - Resource type: 'chat', 'terminal', 'auth'
   * @returns {boolean}
   */
  canAccess(role, resource) {
    const permissions = this.roles[role];
    if (!permissions) {
      return false;
    }
    return permissions[resource] === true;
  }

  /**
   * Middleware for Express to validate JWT tokens
   * Extracts token from Authorization header or x-access-token header
   * Attaches decoded token to req.auth
   */
  middleware() {
    return (req, res, next) => {
      try {
        // Get token from Authorization header (Bearer <token>) or x-access-token header
        let token = null;
        
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7);
        } else if (req.headers['x-access-token']) {
          token = req.headers['x-access-token'];
        }

        if (!token) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing token. Provide Authorization: Bearer <token> or x-access-token header',
            timestamp: new Date().toISOString()
          });
        }

        const decoded = this.verifyToken(token);
        req.auth = decoded;
        next();
      } catch (error) {
        res.status(401).json({
          error: 'Unauthorized',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Middleware to check role-based access
   * Must be used after JWT middleware
   */
  requireRole(allowedRoles) {
    if (typeof allowedRoles === 'string') {
      allowedRoles = [allowedRoles];
    }

    return (req, res, next) => {
      if (!req.auth) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token required',
          timestamp: new Date().toISOString()
        });
      }

      if (!allowedRoles.includes(req.auth.role)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `This resource requires one of: ${allowedRoles.join(', ')}. You have: ${req.auth.role}`,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }

  /**
   * Middleware to check access to a specific resource
   * Must be used after JWT middleware
   */
  requireResource(resource) {
    return (req, res, next) => {
      if (!req.auth) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token required',
          timestamp: new Date().toISOString()
        });
      }

      if (!this.canAccess(req.auth.role, resource)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Your role (${req.auth.role}) does not have access to ${resource}`,
          timestamp: new Date().toISOString()
        });
      }

      next();
    };
  }
}

export default AuthManager;
