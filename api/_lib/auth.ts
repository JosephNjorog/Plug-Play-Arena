import { SignJWT, jwtVerify } from 'jose';

function secret() {
  return new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-plug-n-play-2026');
}

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<Record<string, unknown>> {
  const { payload } = await jwtVerify(token, secret());
  return payload as Record<string, unknown>;
}

export function extractToken(req: { headers: any }): string | null {
  const h = req.headers ?? {};
  const auth: string = h.authorization ?? h.Authorization ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  return auth.slice(7);
}
