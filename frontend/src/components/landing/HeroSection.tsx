import { FC, MouseEvent, useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Highlight } from '../ui/hero-highlight';

// const ROTATING_TEXTS = ['Networking', 'Mentorship', 'Collaboration', 'Success'];

const HERO_PREVIEW_IMAGE =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80';

interface HeroSectionProps {
  sectionBackground: string;
}

const HeroSection: FC<HeroSectionProps> = ({ sectionBackground }) => {
  // const [textIndex, setTextIndex] = useState(0);
  // const [isLoaded, setIsLoaded] = useState(false);
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

  // useEffect(() => {
  //   setIsLoaded(true);
  //   const timer = setInterval(() => {
  //     setTextIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
  //   }, 2000);
  //   return () => clearInterval(timer);
  // }, []);

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  // const itemVariants = {
  //   hidden: { opacity: 0, y: 20 },
  //   visible: {
  //     opacity: 1,
  //     y: 0,
  //     transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  //   },
  // };

  return (
    <section
      className={`relative min-h-screen flex overflow-hidden ${sectionBackground}`}
    >
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)`,
          backgroundSize: '100% 100%',
        }}
      />

      <div className="container mx-10 px-1 sm:px-1 lg:px-1 relative z-10 py-1 lg:py-1">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-16 items-center"
          variants={containerVariants}
          // initial="hidden"
          // animate={isLoaded ? 'visible' : 'hidden'}
        >
          <div className="space-y-6 lg:space-y-8 text-top lg:text-left">
            <motion.div
              // variants={itemVariants}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 dark:from-emerald-400 dark:via-green-400 dark:to-teal-400 bg-clip-text text-transparent">
                  Nexus
                </span>
              </h1>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 text-3xl sm:text-4xl md:text-5xl font-bold">
                {/* <div className="relative h-[1.2em] w-[280px] sm:w-[320px] overflow-hidden"> */}
                {/* {ROTATING_TEXTS.map((text, index) => ( */}
                <motion.span
                  // key={text}
                  // initial={{ opacity: 0, y: 50, filter: 'blur(10px)' }}
                  // animate={{
                  //   opacity: textIndex === index ? 1 : 0,
                  //   y: textIndex === index ? 0 : -50,
                  //   filter: textIndex === index ? 'blur(0px)' : 'blur(10px)',
                  // }}
                  // transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent"
                >
                  Collaboration
                </motion.span>
                {/* ))} */}
                {/* </div> */}
                <span className="text-gray-900 dark:text-white">Redefined</span>
              </div>
            </motion.div>
            <motion.p
              // variants={itemVariants}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Connect with KIIT alumni worldwide through{' '}
              <Highlight className="font-semibold text-emerald-600 dark:text-emerald-400">
                AI-powered networking, expert mentorship, and exclusive career
                opportunities
              </Highlight>
            </motion.p>

            <motion.div
              // variants={itemVariants}
              className="flex flex-wrap gap-2 justify-center lg:justify-start"
            >
              {['AI Matching', 'Live Mentors', 'Career Boost'].map((chip) => (
                <motion.span
                  key={chip}
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 shadow-sm"
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  {chip}
                </motion.span>
              ))}
            </motion.div>

            <motion.div
              // variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4"
            >
              <motion.button
                className="group relative px-8 py-4 rounded-xl font-bold text-lg text-white overflow-hidden shadow-lg shadow-emerald-500/30"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started Free
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </span>
              </motion.button>

              <motion.button
                className="px-8 py-4 rounded-xl font-bold text-lg border-2 border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign In
              </motion.button>
            </motion.div>
          </div>

          <motion.div
            ref={cardRef}
            // variants={itemVariants}
            className="relative h-[400px] sm:h-[450px] lg:h-[500px] perspective-1000 z-500"
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

      <div className="absolute bg-red bottom-8 left-1/2 -translate-x-1/2 hidden lg:block">
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-gray-400 dark:text-gray-600"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
