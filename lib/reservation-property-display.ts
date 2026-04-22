import type { ReservationConversation } from './conversations-api';

type MaybeRecord = Record<string, unknown>;

function parseIfString(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  try {
    return JSON.parse(v) as unknown;
  } catch {
    return v;
  }
}

function isUsableName(s: string): boolean {
  const t = s.trim();
  return t.length > 0 && t.toLowerCase() !== 'property';
}

function asName(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  return isUsableName(val) ? val.trim() : null;
}

function pickFromObject(obj: unknown, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const o = obj as MaybeRecord;
  for (const k of keys) {
    const n = asName(o[k]);
    if (n) return n;
  }
  return null;
}

/** Walk nested objects that might contain a listing/property name (e.g. Hospitable-style payloads). */
export function extractPropertyNameFromPayload(data: unknown, depth = 0): string | null {
  if (depth > 6 || data == null) return null;
  const node = parseIfString(data);
  if (typeof node !== 'object' || node === null) return null;
  const o = node as MaybeRecord;

  const direct = pickFromObject(o, [
    'propertyName',
    'property_name',
    'listingName',
    'listing_name',
  ]);
  if (direct) return direct;

  const nestedKeys = ['property', 'listing', 'space', 'rental', 'unit', 'home', 'accommodation'];
  for (const k of nestedKeys) {
    const n = pickFromObject(o[k], ['name', 'title', 'nickname', 'displayName']);
    if (n) return n;
  }

  for (const k of nestedKeys) {
    const inner = extractPropertyNameFromPayload(o[k], depth + 1);
    if (inner) return inner;
  }

  return null;
}

/**
 * Property label for claimed chats, review/removal, lost & found rows (DB may store the placeholder "Property").
 */
export function resolvePropertyNameFromRecord(record: {
  propertyName?: string | null;
  reservationData?: unknown;
}): string | null {
  const top = asName(record.propertyName ?? '');
  if (top) return top;
  return extractPropertyNameFromPayload(record.reservationData);
}

/** Property label when we have a full reservation conversation (list/detail + rawData). */
export function resolvePropertyNameFromReservation(res: ReservationConversation): string | null {
  const top = asName(res.propertyName ?? '');
  if (top) return top;
  if (res.rawData) {
    const fromRaw = extractPropertyNameFromPayload(res.rawData);
    if (fromRaw) return fromRaw;
  }
  return null;
}
