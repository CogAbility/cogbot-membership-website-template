const features = [
  {
    icon: '🔬',
    title: 'Trustworthy, Science-Backed Info',
    description:
      'Buddy only sources answers from rigorously vetted, expert-backed resources. No random blog posts — just reliable, evidence-based parenting guidance you can trust.',
  },
  {
    icon: '📍',
    title: 'Local to Your Community',
    description:
      'From local pediatricians and family resources to community programs, Buddy provides information relevant to where you actually live.',
  },
  {
    icon: '🌱',
    title: 'Age-Based Guidance',
    description:
      "Newborn through toddler — Buddy understands milestones, routines, and what matters most at every stage of your child's development.",
  },
  {
    icon: '❤️',
    title: 'Built for Real Parents',
    description:
      'Whether you\'re navigating sleep regressions, managing tantrums, or just need to hear "you\'re doing great" — Buddy meets you with warmth and zero judgment.',
  },
  {
    icon: '🔒',
    title: 'Private & Secure',
    description:
      'Your conversations stay between you and Buddy. Industry-standard security means you can ask anything without worry.',
  },
  {
    icon: '✨',
    title: 'Always Getting Smarter',
    description:
      'As new research emerges and your community grows, Buddy evolves to provide even better, more personalized support for your journey.',
  },
];

export default function Features() {
  return (
    <section id="features" className="bg-card py-10 sm:py-16 px-3 sm:px-4 md:px-8 -mt-px">
      <div className="max-w-4xl mx-auto">
        <h2 className="section-heading">Why Parents Love Buddy</h2>
        <p className="section-sub">
          Because the early years are big — and the days are busy. Buddy helps you turn brain science into everyday moments you&apos;re already having.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mt-8 sm:mt-12">
          {features.map((f) => (
            <div key={f.title} className="card group">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-muted flex items-center justify-center mb-4 text-xl sm:text-2xl">
                {f.icon}
              </div>
              <h3 className="font-black text-foreground text-base sm:text-lg mb-2 group-hover:text-primary transition-colors">
                {f.title}
              </h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
