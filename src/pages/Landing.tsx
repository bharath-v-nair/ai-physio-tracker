import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { Activity, Shield, Zap, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: <Activity className="w-6 h-6 text-[#4F8EF7]" />,
    title: "Real-time Analysis",
    description: "Your webcam and pose detection follow key body points, count your reps and flag common form mistakes as you move."
  },
  {
    icon: <Zap className="w-6 h-6 text-[#4F8EF7]" />,
    title: "Personalized Plans",
    description: "Exercise plans matched to the posture issues your assessment finds."
  },
  {
    icon: <Shield className="w-6 h-6 text-[#4F8EF7]" />,
    title: "Private by Design",
    description: "Video frames are analysed on the fly and never saved. Only your scores and session history are stored."
  },
  {
    icon: <MessageCircle className="w-6 h-6 text-[#4F8EF7]" />,
    title: "AI Assistant",
    description: "Ask questions about your exercises and progress. For pain or warning signs, it points you to a clinician."
  }
];

const steps = [
  {
    title: "Check your posture",
    description: "Sit in front of your webcam for a short live assessment. PhysioAI scores head position, shoulder level and body lean."
  },
  {
    title: "Exercise with live feedback",
    description: "Follow a guided exercise while the camera counts reps and tells you when your form slips."
  },
  {
    title: "Track your progress",
    description: "See your scores and sessions over time, and ask the AI assistant about your routine."
  }
];

export const Landing = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-[#4F8EF7]/30">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[#F8FAFC] -skew-y-3 transform origin-top-left -z-10" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-gray-100 mb-8">
                  <span className="flex h-2 w-2 rounded-full bg-[#34C759]"></span>
                  <span className="text-sm font-medium text-gray-600">Academic prototype</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-8 leading-[1.1]">
                  Your Personal <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4F8EF7] to-[#34C759]">
                    AI Physiotherapist
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Real-time posture analysis, personalized rehabilitation plans, and intelligent recovery tracking—all from your webcam.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link to="/register">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full">
                      Start Assessment
                    </Button>
                  </Link>
                  <a href="#how-it-works">
                    <Button size="lg" variant="secondary" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full">
                      Learn More
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>
            
            {/* Dashboard Mockup Image */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
              <div className="rounded-2xl border border-gray-200/50 bg-white/50 p-2 backdrop-blur-xl shadow-2xl">
                <div className="rounded-xl overflow-hidden bg-gray-100 aspect-video relative flex items-center justify-center">
                  <img
                    src="/dashboard-preview.jpg"
                    alt="PhysioAI dashboard showing form scores and session history"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="scroll-mt-20 py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Everything you need to recover</h2>
              <p className="mt-4 text-lg text-gray-600">Computer vision for your movement, generative AI for your questions.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, idx) => (
                <div key={idx} className="p-6 bg-[#F8FAFC] rounded-3xl border border-gray-100 transition-transform hover:-translate-y-1">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="scroll-mt-20 py-24 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">How it works</h2>
              <p className="mt-4 text-lg text-gray-600">Three steps, all in your browser with a webcam.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, idx) => (
                <div key={idx} className="p-6 bg-white rounded-3xl border border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-[#4F8EF7] text-white font-bold flex items-center justify-center mb-6">
                    {idx + 1}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} PhysioAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
