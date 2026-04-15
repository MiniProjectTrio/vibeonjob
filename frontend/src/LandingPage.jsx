import NavBar from './components/NavBar';
import HeroSection from './components/HeroSection';
import BentoGrid from './components/BentoGrid';
import CTASection from './components/CTASection';
import Footer from './components/Footer';

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <main className="relative overflow-hidden">
        <HeroSection />
        <BentoGrid />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
