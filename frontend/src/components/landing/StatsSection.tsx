import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { People, School, Work, EmojiEvents } from '@mui/icons-material';

interface Stat {
  number: string;
  label: string;
  icon: React.ReactNode;
  sub?: string;
}

interface StatsProps {
  sectionBackground: string;
}

const STATS: Stat[] = [
  { number: '15K+', label: 'Active Members', icon: <People /> },
  { number: '2K+', label: 'Mentorship Sessions', icon: <School /> },
  {
    number: '500+',
    label: 'Partner Companies',
    icon: <Work />,
    sub: 'Top Tier Companies',
  },
  {
    number: '98%',
    label: 'Satisfaction Rate',
    icon: <EmojiEvents />,
    sub: 'User Feedback',
  },
];

const StatsSection: React.FC<StatsProps> = ({ sectionBackground }) => {
  const { isDark } = useTheme();
  const darkMode = isDark;

  const waveStyle = `
    @keyframes text-wave {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    .wave-text {
      display: inline-block;
      animation: text-wave 2s ease-in-out infinite;
    }
    .wave-text-stagger {
      animation-delay: calc(0.1s * var(--index));
    }
  `;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const statVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  return (
    <>
      <style>{waveStyle}</style>
      <section
        className={`relative py-20 md:py-32 bg-gradient-to-br ${sectionBackground}`}
      >
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              {['O', 'u', 'r', ' ', 'I', 'm', 'p', 'a', 'c', 't'].map(
                (letter, i) => (
                  <span
                    key={i}
                    className="wave-text"
                    style={{ '--index': i } as React.CSSProperties}
                  >
                    {letter}
                  </span>
                )
              )}
            </h2>
            <p
              className={`text-lg md:text-xl ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              Building the future of student mentorship
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {STATS.map((stat, index) => (
              <motion.div
                key={index}
                variants={statVariants}
                className={`group relative p-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 overflow-hidden text-center ${
                  darkMode
                    ? 'border-blue-500/20 bg-blue-900/10 hover:bg-blue-900/20'
                    : 'border-blue-200 bg-blue-50/30 hover:bg-blue-50/60'
                }`}
                whileHover={{ y: -8 }}
              >
                <div
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    darkMode
                      ? 'bg-gradient-to-br from-blue-500/10 to-indigo-500/10'
                      : 'bg-gradient-to-br from-blue-400/10 to-indigo-400/10'
                  }`}
                />

                {/* Icon */}
                <div
                  className={`relative z-10 flex justify-center mb-4 ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {React.cloneElement(stat.icon as React.ReactElement, {
                    sx: { fontSize: 40 },
                  })}
                </div>

                {/* Number */}
                <motion.div
                  className={`relative z-10 text-4xl md:text-5xl font-black mb-2 ${
                    darkMode ? 'text-blue-300' : 'text-blue-600'
                  }`}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  {stat.number}
                </motion.div>

                {/* Label */}
                <p
                  className={`relative z-10 text-base md:text-lg font-semibold ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                >
                  {stat.label}
                </p>

                {/* Sub-label */}
                {stat.sub && (
                  <p
                    className={`relative z-10 text-sm mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {stat.sub}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default StatsSection;
