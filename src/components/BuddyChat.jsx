import { useState, useRef, useEffect } from 'react';
import { useBuddyChat, useSiteConfig } from '@cogability/membership-kit';

function prepareHtml(html) {
  return html.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
}

export default function BuddyChat({ height, className = '', hideHeader = false }) {
  const { hero, images, botName } = useSiteConfig();
  const { messages, isLoading, isInitializing, error, sendMessage, retry, streamingText, fetchConversationHistory } = useBuddyChat();
  const [input, setInput] = useState('');
  const [submitStatus, setSubmitStatus] = useState(null); // 'submitting' | 'success' | 'error'
  const [transcript, setTranscript] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isLoading, streamingText]);

  // Clear submit status after 5 s
  useEffect(() => {
    if (submitStatus === 'error') {
      const t = setTimeout(() => setSubmitStatus(null), 5000);
      return () => clearTimeout(t);
    }
  }, [submitStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  const handleNewChat = () => {
    setSubmitStatus(null);
    setTranscript(null);
    retry();
  };

  const handleGetHistory = async () => {
    if (submitStatus === 'submitting') return;
    setSubmitStatus('submitting');
    setTranscript(null);
    try {
      const history = await fetchConversationHistory();
      setTranscript(history);
      setSubmitStatus('success');
    } catch (err) {
      console.error('BuddyChat: fetchConversationHistory failed', err);
      setSubmitStatus('error');
    }
  };

  return (
    <div
      className={`w-full flex flex-col overflow-hidden rounded-2xl shadow-xl border border-gray-200 bg-white ${className}`}
      style={height ? { height } : undefined}
    >
      {!hideHeader && (
        <div className="flex items-center gap-2.5 px-4 py-2.5 flex-shrink-0" style={{ backgroundColor: hero.chatHeaderColor }}>
          <img src={images.botIcon} alt="" className="h-8 w-auto object-contain" />
          <span className="text-white font-bold text-sm flex-1">{botName}</span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <button
            onClick={handleNewChat}
            title="Start new chat"
            disabled={isInitializing}
            className="ml-2 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Start new chat"
          >
            <NewChatIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 bg-gray-50/60">
        {isInitializing && (
          <div className="flex justify-center py-8">
            <LoadingDots />
          </div>
        )}

        {!isInitializing && messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-8">
            <ChatBubbleIcon className="w-10 h-10" />
            <span className="text-sm font-medium">Ask Buddy anything!</span>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {streamingText ? (
          <div className="flex items-start gap-2.5">
            <BuddyAvatar />
            <div
              className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm bg-white text-gray-800 border border-gray-200 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer [&_a]:hover:opacity-80"
              dangerouslySetInnerHTML={{ __html: prepareHtml(streamingText) }}
            />
          </div>
        ) : isLoading ? (
          <div className="flex items-start gap-2.5">
            <BuddyAvatar />
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm">
              <LoadingDots />
            </div>
          </div>
        ) : null}

        {error && (
          <div className="flex flex-col items-center gap-2 py-4">
            <p className="text-sm text-red-600 font-medium">{error}</p>
            <button
              onClick={retry}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-gray-200 flex-shrink-0"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          disabled={isInitializing}
          className="flex-1 min-w-0 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 transition-shadow"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading || isInitializing}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Send message"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h12m0 0l-5.25-5.25M18 12l-5.25 5.25" />
          </svg>
        </button>
      </form>

      {/* Conversation history footer */}
      {messages.length > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-gray-100">
          <div className="flex items-center justify-between px-4 py-2">
            {submitStatus === 'success' ? (
              <span className="text-xs text-green-600 font-medium">History loaded.</span>
            ) : submitStatus === 'error' ? (
              <span className="text-xs text-red-600 font-medium">Failed to load history. Please try again.</span>
            ) : (
              <span className="text-xs text-gray-400">Conversation in progress</span>
            )}
            <button
              onClick={handleGetHistory}
              disabled={submitStatus === 'submitting' || isLoading}
              className="text-xs font-semibold text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {submitStatus === 'submitting' ? 'Loading…' : 'View Transcript'}
            </button>
          </div>

          {transcript && (
            <div className="mx-4 mb-3 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 max-h-48 overflow-y-auto">
              {transcript.summary && (
                <div className="px-3 py-2 border-b border-gray-200 bg-amber-50 text-amber-800">
                  <p className="font-semibold mb-0.5">Conversation summary</p>
                  <p className="leading-relaxed whitespace-pre-wrap">{transcript.summary}</p>
                </div>
              )}
              <div className="px-3 py-2 space-y-1">
                {transcript.turns?.map((turn, i) => (
                  <div key={i} className={`flex gap-1.5 ${turn.role === 'user' ? 'justify-end' : ''}`}>
                    <span className={`font-semibold shrink-0 ${turn.role === 'user' ? 'text-primary' : 'text-gray-500'}`}>
                      {turn.role === 'user' ? 'You' : 'Buddy'}:
                    </span>
                    <span className="leading-relaxed">{turn.content}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-end gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <BuddyAvatar />}
      {isUser ? (
        <div className="max-w-[80%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap bg-primary text-white">
          {message.content}
        </div>
      ) : (
        <div
          className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm bg-white text-gray-800 border border-gray-200 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:text-primary [&_a]:underline [&_a]:cursor-pointer [&_a]:hover:opacity-80"
          dangerouslySetInnerHTML={{ __html: prepareHtml(message.content) }}
        />
      )}
    </div>
  );
}

function BuddyAvatar() {
  const { images } = useSiteConfig();
  return (
    <img
      src={images.botIcon}
      alt=""
      className="h-9 w-auto object-contain flex-shrink-0"
    />
  );
}

function LoadingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Loading">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
    </span>
  );
}

function ChatBubbleIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function NewChatIcon({ className = '' }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}
