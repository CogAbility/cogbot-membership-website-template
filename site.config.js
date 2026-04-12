/**
 * site.config.js — the only file you need to edit to customize this site.
 *
 * This file controls all branding, content, and copy. The shared code in src/
 * reads from this file and never needs to change between clients.
 *
 * How to customize:
 *   - Edit the values below directly, or
 *   - Open this project in Lovable, Cursor, Replit, or Bolt and ask the AI:
 *       "Change the site name to X"
 *       "Update the hero tagline to..."
 *       "Replace the testimonials with..."
 *
 * Also update:
 *   - public/bot-icon.svg       — chat avatar icon (replace with your own image)
 *   - public/org-logo.svg       — org logo shown in the hero (replace with your own image)
 *   - public/favicon.svg        — browser tab icon
 *   - .env                      — service credentials (App ID, CMG, CogBot)
 */

export default {
  // Core identity
  siteName: 'Build a Brain',
  botName: 'Buddy',
  orgName: 'Build A Brain, Build A Life, Build A Community LLC',
  orgUrl: 'https://buildabrain.org',
  poweredByName: 'CogAbility',
  poweredByUrl: 'https://cogability.net',

  // Page metadata (SEO, social sharing, browser tab)
  // These are injected into index.html at build time by the Vite plugin.
  // If omitted, title and description are composed from botName + siteName + hero.subtitle.
  meta: {
    title: 'Buddy AI Parent Helper | Build a Brain',
    description: 'An evidence-based AI parenting companion designed to help parents navigate the early years with confidence.',
  },

  // Image paths (relative to public/)
  // Replace the placeholder files with your own images (any format: svg, webp, png).
  images: {
    botIcon: '/buddy-icon.webp',       // Chat avatar and header icon
    orgLogo: '/bab-full-logo.webp',    // "Presented by" logo in hero
    favicon: '/favicon.svg',
  },

  // Header
  header: {
    projectBadge: 'The Build A Brain Project',
    projectBadgeInitial: 'B',
    memberBadgeLabel: 'Build a Brain Member',
    signInLabel: 'Become a Member',
    editProfileLabel: 'Edit Profile',
    signOutLabel: 'Sign Out',
    signedInLabel: 'Signed in',
    accountMenuAriaLabel: 'Account menu',
    signInAriaLabel: 'Sign in',
  },

  // Hero section (public landing page, top of page)
  hero: {
    tagline: "You don't have to figure out the early years alone.",
    subtitle: 'Your always-on, science-backed AI parenting companion — built for real parents, right in your community.',
    chatLabel: 'Chat with Buddy',
    memberWelcome: 'Welcome, Build a Brain Member',
    stats: [
      { value: '24/7', label: 'Available' },
      { value: '100%', label: 'Free' },
    ],
    presentedByLabel: 'Presented by',
    loadingLabel: 'Loading...',
    geofenceHeading: 'Not Available in Your Area',
    defaultGeofenceMessage: 'This service is not available in your area.',
    chatHeaderColor: '#1e3a5f',
  },

  // Features section
  features: {
    heading: 'Why Parents Love Buddy',
    subheading: 'Because the early years are big — and the days are busy. Buddy helps you turn brain science into everyday moments you\'re already having.',
    items: [
      {
        icon: '🔬',
        title: 'Trustworthy, Science-Backed Info',
        description: 'Buddy only sources answers from rigorously vetted, expert-backed resources. No random blog posts — just reliable, evidence-based parenting guidance you can trust.',
      },
      {
        icon: '📍',
        title: 'Local to Your Community',
        description: 'From local pediatricians and family resources to community programs, Buddy provides information relevant to where you actually live.',
      },
      {
        icon: '🌱',
        title: 'Age-Based Guidance',
        description: "Newborn through toddler — Buddy understands milestones, routines, and what matters most at every stage of your child's development.",
      },
      {
        icon: '❤️',
        title: 'Built for Real Parents',
        description: 'Whether you\'re navigating sleep regressions, managing tantrums, or just need to hear "you\'re doing great" — Buddy meets you with warmth and zero judgment.',
      },
      {
        icon: '🔒',
        title: 'Private & Secure',
        description: 'Your conversations stay between you and Buddy. Industry-standard security means you can ask anything without worry.',
      },
      {
        icon: '✨',
        title: 'Always Getting Smarter',
        description: 'As new research emerges and your community grows, Buddy evolves to provide even better, more personalized support for your journey.',
      },
    ],
  },

  // Testimonials section
  testimonials: {
    heading: 'What Parents Are Saying',
    subheading: 'Real stories from real parents in the Build A Brain community.',
    ctaLabel: 'Chat with Buddy',
    items: [
      {
        quote: "Buddy helped me understand what's actually normal during sleep regressions. I stopped panicking and started trusting the process.",
        name: 'Sarah M.',
        role: 'Mom of a 10-month-old',
        initials: 'SM',
      },
      {
        quote: "I love that the advice is backed by real science — not random internet opinions. It's like having a pediatrician friend on speed dial.",
        name: 'James R.',
        role: 'First-time dad',
        initials: 'JR',
      },
      {
        quote: 'The local resources feature is a game changer. I found a parent support group five minutes from my house that I never knew existed.',
        name: 'Maria L.',
        role: 'Mom of two',
        initials: 'ML',
      },
    ],
  },

  // About section
  about: {
    heading: 'Who is Buddy?',
    paragraphs: [
      'Buddy is an AI CogBot made by CogAbility for Build A Brain. Think of Buddy as your always-on, judgment-free parenting companion — available 24/7 whenever you need guidance, reassurance, or just someone to bounce ideas off of.',
      'The Build a Brain Project is a curated, supportive space where parents learn about early brain development and why it matters — through bite-sized lessons, real-life examples, and encouragement from other parents. This is not "more content." It\'s a guided experience designed to help you feel confident, consistent, and supported.',
    ],
    checkItems: [
      'Evidence-based answers from vetted sources',
      'Available 24/7 — no appointments, no wait times',
      'Locally aware — knows your community resources',
      'Judgment-free, warm, and always encouraging',
    ],
    ctaLabel: 'Start Chatting with Buddy',
    secondaryCtaLabel: 'Learn About Build a Brain',
    secondaryCtaUrl: 'https://buildabrain.org',
    footerNote: 'Want to learn more about Build a Brain?',
    footerLinkLabel: 'Visit buildabrain.org',
    footerLinkUrl: 'https://buildabrain.org',
  },

  // Members page (shown after login + membership validation)
  members: {
    memberBadge: 'Build a Brain Member',
    memberDescription: 'As a member, you have unlimited access to Buddy and all Build a Brain resources.',
    chatHeading: 'Chat with Buddy',
    chatSubheading: 'Ask anything about early childhood development, local resources, or parenting guidance.',
    aboutBotHeading: 'About Buddy',
    aboutBotDescription: 'Buddy is an AI CogBot by CogAbility. All responses are evidence-based and sourced from vetted expert resources.',
    quickTipsHeading: 'Quick Tips',
    quickTips: [
      "Ask about sleep milestones for your child's age",
      'Find local pediatricians and family resources',
      'Get tips for managing toddler tantrums',
      'Learn about age-appropriate activities',
      "Understand what's developmentally normal",
    ],
    greetingTemplate: 'Hi, {firstName} \u{1F44B}',
    signOutLabel: 'Sign Out',
    tipBullet: '\u2192',
    memberEmoji: '\u{1F9E0}',
  },

  // Footer
  footer: {
    brandName: 'Buddy',
    brandSubtitle: 'Build a Brain',
    copyright: 'Build A Brain, Build A Life, Build A Community LLC',
    copyrightUrl: 'https://buildabrain.org',
    poweredByLabel: 'AI by',
    poweredByName: 'CogAbility',
    poweredByUrl: 'https://cogability.net',
    navLinks: [
      { label: 'Features', href: '/#features' },
      { label: 'Testimonials', href: '/#testimonials' },
      { label: 'About', href: '/#about' },
      { label: 'Member Login', href: '/members', internal: true },
    ],
  },

  // Profile page
  profile: {
    heading: 'Your Profile',
    subheading: 'Update your info and Buddy will use it in future conversations.',
    yourInfoHeading: 'Your info',
    childrenHeading: 'Your children',
    saveLabel: 'Save Changes',
    savedMessage: 'Profile updated! Buddy will use your new info going forward.',
    changePasswordLabel: 'Change Password',
    changePasswordSub: 'Manage your password through IBM App ID.',
    backLabel: 'Back to Chat',
    addChildLabel: '+ Add another child',
    savingLabel: 'Saving...',
    backAriaLabel: 'Back to chat',
  },

  // Onboarding flow
  onboarding: {
    welcomeHeading: 'Welcome to Build a Brain!',
    welcomeSubheading: "Let's get to know you and your little one so Buddy can give you the best guidance.",
    step1Label: 'Your Info',
    step2Label: 'Baby Info',
    step3Label: 'All Set',
    step1Heading: "First, tell us about you",
    step1Sub: "We'll use your name to personalize your experience.",
    step2Heading: "Now, tell us about your child",
    step2Sub: "Add your baby's info so Buddy can give age-appropriate guidance.",
    addChildLabel: '+ Add another child',
    removeChildLabel: 'Remove',
    skipLabel: "I'll do this later",
    completeHeading: "You're all set!",
    completeSubheading: 'Start chatting with Buddy to get personalized guidance for your family.',
    completeButtonLabel: 'Start Chatting',
    genderOptions: ['Boy', 'Girl', 'Non-binary', 'Prefer not to say'],
    monthOptions: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    nextLabel: 'Next',
    backLabel: 'Back',
    firstNameLabel: 'First name',
    firstNamePlaceholder: 'Your first name',
    lastNameLabel: 'Last name',
    lastNamePlaceholder: 'Your last name (optional)',
    firstNameRequired: 'First name is required.',
    childNameRequired: 'Child name is required.',
    profileSummaryHeading: 'Your profile',
    nameLabel: 'Name:',
    childLabel: 'Child:',
    childNLabelTemplate: 'Child {n}:',
    bornPrefix: 'born',
    childInfoHeading: "Your child's info",
    childNHeadingTemplate: 'Child {n}',
    childNameLabel: "Child's first name",
    childNamePlaceholder: "Baby's first name",
    genderLabel: 'Gender',
    genderPlaceholder: 'Select gender (optional)',
    birthdayLabel: 'Birthday',
    birthdayOptional: '(optional)',
    monthPlaceholder: 'Month',
    dayPlaceholder: 'Day',
    yearPlaceholder: 'Year',
  },

  // Login page
  login: {
    logoInitial: 'B',
    heading: 'Join Build a Brain',
    subheading: "Sign in or create an account to become a Build a Brain member \u2014 it's free!",
    errorPrefix: 'Sign-in error:',
    loadingLabel: 'Signing in...',
    buttonLabel: 'Sign in with IBM App ID',
    footerText: 'New here? No problem \u2014 signing in automatically creates your free membership.',
  },

  // Access denied page
  accessDenied: {
    geofencedHeading: 'Not Available in Your Area',
    restrictedHeading: 'Access Restricted',
    signedInAsPrefix: 'Signed in as',
    defaultReason: 'You do not have permission to view this page. Please contact an administrator if you believe this is a mistake.',
    homeLabel: 'Return to Home',
    signOutLabel: 'Sign Out',
  },

  // Callback page (OAuth redirect)
  callback: {
    loadingLabel: 'Completing sign-in...',
  },

  // Role gate (access checking UI)
  roleGate: {
    checkingLabel: 'Checking your access...',
    defaultGeofenceMessage: 'This service is not available in your area.',
    notMemberMessage: 'You are not a member of this site.',
    roleRequiredTemplate: 'You need the "{role}" role to access this area.',
  },
}
