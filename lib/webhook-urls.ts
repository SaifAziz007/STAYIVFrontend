/**
 * The URLs Hospitable must POST to.
 *
 * These are built from `NEXT_PUBLIC_API_URL` — the *backend* origin, including
 * its `/api` prefix. They must never be derived from `window.location`, which
 * is the Next.js frontend origin: it serves no webhook routes, so Hospitable
 * would get a 404 on every delivery and messages would silently never arrive.
 */
export function getApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
}

export interface HospitableWebhookTarget {
  /** Hospitable webhook type this URL handles. */
  type: string;
  url: string;
  description: string;
}

export function getHospitableWebhookTargets(): HospitableWebhookTarget[] {
  const base = getApiBaseUrl();
  return [
    {
      type: 'Messages',
      url: `${base}/webhooks/hospitable/message`,
      description: 'Guest and host messages, delivered to your chats in real time',
    },
    {
      type: 'Properties',
      url: `${base}/webhooks/hospitable`,
      description: 'Property created, updated or deleted',
    },
  ];
}
