import { Hono } from 'hono';
import { requireAuth, getCurrentUser } from '../lib/auth';

export const authRouter = new Hono();

authRouter.get('/auth/me', async (c) => {
  const userOrResponse = await requireAuth(c);
  if (userOrResponse instanceof Response) {
    return userOrResponse;
  }
  return c.json({
    id: userOrResponse.id,
    email: userOrResponse.email,
    role: userOrResponse.role,
    is_admin: userOrResponse.role === 'admin',
  });
});

authRouter.get('/auth/status', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ authenticated: false, user: null });
  }
  return c.json({
    authenticated: true,
    user,
    is_admin: user.role === 'admin',
  });
});
