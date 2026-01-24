import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Star, RocketLaunch } from '@mui/icons-material';

const ROTATING_TEXTS = [
  '🤝 Networking',
  '👥 Mentorship',
  '🚀 Collaboration',
  '⭐ Success',
];

// Stats to display on right side
const HERO_STATS = [
  { number: '15K+', label: 'Active Members' },
  { number: '2K+', label: 'Mentorships' },
  { number: '500+', label: 'Companies', sub: 'Partners' },
  { number: '98%', label: 'Satisfaction' },
];

// Animation variants
const textVariants = {
  hidden: {
    opacity: 0,
    y: 30,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.8,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

const wordVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    rotateX: 90,
  },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.6,
      ease: 'backOut',
    },
  },
};

const slideUpFast = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const fastFadeIn = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

interface HeroSectionProps {
  sectionBackground: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [textIndex, setTextIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const timer = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.section
      className={`relative py-6 bg-gradient-to-br ${sectionBackground}`}
      initial="hidden"
      animate={isLoaded ? 'visible' : 'hidden'}
      variants={fastFadeIn}
    >
      <div className="w-full px-6 md:px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content - Enhanced Hero Text */}
          <motion.div variants={textVariants} className="space-y-8">
            {/* Animated Badge */}
            <motion.div
              className="inline-flex items-center gap-3 px-5 py-3 rounded-full backdrop-blur-md border"
              style={{
                background: darkMode
                  ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))'
                  : 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(21, 128, 61, 0.1))',
                borderColor: darkMode
                  ? 'rgba(16, 185, 129, 0.3)'
                  : 'rgba(34, 197, 94, 0.3)',
              }}
              whileHover={{ scale: 1.08, y: -2 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Star className="text-yellow-500" sx={{ fontSize: 20 }} />
              <span
                className={`font-semibold text-sm ${darkMode ? 'text-green-300' : 'text-green-700'}`}
              >
                ✨ Trusted by 15,000+ KIIT Community
              </span>
            </motion.div>

            {/* Enhanced Hero Heading with Text Transformation */}
            <div className="space-y-6">
              <motion.h1
                className={`text-6xl md:text-7xl lg:text-8xl font-black leading-tight ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
                style={{ perspective: '1000px' }}
              >
                <motion.span
                  variants={wordVariants}
                  initial="hidden"
                  animate="visible"
                  className="relative inline-block"
                >
                  <span className="relative bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                    Nexus
                  </span>
                </motion.span>
                <br />
                <motion.span
                  className="text-3xl md:text-5xl lg:text-6xl block mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={textIndex}
                      initial={{
                        opacity: 0,
                        y: 40,
                        rotateX: 90,
                        filter: 'blur(10px)',
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        rotateX: 0,
                        filter: 'blur(0px)',
                      }}
                      exit={{
                        opacity: 0,
                        y: -40,
                        rotateX: -90,
                        filter: 'blur(10px)',
                      }}
                      transition={{
                        duration: 0.6,
                        ease: 'easeOut',
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent inline-block"
                    >
                      {ROTATING_TEXTS[textIndex]}
                    </motion.span>
                  </AnimatePresence>{' '}
                  <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                    Redefined
                  </span>
                </motion.span>
              </motion.h1>

              {/* Description */}
              <motion.p
                variants={slideUpFast}
                transition={{ delay: 0.4 }}
                className={`text-xl md:text-2xl max-w-2xl leading-relaxed ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
              >
                Connecting KIIT students with alumni worldwide through{' '}
                <span className="text-green-600 dark:text-green-400 font-semibold">
                  intelligent networking, mentorship, and career opportunities
                </span>
              </motion.p>
            </div>

            {/* CTA Buttons */}
            <motion.div
              variants={slideUpFast}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              {!user ? (
                <>
                  <motion.button
                    onClick={() => navigate('/register')}
                    className="group relative px-8 py-4 rounded-xl font-bold text-lg overflow-hidden"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      background:
                        'linear-gradient(135deg, #10b981, #059669, #047857)',
                      color: 'white',
                    }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Get Started Free
                      <motion.span
                        animate={{ x: [0, 5, 0] }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        →
                      </motion.span>
                    </span>
                  </motion.button>
                  <motion.button
                    onClick={() => navigate('/auth')}
                    className={`px-8 py-4 rounded-xl font-bold text-lg border-2 ${
                      darkMode
                        ? 'border-green-500 text-green-400 hover:bg-green-500/10'
                        : 'border-green-600 text-green-700 hover:bg-green-50'
                    } transition-all`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sign In
                  </motion.button>
                </>
              ) : (
                <motion.button
                  onClick={() => navigate('/dashboard')}
                  className="group relative px-8 py-4 rounded-xl font-bold text-lg overflow-hidden"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background:
                      'linear-gradient(135deg, #10b981, #059669, #047857)',
                    color: 'white',
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Go to Dashboard
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      →
                    </motion.span>
                  </span>
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Right Content - Visual Elements with Circle Background */}
          <motion.div
            variants={textVariants}
            transition={{ delay: 0.3 }}
            className="relative hidden lg:block h-[550px]"
          >
            {/* Decorative Circle Background Elements */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />

            {/* Central Rotating Circle Design */}
            <motion.div
              className={`absolute inset-0 flex items-center justify-center ${
                darkMode ? 'text-green-400/10' : 'text-green-600/10'
              }`}
              animate={{ rotate: 360 }}
              transition={{
                duration: 50,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <svg
                width="400"
                height="400"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="200"
                  cy="200"
                  r="150"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="10 10"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="100"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                />
                <circle
                  cx="200"
                  cy="200"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            </motion.div>

            {/* Stats Card Overlay on Top */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              variants={slideUpFast}
              transition={{ delay: 0.3 }}
            >
              <motion.div
                className="backdrop-blur-xl rounded-3xl p-8 border shadow-2xl w-full max-w-sm"
                style={{
                  background: darkMode
                    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.65))'
                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(240, 253, 244, 0.85))',
                  borderColor: darkMode
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'rgba(34, 197, 94, 0.3)',
                }}
                whileHover={{ y: -5 }}
              >
                <motion.h3
                  className={`text-2xl md:text-3xl font-black mb-8 flex items-center gap-3 ${
                    darkMode ? 'text-green-300' : 'text-green-700'
                  }`}
                  variants={slideUpFast}
                >
                  <RocketLaunch sx={{ fontSize: 28 }} />
                  Your Network Awaits
                </motion.h3>

                <motion.div
                  className="grid grid-cols-2 gap-6"
                  variants={fastFadeIn}
                  transition={{ delay: 0.4 }}
                >
                  {HERO_STATS.map((stat, index) => (
                    <motion.div
                      key={index}
                      variants={slideUpFast}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-center group"
                      whileHover={{ scale: 1.05 }}
                    >
                      <div
                        className="text-3xl md:text-4xl font-black mb-2"
                        style={{
                          background:
                            'linear-gradient(135deg, #10b981, #059669)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {stat.number}
                      </div>
                      <p
                        className={`text-sm md:text-base font-semibold ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}
                      >
                        {stat.label}
                      </p>
                      {stat.sub && (
                        <p
                          className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}
                        >
                          {stat.sub}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
