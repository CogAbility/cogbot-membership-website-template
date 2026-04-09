import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-foreground py-6 sm:py-8 px-3 sm:px-4 md:px-8 -mt-px">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-primary-foreground/20">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-foreground/20 border border-primary-foreground/30 flex items-center justify-center">
              <span className="text-white font-black text-xs">B</span>
            </div>
            <div>
              <span className="block font-black text-white text-sm">Buddy</span>
              <span className="block text-[10px] text-primary-foreground/50 leading-none">Build a Brain</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <a href="/#features" className="text-primary-foreground/60 text-[11px] sm:text-xs font-semibold hover:text-primary-foreground/90 transition-colors">Features</a>
            <a href="/#testimonials" className="text-primary-foreground/60 text-[11px] sm:text-xs font-semibold hover:text-primary-foreground/90 transition-colors">Testimonials</a>
            <a href="/#about" className="text-primary-foreground/60 text-[11px] sm:text-xs font-semibold hover:text-primary-foreground/90 transition-colors">About</a>
            <Link to="/members" className="text-primary-foreground/60 text-[11px] sm:text-xs font-semibold hover:text-primary-foreground/90 transition-colors">Member Login</Link>
          </nav>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 sm:pt-6 text-center sm:text-left">
          <p className="text-primary-foreground/40 text-[11px] sm:text-xs">
            &copy; {new Date().getFullYear()}{' '}
            <a href="https://buildabrain.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground/70 transition-colors">
              Build A Brain, Build A Life, Build A Community LLC
            </a>
          </p>
          <p className="text-primary-foreground/40 text-[11px] sm:text-xs">
            AI by{' '}
            <a href="https://cogability.net" target="_blank" rel="noopener noreferrer" className="hover:text-primary-foreground/70 transition-colors">
              CogAbility
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
