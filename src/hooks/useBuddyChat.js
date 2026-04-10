import { useState, useCallback, useRef, useEffect } from 'react';
import {
  setAnonymousTokens,
  initCogbot,
  sendMessage as apiSendMessage,
  parseResponseGeneric,
} from '../services/buddyApi';

/**
 * Manages the full anonymous chat lifecycle:
 *   1. Establish anonymous session (settokens)
 *   2. Initialize cogbot (greeting)
 *   3. Send/receive messages
 *
 * Returns { messages, isLoading, isInitializing, error, sendMessage, retry }.
 */
export default function useBuddyChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState(null);
  const initRef = useRef(false);

  const initialize = useCallback(async () => {
    try {
      setIsInitializing(true);
      setError(null);

      await setAnonymousTokens();
      const initData = await initCogbot();

      const greeting = extractGreeting(initData);
      if (greeting.length > 0) {
        setMessages(greeting.map((text) => ({ role: 'assistant', content: text, id: crypto.randomUUID() })));
      }
    } catch (err) {
      console.error('BuddyChat: init failed', err);
      setError('Unable to connect to Buddy. Please try again.');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    initialize();
  }, [initialize]);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || isLoading) return;

    const userMsg = { role: 'user', content: text.trim(), id: crypto.randomUUID() };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiSendMessage(text.trim());
      const generics = parseResponseGeneric(response);
      const botMessages = generics
        .filter((g) => g.response_type === 'text' && g.text)
        .map((g) => ({ role: 'assistant', content: g.text, id: crypto.randomUUID() }));

      if (botMessages.length === 0) {
        botMessages.push({ role: 'assistant', content: "I'm sorry, I didn't get a response. Please try again.", id: crypto.randomUUID() });
      }

      setMessages((prev) => [...prev, ...botMessages]);
    } catch (err) {
      console.error('BuddyChat: message failed', err);
      setError('Something went wrong sending your message.');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const retry = useCallback(() => {
    initRef.current = false;
    setMessages([]);
    setError(null);
    initialize();
  }, [initialize]);

  return { messages, isLoading, isInitializing, error, sendMessage, retry };
}

function extractGreeting(initData) {
  if (!initData) return [];

  // The init response may carry a greeting in several shapes depending on
  // PFC version. Try the most common ones.
  const output = initData.output || initData.response?.output;
  if (output?.generic) {
    return output.generic
      .filter((g) => g.response_type === 'text' && g.text)
      .map((g) => g.text);
  }
  if (initData.greeting) {
    return [initData.greeting];
  }
  return [];
}
