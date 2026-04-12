import BuddyChat from './BuddyChat'
import { useAuth } from '../auth/AuthProvider'
import config from '@/site.config'

const { hero, images } = config

export default function Hero({ isMember }) {
  const { geofenced, geofenceMessage, geofenceChecking } = useAuth()

  return (
    <section className="animated-gradient-hero min-h-screen flex flex-col pt-12 sm:pt-14 pb-10 sm:pb-12 px-4">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center gap-3 sm:gap-4 flex-1">

        {/* 1. Branding card */}
        <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-border bg-white">
          <div className="flex items-center py-5 sm:py-7 md:py-8">
            {/* Bot mascot */}
            <div className="flex-shrink-0 pl-6 sm:pl-10">
              <img
                src={images.botIcon}
                alt={config.botName}
                className="w-auto h-[80px] sm:h-[100px] md:h-[120px] object-contain"
              />
            </div>

            {/* Bot name wordmark */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6">
              <span className="text-primary font-black text-5xl sm:text-7xl md:text-8xl tracking-tight">
                {config.botName}
              </span>
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-border mx-1" />

            {/* Presented by + org logo */}
            <div className="flex-shrink-0 flex flex-col items-center justify-center px-6 sm:px-10 gap-1.5">
              <span className="text-muted-foreground font-bold text-[10px] sm:text-xs tracking-widest uppercase">
                Presented by
              </span>
              <img
                src={images.orgLogo}
                alt={config.siteName}
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
              {hero.memberWelcome}
            </span>
          </div>
        )}

        {/* 3. Chat label */}
        {!geofenced && (
          <div className="flex items-center gap-2 text-white">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-base sm:text-lg font-bold">{hero.chatLabel}</span>
          </div>
        )}

        {/* 4. Chat widget — replaced by geofence notice when access is restricted */}
        {geofenceChecking ? (
          <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-border bg-white h-[60vh] flex items-center justify-center">
            <span className="text-muted-foreground text-sm animate-pulse">Loading...</span>
          </div>
        ) : geofenced ? (
          <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-border bg-white h-[60vh] flex flex-col items-center justify-center gap-4 px-8 text-center">
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground mb-2">Not Available in Your Area</h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                {geofenceMessage || 'This service is not available in your area.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-lg border border-border bg-white h-[60vh] flex flex-col">
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#1e3a5f] flex-shrink-0">
              <img src={images.botIcon} alt="" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-white font-bold text-sm">{config.botName}</span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <BuddyChat className="flex-1 min-h-0 rounded-none shadow-none border-0" />
          </div>
        )}

        {/* 5. Tagline + stats */}
        <div className="w-full flex flex-col items-center gap-4 pt-2 pb-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <p className="text-white font-extrabold text-xl sm:text-2xl md:text-3xl leading-snug max-w-2xl">
              {hero.tagline}
            </p>
            <p className="text-white/80 text-sm sm:text-base max-w-xl">
              {hero.subtitle}
            </p>
          </div>
          <div className="flex items-stretch gap-0">
            {hero.stats.map((stat, i) => (
              <>
                {i > 0 && <div key={`divider-${i}`} className="w-px bg-white/40 self-stretch" />}
                <div key={stat.label} className="flex flex-col items-center px-8 sm:px-12">
                  <span className="text-white font-black text-3xl sm:text-4xl">{stat.value}</span>
                  <span className="text-white/80 text-sm font-medium">{stat.label}</span>
                </div>
              </>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
