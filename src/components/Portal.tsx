"use client";

import { motion } from "framer-motion";
import JoinForm from "@/components/JoinForm";
import Footer from "@/components/Footer";

/* ============================================================================
   THE PORTAL — final home section. CTA + join form + cinematic footer.
   ========================================================================== */

export default function Portal() {
  return (
    <>
      <section id="portal" className="relative min-h-[100svh] flex items-center overflow-hidden py-20 sm:py-24">
        {/* Background */}
        <div className="absolute inset-0 bg-grid-lines opacity-20" />

        {/* Portal glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-magenta/5 rounded-full blur-2xl" />

        <div className="stage-16x9 relative z-10 px-5 sm:px-8 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-cyan text-sm tracking-[0.3em] uppercase font-[family-name:var(--font-geist-mono)] mb-3">
              07
            </p>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold font-[family-name:var(--font-display)]">
              The Portal
            </h2>
            <p className="mt-4 text-foreground/50 max-w-xl mx-auto">
              Ready to enter the digital realm? Join 500+ members and start your journey.
            </p>
            <div className="section-divider mt-6" />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left — Portal Visual */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Animated portal ring */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-cyan/30"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border border-magenta/20"
                />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-8 rounded-full border border-cyan/20"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-gradient-to-br from-cyan/20 to-magenta/20 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl">🚀</span>
                  </div>
                </div>
              </div>

              {/* Supporting lines */}
              <p className="mt-8 text-foreground/50 text-sm text-center max-w-xs leading-relaxed">
                Learn. Build. Experiment. Share. Connect. Shape what comes next.
              </p>

              {/* Secondary CTA */}
              <a
                href="#journey"
                data-cursor="VIEW"
                className="neon-underline mt-4 text-xs tracking-[0.25em] uppercase text-foreground/40 hover:text-cyan transition-colors font-[family-name:var(--font-geist-mono)]"
              >
                Follow the Journey →
              </a>
            </motion.div>

            {/* Right — Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <JoinForm />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <Footer />
    </>
  );
}
