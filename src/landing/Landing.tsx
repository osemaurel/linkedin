import { useEffect } from 'react';
import Lenis from 'lenis';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Hero } from './sections/Hero';
import { Benefits, Features, HowItWorks } from './sections/Features';
import { Africa, Audiences } from './sections/Social';
import { Comparison, Faq, Pricing } from './sections/Plans';
import { FinalCall, Tips } from './sections/Stories';
import './landing.css';

/**
 * Page d'accueil d'Uptimizz. Mise en page, police, couleurs et animations reprises du
 * modèle Alytics (Framer) ; textes, marque et illustrations propres au produit.
 */
export default function Landing() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Uptimizz · Transforme ton profil LinkedIn en opportunités';
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
        <Africa />
        <Audiences />
        <Pricing />
        <Comparison />
        <Faq />
        <Tips />
        <FinalCall />
      </main>
      <Footer />
    </div>
  );
}
