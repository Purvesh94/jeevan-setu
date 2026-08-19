import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart, Mic, Camera, MapPin, Globe, Shield, Building2,
  Phone, ArrowRight, CheckCircle2, Lock, Zap, Users,
  FileCheck, Clock, AlertTriangle,
} from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
};

const stagger = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[var(--radius-sm)] gradient-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-text-primary tracking-tight">JeevanSetu</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="tel:112"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emergency hover:bg-emergency-light rounded-[var(--radius-sm)] transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span>112</span>
            </a>
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-semibold text-white bg-action hover:bg-action-dark rounded-[var(--radius-md)] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-xs font-medium text-action bg-action-light rounded-full border border-action/10">
              <Zap className="w-3 h-3" />
              AI-Powered Emergency Response Platform
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.1] tracking-tight"
          >
            Emergency help shouldn't
            <br />
            <span className="text-action">depend on language</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Speak. Show. Locate. Connect.
            <br className="hidden sm:block" />
            JeevanSetu breaks language barriers in emergencies with AI-powered multilingual communication, secure medical credentials, and instant hospital coordination.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/emergency"
              className="group flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white gradient-emergency rounded-[var(--radius-lg)] shadow-lg shadow-emergency/20 hover:shadow-xl hover:shadow-emergency/30 transition-all emergency-pulse"
            >
              <AlertTriangle className="w-5 h-5" />
              START EMERGENCY
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-text-primary bg-surface border border-border rounded-[var(--radius-lg)] hover:bg-bg hover:border-border-strong transition-all"
            >
              Create Account
            </Link>
          </motion.div>

          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-5 text-xs text-text-muted flex items-center justify-center gap-1"
          >
            <Shield className="w-3 h-3" />
            This platform does not replace emergency professionals. Always call 112 for life-threatening emergencies.
          </motion.p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary">How JeevanSetu Works</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">Four simple steps from emergency to response</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Mic, title: 'Speak or Type', desc: 'Describe the emergency in any language — Hindi, English, Marathi, or more', color: 'bg-action-light text-action' },
              { icon: Camera, title: 'Show', desc: 'Take or upload a photo. Our AI analyzes the scene for emergency context', color: 'bg-warning-light text-warning' },
              { icon: MapPin, title: 'Locate', desc: 'GPS automatically detects your location and finds the nearest hospitals', color: 'bg-success-light text-success' },
              { icon: Building2, title: 'Connect', desc: 'SOS is sent to verified medical affiliates who respond with the right resources', color: 'bg-emergency-light text-emergency' },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative text-center"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-[var(--radius-lg)] ${step.color} mb-4`}>
                  <step.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-7 left-[calc(100%_-_16px)] w-8 border-t-2 border-dashed border-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-16">
            <h2 className="text-3xl font-bold text-text-primary">Built for Real Emergencies</h2>
            <p className="mt-3 text-text-secondary max-w-xl mx-auto">Every feature designed with safety, privacy, and speed in mind</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'Multilingual AI', desc: 'Detects language, translates, and classifies emergencies in Hindi, English, Marathi, and more' },
              { icon: Building2, title: 'Smart Hospital Finder', desc: 'Recommends the best hospital based on emergency type, distance, and available specialties' },
              { icon: Shield, title: 'Verifiable Credentials', desc: 'W3C-standard medical credentials with cryptographic signatures and controlled sharing' },
              { icon: FileCheck, title: 'Consent-Based Sharing', desc: 'Medical information shared only with explicit user consent and automatic expiry' },
              { icon: Users, title: 'Medical Affiliate Network', desc: 'Verified medical professionals with a command-center dashboard for emergency response' },
              { icon: Lock, title: 'Privacy First', desc: 'Row-level security, encrypted storage, audit trails, and no plaintext sensitive data' },
              { icon: Clock, title: 'Auto-Expiring Access', desc: 'Shared credentials automatically expire after the defined time window' },
              { icon: Zap, title: 'AI Fallback Design', desc: 'If AI, GPS, or cameras fail, the system degrades gracefully — emergencies never blocked' },
              { icon: CheckCircle2, title: 'Full Audit Trail', desc: 'Every sensitive action logged — credential access, consent changes, status updates' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                {...stagger}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="p-6 bg-surface border border-border rounded-[var(--radius-xl)] hover:shadow-card-hover hover:border-border-strong transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] bg-action-light text-action mb-4">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{feature.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo scenario */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-navy text-white">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-12">
            <h2 className="text-3xl font-bold">See It in Action</h2>
            <p className="mt-3 text-white/60">A Hindi-speaking bystander witnesses a road accident</p>
          </motion.div>

          <div className="space-y-4">
            {[
              { step: '1', text: '"एक आदमी का एक्सीडेंट हो गया है और वह बेहोश है।"', sub: 'Voice input in Hindi' },
              { step: '2', text: 'Language Detected: Hindi → Translated to English', sub: 'AI Processing' },
              { step: '3', text: 'Category: ROAD_ACCIDENT | Priority: CRITICAL', sub: 'Emergency Classification' },
              { step: '4', text: 'GPS: 28.6139°N, 77.2090°E — Finding trauma hospitals', sub: 'Location & Hospital Matching' },
              { step: '5', text: 'SOS Card Generated → Sent to AIIMS Trauma Center', sub: 'Medical Affiliate Notified' },
              { step: '6', text: 'Consent Request → Blood Group & Allergy → Approved (30 min)', sub: 'Credential Sharing with Consent' },
              { step: '7', text: '✓ Credential Verified → Treatment Started → Auto-Expired', sub: 'Complete Audit Trail' },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...stagger}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="flex gap-4 items-start p-4 rounded-[var(--radius-lg)] bg-white/5 border border-white/10"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-action flex items-center justify-center text-sm font-bold">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-white/90">{item.text}</p>
                  <p className="text-sm text-white/40 mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety note */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-emergency-light border-t border-emergency/10">
        <div className="max-w-3xl mx-auto text-center">
          <AlertTriangle className="w-8 h-8 text-emergency mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-emergency-dark mb-2">Safety First</h3>
          <p className="text-sm text-text-secondary">
            JeevanSetu is an AI-assisted emergency coordination tool. It does not replace emergency services.
            Always call <strong>112</strong> for life-threatening emergencies. The AI does not diagnose or prescribe.
          </p>
          <a
            href="tel:112"
            className="inline-flex items-center gap-2 mt-4 px-6 py-2.5 text-sm font-semibold text-white bg-emergency rounded-[var(--radius-md)] hover:bg-emergency-dark transition-colors"
          >
            <Phone className="w-4 h-4" />
            CALL 112 NOW
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-surface border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-emergency" fill="currentColor" />
            <span className="text-sm font-semibold text-text-primary">JeevanSetu</span>
            <span className="text-sm text-text-muted">— Every second matters</span>
          </div>
          <p className="text-xs text-text-muted">
            Built with ❤️ for emergencies. Not a replacement for professional emergency services.
          </p>
        </div>
      </footer>
    </div>
  );
}
