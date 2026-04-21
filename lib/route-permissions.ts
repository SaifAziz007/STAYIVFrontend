/** Matches backend AppScreen enum values */
export type AppScreenKey =
  | 'DASHBOARD'
  | 'PROPERTIES'
  | 'PROPERTY_SHEETS'
  | 'CONVERSATIONS'
  | 'CLEANING'
  | 'CLAIMED_CHATS'
  | 'REVIEW_REMOVAL'
  | 'LOST_FOUND'
  | 'ISSUES'
  | 'PENDING_PAYMENTS'
  | 'FORM_COLLECTION'
  | 'RESERVATIONS'
  | 'INQUIRIES'
  | 'REVIEWS'
  | 'AI_KNOWLEDGE_BASE'
  | 'HOSPITABLE_INTEGRATION'
  | 'USER_MANAGEMENT';

/**
 * Returns the screen key required for a pathname, or null if no specific screen (always allow).
 */
export function getRequiredScreenForPath(pathname: string): AppScreenKey | null {
  if (pathname === '/dashboard' || pathname === '/') {
    return 'DASHBOARD';
  }
  if (pathname.startsWith('/properties')) {
    return 'PROPERTIES';
  }
  if (pathname.startsWith('/property-sheet')) {
    return 'PROPERTY_SHEETS';
  }
  if (pathname.startsWith('/chats')) {
    return 'CONVERSATIONS';
  }
  if (pathname.startsWith('/cleaning')) {
    return 'CLEANING';
  }
  if (pathname.startsWith('/claimed-chats')) {
    return 'CLAIMED_CHATS';
  }
  if (pathname.startsWith('/review-removal')) {
    return 'REVIEW_REMOVAL';
  }
  if (pathname.startsWith('/lost-found')) {
    return 'LOST_FOUND';
  }
  if (pathname.startsWith('/issues')) {
    return 'ISSUES';
  }
  if (pathname.startsWith('/pending-payments')) {
    return 'PENDING_PAYMENTS';
  }
  if (pathname.startsWith('/form-collection')) {
    return 'FORM_COLLECTION';
  }
  if (pathname.startsWith('/reservations')) {
    return 'RESERVATIONS';
  }
  if (pathname.startsWith('/inquiries')) {
    return 'INQUIRIES';
  }
  if (pathname.startsWith('/reviews')) {
    return 'REVIEWS';
  }
  if (pathname.startsWith('/ai-chat')) {
    return 'AI_KNOWLEDGE_BASE';
  }
  if (pathname.startsWith('/settings/team')) {
    return 'USER_MANAGEMENT';
  }
  if (pathname.startsWith('/settings')) {
    return 'HOSPITABLE_INTEGRATION';
  }
  return null;
}
