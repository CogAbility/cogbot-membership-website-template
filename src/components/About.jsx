import { Link } from 'react-router-dom';

const checkItems = [
  'Evidence-based answers from vetted sources',
  'Available 24/7 — no appointments, no wait times',
  'Locally aware — knows your community resources',
  'Judgment-free, warm, and always encouraging',
];

export default function About() {
  return (
    <section id="about" className="bg-card py-10 sm:py-16 px-3 sm:px-4 md:px-8 -mt-px">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="section-heading">Who is Buddy?</h2>

        <p className="text-muted-foreground text-xs sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4 max-w-2xl mx-auto mt-4">
          Buddy is an AI CogBot made by CogAbility for Build A Brain. Think of Buddy as your always-on, judgment-free parenting companion — available 24/7 whenever you need guidance, reassurance, or just someone to bounce ideas off of.
        </p>
        <p className="text-muted-foreground text-xs sm:text-base md:text-lg leading-relaxed mb-8 sm:mb-10 max-w-2xl mx-auto">
          The Build a Brain Project is a curated, supportive space where parents learn about early brain development and why it matters — through bite-sized lessons, real-life examples, and encouragement from other parents. This is not &quot;more content.&quot; It&apos;s a guided experience designed to help you feel confident, consistent, and supported.
        </p>

        {/* Check list */}
        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
          {checkItems.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-xs sm:text-sm text-foreground font-semibold"
            >
              <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              {item}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <Link to="/members" className="btn-primary px-8 py-3.5 text-sm sm:text-base">
            Start Chatting with Buddy
          </Link>
          <a
            href="https://buildabrain.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border-2 border-primary text-primary font-bold text-sm sm:text-base transition-all duration-200 hover:bg-primary hover:text-white"
          >
            Learn About Build a Brain
          </a>
        </div>

        {/* Attribution */}
        <p className="text-muted-foreground text-[10px] sm:text-xs mt-8 sm:mt-10">
          Want to learn more about Build a Brain?{' '}
          <a
            href="https://buildabrain.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-semibold"
          >
            Visit buildabrain.org
          </a>
        </p>
      </div>
    </section>
  );
}
