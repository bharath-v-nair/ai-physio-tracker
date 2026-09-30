import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HeroFigure } from '../components/dashboard/HeroFigure';

const features = [
  {
    title: "A two-view posture check",
    description: "Facing the camera, it measures head position and shoulder level; turned sideways, your neck angle. Trunk lean is judged by a model trained on expert-labelled posture data."
  },
  {
    title: "Exercises that count themselves",
    description: "Neck side-bends, shoulder shrugs, wall angels and chin tucks, counted live from your movement, with a graph that shows exactly when a rep counts."
  },
  {
    title: "Focus mode while you study",
    description: "Leave it open while you work. It compares you with your own good posture every two seconds and nudges you when you slouch for too long."
  },
  {
    title: "Private by design",
    description: "Video is analysed as it streams and never saved. In focus mode it doesn't even leave your computer. Only your scores and history are stored."
  }
];

const steps = [
  {
    title: "Check your posture",
    description: "A 20-second check: face the camera, then turn sideways. You get a score, and a diagram drawn from your measurements."
  },
  {
    title: "Do the 10-minute routine",
    description: "Four short exercises. The camera counts reps, times holds, and tells you when your form slips."
  },
  {
    title: "Keep it up while you work",
    description: "Focus mode watches your posture during study sessions. Progress charts and an assistant help you keep going."
  }
];

export const Landing = () => {
  return (
    <div className="min-h-screen bg-paper selection:bg-teal-100">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="pt-28 pb-16 md:pt-36 md:pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_minmax(0,520px)] gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.48, ease: [0.25, 1, 0.5, 1] }}>
              <p className="text-sm font-semibold text-primary mb-5">An M.Sc. Data Analytics project</p>
              <h1 className="text-[44px] md:text-[64px] leading-[1.05] text-ink mb-6">
                See your posture. Then train it.
              </h1>
              <p className="text-lg text-muted mb-9 max-w-xl leading-relaxed">
                A 20-second webcam check measures how your head, shoulders and trunk line up. Short exercises with live rep counting and a focus mode that nudges you while you study help you improve it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">Take the posture check</Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">How it works</Button>
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.24, delay: 0.15 }}>
              <HeroFigure />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-20 py-20 border-t border-rule">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-[32px] md:text-[40px] text-ink mb-3">What it does</h2>
            <p className="text-lg text-muted mb-12 max-w-2xl">Computer vision measures how you sit and move. The numbers it saves become your progress.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {features.map((feature) => (
                <div key={feature.title} className="border-t-2 border-primary pt-5">
                  <h3 className="text-[22px] text-ink mb-2">{feature.title}</h3>
                  <p className="text-muted leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="scroll-mt-20 py-20 bg-white border-y border-rule">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-[32px] md:text-[40px] text-ink mb-12">How it works</h2>
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {steps.map((step, idx) => (
                <li key={step.title}>
                  <span className="w-9 h-9 rounded-full border-[1.5px] border-primary text-primary font-semibold grid place-items-center mb-5">{idx + 1}</span>
                  <h3 className="text-[22px] text-ink mb-2">{step.title}</h3>
                  <p className="text-muted leading-relaxed">{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between gap-2 text-sm text-muted">
          <p>PhysioAI, by Blessy Babu. M.Sc. Data Analytics &amp; Big Data project.</p>
          <p>For guidance only: not a medical device. See a physiotherapist for pain.</p>
        </div>
      </footer>
    </div>
  );
};
