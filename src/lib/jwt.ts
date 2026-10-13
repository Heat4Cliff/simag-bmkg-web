import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key-change-in-production';

export function signJwt(payload: object, expiresIn: string = '30d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyJwt(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
}
