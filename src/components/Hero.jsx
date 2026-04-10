/**
 * Hero section — matches the buildabrainpensacola.com chat-first layout exactly.
 *
 * Layout (all centered, full-width animated gradient background):
 *   1. Branding card  — Buddy mascot | "Buddy" wordmark | divider | "Presented by" + BAB logo
 *   2. Member welcome banner  — shown only when isAuthenticated
 *   3. "Chat with Buddy" label
 *   4. CogBot iframe  — public, no login required
 */
export default function Hero({ isMember }) {
  return (
    <section className="animated-gradient-hero min-h-screen flex flex-col pt-12 sm:pt-14 pb-10 sm:pb-12 px-4">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-3 sm:gap-4 flex-1">

        {/* 1. Branding card */}
        <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-border bg-white">
          <div className="flex items-center py-5 sm:py-7 md:py-8">
            {/* Buddy mascot */}
            <div className="flex-shrink-0 pl-6 sm:pl-10">
              <img
                src="/buddy-icon.webp"
                alt="Buddy"
                className="w-auto h-[80px] sm:h-[100px] md:h-[120px] object-contain"
              />
            </div>

            {/* "Buddy" wordmark */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
              <span className="text-primary font-black text-5xl sm:text-7xl md:text-8xl tracking-tight">
                Buddy
              </span>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-border mx-1" />

            {/* Presented by + BAB logo */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center px-6 sm:px-10 gap-1.5">
              <span className="text-muted-foreground font-bold text-[10px] sm:text-xs tracking-widest uppercase">
                Presented by
              </span>
              <img
                src="/bab-full-logo.webp"
                alt="Build a Brain"
                className="h-[40px] sm:h-[52px] md:h-[64px] w-auto object-contain"
              />
            </div>
          </div>
        </div>

        {/* 2. Member welcome banner (conditional) */}
        {isMember && (
          <div className="flex items-center gap-2 bg-white/20 border border-white/40 backdrop-blur-sm rounded-full px-4 py-2">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-white font-bold text-xs sm:text-sm">
              Welcome, Build a Brain Member
            </span>
          </div>
        )}

        {/* 3. "Chat with Buddy" label */}
        <div className="flex items-center gap-2 text-white">
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-base sm:text-lg font-bold">Chat with Buddy</span>
        </div>

        {/* 4. CogBot iframe — public, no auth required */}
        <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-border bg-white flex-1 min-h-[400px] flex flex-col">
          {/* Chat header bar */}
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1e3a5f] flex-shrink-0">
            <img src="/buddy-icon.webp" alt="" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-white font-bold text-sm">Buddy</span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>

          {/* Chat iframe */}
          <div className="flex-1 min-h-0">
            <iframe
              src={`${import.meta.env.VITE_COGBOT_HOST}/mc_0091_full_screen.html`}
              style={{ width: '100%', height: '100%', border: 'none', display: 'block', minHeight: '300px' }}
              title="Chat with Buddy"
              allow="microphone"
            />
          </div>

          {/* Input bar */}
          <div className="flex items-center gap-3 px-4 py-3 bg-white border-t border-gray-200 flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="flex-1 text-gray-400 text-sm select-none">Ask a question...</span>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>

        {/* 5. Tagline + stats */}
        <div className="w-full flex flex-col items-center gap-4 pt-2 pb-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl leading-snug max-w-2xl">
              You don't have to figure out the early years alone.
            </p>
            <p className="text-white/80 text-sm sm:text-base max-w-xl">
              Your always-on, science-backed AI parenting companion — built for real parents, right in your community.
            </p>
          </div>
          <div className="flex items-stretch gap-0">
            <div className="flex flex-col items-center px-8 sm:px-12">
              <span className="text-white font-black text-3xl sm:text-4xl">24/7</span>
              <span className="text-white/80 text-sm font-medium">Available</span>
            </div>
            <div className="w-px bg-white/40 self-stretch" />
            <div className="flex flex-col items-center px-8 sm:px-12">
              <span className="text-white font-black text-3xl sm:text-4xl">100%</span>
              <span className="text-white/80 text-sm font-medium">Free</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
