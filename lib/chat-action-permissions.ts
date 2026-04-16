import type { AppScreenKey } from './route-permissions';

/** Screens that only apply as actions from the Chats list (nested under CONVERSATIONS in Team UI). */
export const CHAT_SUB_SCREEN_KEYS = [
  'CLAIMED_CHATS',
  'REVIEW_REMOVAL',
  'LOST_FOUND',
  'ISSUES',
  'PENDING_PAYMENTS',
  'FORM_COLLECTION',
] as const satisfies readonly AppScreenKey[];

export type ChatSubScreenKey = (typeof CHAT_SUB_SCREEN_KEYS)[number];

export const CHAT_SUB_SCREEN_LABELS: Record<ChatSubScreenKey, string> = {
  CLAIMED_CHATS: 'Claim',
  REVIEW_REMOVAL: 'Review / removal',
  LOST_FOUND: 'Lost & found',
  ISSUES: 'Open issues',
  PENDING_PAYMENTS: 'Pending payments',
  FORM_COLLECTION: 'Form collection',
};

export type ChatActionType =
  | 'claim'
  | 'review'
  | 'lost-found'
  | 'issues'
  | 'payment'
  | 'form';

/** Maps reservation card action buttons to permission keys. */
export const CHAT_ACTION_TO_SCREEN: Record<ChatActionType, AppScreenKey> = {
  claim: 'CLAIMED_CHATS',
  review: 'REVIEW_REMOVAL',
  'lost-found': 'LOST_FOUND',
  issues: 'ISSUES',
  payment: 'PENDING_PAYMENTS',
  form: 'FORM_COLLECTION',
};
