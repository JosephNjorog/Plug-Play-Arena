import bcrypt from 'bcryptjs';
import { getDb } from '../_lib/db';
import { signToken } from '../_lib/auth';
import { readBody, json, handleCors } from '../_lib/cors';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res)) return;
  if (req.method !== 'POST') { json(res, 405, { error: 'Method not allowed' }); return; }

  const { email, password } = await readBody(req);
  if (!email || !password) { json(res, 400, { error: 'Email and password required' }); return; }

  try {
    const sql = getDb();
    const users = await sql`
      SELECT id, email, password_hash FROM public.users WHERE email = ${email.toLowerCase().trim()}
    `;
    const user = users[0];
    if (!user) { json(res, 401, { error: 'Invalid email or password' }); return; }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) { json(res, 401, { error: 'Invalid email or password' }); return; }

    const profiles = await sql`
      SELECT username, emoji, persona, is_admin FROM public.profiles WHERE user_id = ${user.id}
    `;
    const profile = profiles[0] ?? {};

    const token = await signToken({
      sub: user.id,
      email: user.email,
      user_metadata: { username: profile.username ?? '', emoji: profile.emoji ?? '🔺' },
      is_admin: profile.is_admin ?? false,
    });

    json(res, 200, { token, user: { id: user.id, email: user.email } });
  } catch (err: any) {
    json(res, 500, { error: err.message });
  }
}
