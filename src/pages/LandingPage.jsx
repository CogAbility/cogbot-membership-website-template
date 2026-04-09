import { useAuth } from '../auth/AuthProvider';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import About from '../components/About';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <main>
      <Hero isAuthenticated={isAuthenticated} />
      <Features />
      <Testimonials />
      <About />
    </main>
  );
}
