/**
 * Base URL for Socket.IO connections.
 *
 * HTTP requests go to `NEXT_PUBLIC_API_URL`, which includes the backend's `/api`
 * prefix (e.g. `https://host/api`). Socket.IO treats the path portion of the URL
 * as the *namespace*, so appending `/team-chat` to that would connect to the
 * non-existent `/api/team-chat` namespace and silently fail. We therefore strip
 * the trailing `/api` here (or use an explicit `NEXT_PUBLIC_WS_URL` if provided).
 */
export function getSocketBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return api.replace(/\/api\/?$/, '').replace(/\/+$/, '');
}
