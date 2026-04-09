/**
 * Embeds the Buddy CogBot widget (mc_0091) via iframe.
 * The iframe points to /buddy-chat.html which loads bundlewidget.js
 * and initializes the widget in full-screen mode.
 */
export default function CogBotEmbed({ height = '600px', className = '' }) {
  return (
    <div
      className={`w-full overflow-hidden rounded-2xl shadow-xl border border-gray-200 ${className}`}
      style={{ height }}
    >
      <iframe
        src="/buddy-chat.html"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        title="Chat with Buddy"
        allow="microphone"
      />
    </div>
  );
}
