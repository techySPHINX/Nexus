import { FC, MouseEvent, useMemo, useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Highlight } from './ui/hero-highlight';

const HERO_PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80';

interface HeroSectionProps {
  sectionBackground: string;
  lowPerformanceMode?: boolean;
}

const HeroSection: FC<HeroSectionProps> = ({
  sectionBackground,
  lowPerformanceMode = false,
}) => {
  const darkMode = useTheme().isDark;

  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const hoverProgress = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 150,
    damping: 20,
  });
  const previewDepth = useSpring(useTransform(hoverProgress, [0, 1], [0, 42]), {
    stiffness: 220,
    damping: 24,
  });
  const previewScale = useSpring(
    useTransform(hoverProgress, [0, 1], [1, 1.03]),
    {
      stiffness: 220,
      damping: 24,
    }
  );
  const previewTransform = useMotionTemplate`translateZ(${previewDepth}px) scale(${previewScale})`;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = (e.clientX - centerX) / (rect.width / 2);
    const y = (e.clientY - centerY) / (rect.height / 2);

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => {
    hoverProgress.set(1);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    hoverProgress.set(0);
  };

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    }),
    []
  );

  return (
    <section
      className={`relative h-auto flex items-center overflow-hidden ${sectionBackground}`}
    >
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={
          lowPerformanceMode
            ? undefined
            : {
                backgroundPosition: ['0% 0%', '100% 100%'],
              }
        }
        transition={
          lowPerformanceMode
            ? undefined
            : {
                duration: 20,
                repeat: Infinity,
                repeatType: 'reverse',
              }
        }
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)`,
          backgroundSize: '100% 100%',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:py-20 lg:px-8 lg:py-4">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-16 items-center"
          variants={containerVariants}
        >
          <div className="space-y-6 text-center lg:space-y-8 lg:text-left">
            <motion.div className="space-y-4">
              <div className="relative">
                {/* Floating Elements */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/20 rounded-full animate-float" />
                <div className="absolute top-20 right-20 w-16 h-16 bg-emerald-400/20 rounded-full animate-float animation-delay-2000" />

                <div className="py-2">
                  <span className="text-sm font-medium tracking-wider text-gray-500 dark:text-gray-400 uppercase">
                    Student • Alumni • Connection
                  </span>

                  <h1 className="text-8xl lg:text-9xl font-black leading-none mt-4">
                    <p
                      className="font-extrabold bg-clip-text text-transparent 
                      bg-[linear-gradient(to_right,theme(colors.green.700),theme(colors.green.500),theme(colors.yellow.300),theme(colors.green.500),theme(colors.green.700))] bg-[length:200%_auto]
                      dark:bg-[linear-gradient(to_right,theme(colors.green.300),theme(colors.green.100),theme(colors.yellow.200),theme(colors.green.100),theme(colors.green.300))] bg-[length:200%_auto]
                      animate-gradient"
                    >
                      Nexus
                    </p>
                  </h1>

                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 text-3xl sm:text-4xl md:text-5xl font-bold">
                    <motion.span className="inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                      Collaboration
                    </motion.span>
                    <span className="text-gray-900 dark:text-white">
                      Redefined
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Connect with KIIT alumni worldwide through{' '}
              <Highlight className="font-semibold text-emerald-600 dark:text-emerald-400">
                AI-powered networking, expert mentorship, and exclusive career
                opportunities
              </Highlight>
            </motion.p>

            <motion.div className="flex flex-wrap gap-2 justify-center lg:justify-start">
              {['AI Matching', 'Live Mentors', 'Career Boost'].map((chip) => (
                <motion.span
                  key={chip}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 shadow-sm"
                  whileHover={
                    lowPerformanceMode ? undefined : { scale: 1.05, y: -2 }
                  }
                >
                  {chip}
                </motion.span>
              ))}
            </motion.div>

            <motion.div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <motion.button
                className="px-8 py-4 rounded-xl font-bold text-lg border-2 border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                whileHover={
                  lowPerformanceMode ? undefined : { scale: 1.05, y: -2 }
                }
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
              <motion.button
                className="group relative px-8 py-4 rounded-xl font-bold text-lg text-white overflow-hidden shadow-lg shadow-emerald-500/30"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                }}
                whileHover={
                  lowPerformanceMode ? undefined : { scale: 1.05, y: -2 }
                }
                whileTap={{ scale: 0.95 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started
                  <motion.span
                    animate={lowPerformanceMode ? undefined : { x: [0, 4, 0] }}
                    transition={
                      lowPerformanceMode
                        ? undefined
                        : { duration: 1.5, repeat: Infinity }
                    }
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </span>
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            ref={cardRef}
            className="relative z-10 h-[360px] sm:h-[420px] lg:h-[500px]"
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              perspective: '1000px',
            }}
          >
            <motion.div
              className="absolute -inset-4 rounded-3xl blur-3xl opacity-60"
              style={{
                background:
                  'radial-gradient(circle, rgba(16,185,129,0.4), rgba(6,182,212,0.3), transparent 70%)',
              }}
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.4, 0.6, 0.4],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            <motion.div
              className="relative h-full rounded-2xl overflow-hidden shadow-2xl border border-emerald-200/50 dark:border-emerald-800/50 bg-white dark:bg-slate-900"
              style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
              }}
            >
              <img
                src={HERO_PREVIEW_IMAGE}
                loading="lazy"
                decoding="async"
                alt="Team collaboration"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent" />

              <motion.div
                className="absolute top-4 right-4 sm:top-6 sm:right-6 px-4 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg"
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <span className="text-sm font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Join 15,000+ KIIT Community Members
                </span>
              </motion.div>

              <motion.div
                className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 backdrop-blur-xl rounded-2xl border border-white/20"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.35 }}
                whileHover={{
                  y: [0, -8, 0],
                  borderColor: darkMode
                    ? 'rgba(52, 211, 153, 0.72)'
                    : 'rgba(5, 150, 105, 0.62)',
                  boxShadow: darkMode
                    ? '0 20px 45px rgba(16, 185, 129, 0.35)'
                    : '0 18px 40px rgba(5, 150, 105, 0.28)',
                }}
                whileTap={{ y: -3 }}
                whileFocus={{ y: -3 }}
                style={{
                  transform: previewTransform,
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  borderColor: darkMode
                    ? 'rgba(255,255,255,0.22)'
                    : 'rgba(255,255,255,0.32)',
                  boxShadow: darkMode
                    ? '0 8px 22px rgba(2, 6, 23, 0.45)'
                    : '0 8px 20px rgba(15, 23, 42, 0.16)',
                }}
              >
                <img
                  src={
                    darkMode ? 'dashboardNexusDark.webp' : 'dashboardNexus.webp'
                  }
                  alt={
                    darkMode
                      ? 'Dashboard preview in dark mode'
                      : 'Dashboard preview in light mode'
                  }
                  className="rounded-2xl w-full h-full object-cover"
                />
              </motion.div>
            </motion.div>

            <motion.div
              className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur-2xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute -top-2 -left-2 sm:-top-4 sm:-left-4 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 opacity-20 blur-2xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.4, 0.2, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
