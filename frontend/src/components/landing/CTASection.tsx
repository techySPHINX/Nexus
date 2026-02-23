import React, { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { CanvasText } from '../ui/canvas-text';

interface CTASectionProps {
  sectionBackground: string;
}

interface Sparkle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  duration: number;
  delay: number;
}

const CTASection: React.FC<CTASectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const navigate = useNavigate();
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [burstKey, setBurstKey] = useState(0);
  const sparkleIdRef = useRef(0);
  const hasTriggeredInLoopRef = useRef(false);

  const triggerSparkleBurst = useCallback(() => {
    const count = 26;
    const nowId = sparkleIdRef.current;

    const generated: Sparkle[] = Array.from({ length: count }, (_, index) => {
      const baseAngle = (index / count) * Math.PI * 2;
      const jitter = (Math.random() - 0.5) * 0.6;

      return {
        id: nowId + index,
        angle: baseAngle + jitter,
        distance: 90 + Math.random() * 190,
        size: 2 + Math.random() * 4,
        duration: 1.2 + Math.random() * 1,
        delay: Math.random() * 0.2,
      };
    });

    sparkleIdRef.current += count;
    setBurstKey((prev) => prev + 1);
    setSparkles((prev) => [...prev, ...generated]);

    const longestSparkleDuration = Math.max(
      ...generated.map((item) => item.duration + item.delay)
    );
    const cleanupDelay = longestSparkleDuration * 1000 + 300;
    window.setTimeout(() => {
      setSparkles((prev) =>
        prev.filter(
          (item) => !generated.some((newItem) => newItem.id === item.id)
        )
      );
    }, cleanupDelay);
  }, []);

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const videoTime = e.currentTarget.currentTime;

    if (videoTime >= 3.8 && !hasTriggeredInLoopRef.current) {
      hasTriggeredInLoopRef.current = true;
      triggerSparkleBurst();
    }

    if (videoTime < 0.8) {
      hasTriggeredInLoopRef.current = false;
    }
  };

  return (
    <section className={`relative ${sectionBackground}`}>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className={`grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 items-center py-14 md:py-16 backdrop-blur-xl ${
            darkMode ? ' bg-transparent' : 'bg-transparent'
          }`}
        >
          <div>
            <p
              className={`text-sm uppercase tracking-[0.2em] mb-3 ${
                darkMode ? 'text-emerald-300' : 'text-emerald-700'
              }`}
            >
              Ready when you are
            </p>
            <h2
              className={`text-4xl md:text-6xl font-black leading-tight mb-8 md:mb-12 ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Join{' '}
              <CanvasText
                text="Nexus"
                backgroundClassName="bg-green-600 dark:bg-green-700"
                colors={[
                  'rgba(0, 255, 153, 1)',
                  'rgba(0, 255, 153, 0.9)',
                  'rgba(0, 255, 153, 0.8)',
                  'rgba(0, 255, 153, 0.7)',
                  'rgba(0, 255, 153, 0.6)',
                  'rgba(0, 255, 153, 0.5)',
                  'rgba(0, 255, 153, 0.4)',
                  'rgba(0, 255, 153, 0.3)',
                  'rgba(0, 255, 153, 0.2)',
                  'rgba(0, 255, 153, 0.1)',
                ]}
                lineGap={4}
                animationDuration={20}
              />{' '}
              and start building your future circle.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-cyan-500"
              >
                Create Free Account
              </motion.button>
              <motion.button
                onClick={() => navigate('/about')}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className={`px-8 py-4 rounded-xl font-bold border ${
                  darkMode
                    ? 'border-emerald-300/40 text-emerald-200 hover:bg-emerald-400/10'
                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Explore Platform
              </motion.button>
            </div>
          </div>

          <div className="flex items-center justify-center lg:justify-end">
            <motion.div className="mx-auto w-full max-w-2xl lg:mx-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl blur-3xl bg-cyan-500/30" />
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  onTimeUpdate={handleVideoTimeUpdate}
                  className="relative rounded-3xl border border-white/20 w-full h-64 md:h-72 object-cover object-[10%_35%]"
                >
                  <source src="/ctaVideo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>

                <AnimatePresence>
                  {sparkles.length > 0 && (
                    <motion.div
                      key={`pulse-${burstKey}`}
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{
                        opacity: [0, 1, 0],
                        scale: [0.95, 1.5, 10],
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, ease: 'easeOut' }}
                      style={{
                        background:
                          'radial-gradient(circle at center, rgba(16, 185, 129, 0.24) 0%, rgba(6, 182, 212, 0.14) 35%, rgba(15, 23, 42, 0) 72%)',
                      }}
                    />
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {sparkles.map((sparkle) => {
                    const endX = Math.cos(sparkle.angle) * sparkle.distance;
                    const endY = Math.sin(sparkle.angle) * sparkle.distance;
                    return (
                      <motion.div
                        key={sparkle.id}
                        className="absolute rounded-full pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          width: `${sparkle.size}px`,
                          height: `${sparkle.size}px`,
                          marginLeft: `${-sparkle.size / 2}px`,
                          marginTop: `${-sparkle.size / 2}px`,
                          background:
                            'radial-gradient(circle, rgba(52, 211, 153, 1) 0%, rgba(16, 185, 129, 0.85) 45%, rgba(6, 182, 212, 0.28) 100%)',
                          boxShadow:
                            '0 0 14px rgba(16, 185, 129, 0.9), 0 0 30px rgba(6, 182, 212, 0.45)',
                          filter: 'blur(0.2px)',
                        }}
                        initial={{
                          x: 0,
                          y: 0,
                          opacity: 0,
                          scale: 0,
                        }}
                        animate={{
                          x: [0, endX * 0.68, endX],
                          y: [0, endY * 0.68, endY],
                          opacity: [0, 1, 1, 1],
                          scale: [0, 2, 1.2, 0.85],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: sparkle.duration,
                          delay: sparkle.delay,
                          ease: 'easeOut',
                        }}
                      />
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
