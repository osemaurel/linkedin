import { useEffect } from 'react';
import Lenis from 'lenis';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './sections/Hero';
import { Benefits, Features, HowItWorks } from './sections/Features';
import { Integrations, Testimonials } from './sections/Social';
import { Comparison, Faq, Pricing } from './sections/Plans';
import { Blogs, Newsletter } from './sections/Stories';
import './landing.css';

/**
 * Copie de la page Alytics (modèle Framer), base de la future page d'accueil.
 * Même structure, mêmes ressources, mêmes animations et défilement adouci (Lenis, 1 s).
 */
export default function AlyticsLanding() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Alytics - The Perfect Saas Template';
    const body = document.body.style;
    const previousBg = body.backgroundColor;
    body.backgroundColor = '#fcfcfc';

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = reduced ? null : new Lenis({ duration: 1, anchors: true });
    let frame = 0;
    const raf = (time: number) => {
      lenis?.raf(time);
      frame = requestAnimationFrame(raf);
    };
    if (lenis) frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      document.title = previousTitle;
      body.backgroundColor = previousBg;
    };
  }, []);

  return (
    <div className="al-root">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Benefits />
        <HowItWorks />
        <Integrations />
        <Testimonials />
        <Pricing />
        <Comparison />
        <Faq />
        <Blogs />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
