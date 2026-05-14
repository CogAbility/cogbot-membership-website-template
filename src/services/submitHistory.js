/**
 * fetchConversationHistory
 *
 * PFC2-native replacement for the CCA2 cca_conversation_history ui_action.
 *
 * Delegates to cam.fetchConversationHistory() which calls:
 *   GET /api/cogbots/{cogbotId}/id/{uid}/conversation-history?chat_id=...
 *
 * Returns a ConversationHistoryResponse:
 *   { thread_id, chat_id, turns: [{ role, content }], transcript_text, summary? }
 *
 * CamClient reads buddy_user_id, buddy_cogbot_sid, and buddy_chat_id from
 * sessionStorage so no additional session plumbing is needed here.
 */
import { cam } from '@cogability/membership-kit';

export async function fetchConversationHistory() {
  return cam.fetchConversationHistory();
}
